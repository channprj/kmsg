import CryptoKit
import Foundation

struct DecryptedCredentials: Sendable {
    let identifier: String
    let password: String
}

private struct StoredCredentialsDocument: Codable {
    var schemaVersion: Int
    var id: String?
    var encryptedPassword: String?
    var keyIdentifier: String
    var updatedAt: Date
}

enum CredentialStoreError: Error, LocalizedError {
    case invalidStoredCredentials
    case encryptionFailed
    case decryptionFailed

    var errorDescription: String? {
        switch self {
        case .invalidStoredCredentials:
            return "Stored credentials are missing required fields."
        case .encryptionFailed:
            return "Failed to encrypt password."
        case .decryptionFailed:
            return "Failed to decrypt password."
        }
    }
}

final class CredentialStore: @unchecked Sendable {
    static let shared = CredentialStore()
    static let schemaVersion = 1

    let credentialsURL: URL
    let keyDirectoryURL: URL

    private let encoder: JSONEncoder
    private let decoder: JSONDecoder

    init(
        credentialsURL: URL = AuthPaths.credentialsURL,
        keyDirectoryURL: URL = AuthPaths.keyDirectoryURL
    ) {
        self.credentialsURL = credentialsURL
        self.keyDirectoryURL = keyDirectoryURL

        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601
        self.encoder = encoder

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        self.decoder = decoder
    }

    func storedIdentifier() -> String? {
        guard let document = try? loadDocument() else { return nil }
        return normalize(document.id)
    }

    func loadCredentials() throws -> DecryptedCredentials? {
        guard let document = try? loadDocument() else { return nil }
        guard document.schemaVersion == Self.schemaVersion else { return nil }
        guard
            let identifier = normalize(document.id),
            let encryptedPassword = normalize(document.encryptedPassword)
        else {
            return nil
        }

        do {
            let password = try CredentialCrypto.decrypt(
                encryptedPassword,
                keyIdentifier: document.keyIdentifier,
                keyDirectoryURL: keyDirectoryURL
            )
            return DecryptedCredentials(identifier: identifier, password: password)
        } catch {
            throw CredentialStoreError.decryptionFailed
        }
    }

    func save(identifier: String, password: String) throws {
        let normalizedIdentifier = identifier.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !normalizedIdentifier.isEmpty, !password.isEmpty else {
            throw CredentialStoreError.invalidStoredCredentials
        }

        try AuthPaths.prepareFilesystem()

        let keyIdentifier = "primary.key"
        let encryptedPassword: String
        do {
            encryptedPassword = try CredentialCrypto.encrypt(
                password,
                keyIdentifier: keyIdentifier,
                keyDirectoryURL: keyDirectoryURL
            )
        } catch {
            throw CredentialStoreError.encryptionFailed
        }

        let document = StoredCredentialsDocument(
            schemaVersion: Self.schemaVersion,
            id: normalizedIdentifier,
            encryptedPassword: encryptedPassword,
            keyIdentifier: keyIdentifier,
            updatedAt: Date()
        )

        let data = try encoder.encode(document)
        try data.write(to: credentialsURL, options: .atomic)
        try AuthPaths.applyOwnerOnlyPermissions(to: credentialsURL, mode: 0o600)
    }

    private func loadDocument() throws -> StoredCredentialsDocument {
        let data = try Data(contentsOf: credentialsURL)
        return try decoder.decode(StoredCredentialsDocument.self, from: data)
    }

    private func normalize(_ value: String?) -> String? {
        guard let value = value?.trimmingCharacters(in: .whitespacesAndNewlines), !value.isEmpty else {
            return nil
        }
        return value
    }
}

enum CredentialCrypto {
    static func encrypt(_ password: String, keyIdentifier: String, keyDirectoryURL: URL) throws -> String {
        let key = try loadOrCreateKey(keyIdentifier: keyIdentifier, keyDirectoryURL: keyDirectoryURL)
        let sealedBox = try AES.GCM.seal(Data(password.utf8), using: key)
        guard let combined = sealedBox.combined else {
            throw CredentialStoreError.encryptionFailed
        }
        return combined.base64EncodedString()
    }

    static func decrypt(_ encryptedPassword: String, keyIdentifier: String, keyDirectoryURL: URL) throws -> String {
        let key = try loadOrCreateKey(keyIdentifier: keyIdentifier, keyDirectoryURL: keyDirectoryURL)
        guard let combined = Data(base64Encoded: encryptedPassword) else {
            throw CredentialStoreError.decryptionFailed
        }
        let sealedBox = try AES.GCM.SealedBox(combined: combined)
        let decrypted = try AES.GCM.open(sealedBox, using: key)
        guard let password = String(data: decrypted, encoding: .utf8) else {
            throw CredentialStoreError.decryptionFailed
        }
        return password
    }

    private static func loadOrCreateKey(keyIdentifier: String, keyDirectoryURL: URL) throws -> SymmetricKey {
        let keyURL = keyDirectoryURL.appendingPathComponent(keyIdentifier)
        if let data = try? Data(contentsOf: keyURL), !data.isEmpty {
            return SymmetricKey(data: data)
        }

        try FileManager.default.createDirectory(at: keyDirectoryURL, withIntermediateDirectories: true)
        try AuthPaths.applyOwnerOnlyPermissions(to: keyDirectoryURL, mode: 0o700)

        let key = SymmetricKey(size: .bits256)
        let data = key.withUnsafeBytes { Data($0) }
        try data.write(to: keyURL, options: .atomic)
        try AuthPaths.applyOwnerOnlyPermissions(to: keyURL, mode: 0o600)
        return key
    }
}

enum AuthPaths {
    static let configDirectoryURL = FileManager.default.homeDirectoryForCurrentUser
        .appendingPathComponent(".config", isDirectory: true)
        .appendingPathComponent("kmsg", isDirectory: true)

    static let credentialsURL = configDirectoryURL.appendingPathComponent("credentials.json")
    static let keyDirectoryURL = configDirectoryURL.appendingPathComponent("credentials", isDirectory: true)

    static func prepareFilesystem() throws {
        try FileManager.default.createDirectory(at: configDirectoryURL, withIntermediateDirectories: true)
        try applyOwnerOnlyPermissions(to: configDirectoryURL, mode: 0o700)
        try FileManager.default.createDirectory(at: keyDirectoryURL, withIntermediateDirectories: true)
        try applyOwnerOnlyPermissions(to: keyDirectoryURL, mode: 0o700)
    }

    static func applyOwnerOnlyPermissions(to url: URL, mode: Int16) throws {
        try FileManager.default.setAttributes(
            [.posixPermissions: NSNumber(value: mode)],
            ofItemAtPath: url.path
        )
    }
}

import CryptoKit
import Foundation

struct ChatIdentityRecord: Codable {
    var chatID: String
    var displayName: String
    var normalizedName: String
    var lastPreviewNormalized: String?
    var firstSeenAt: Date
    var lastSeenAt: Date
    var lastSeenIndex: Int?
}

private struct ChatIdentityRegistryDocument: Codable {
    var schemaVersion: Int
    var records: [ChatIdentityRecord]
    var updatedAt: Date
}

final class ChatIdentityRegistryStore: @unchecked Sendable {
    static let shared = ChatIdentityRegistryStore()
    static let schemaVersion = 1

    let fileURL: URL

    private let encoder: JSONEncoder
    private let decoder: JSONDecoder
    private var cachedDocument: ChatIdentityRegistryDocument?

    init(fileURL: URL = ChatIdentityRegistryStore.defaultURL()) {
        self.fileURL = fileURL

        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601
        self.encoder = encoder

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        self.decoder = decoder
    }

    func assignChatIDs(for discoveries: [ChatListDiscovery]) -> [String] {
        var document = loadDocument()
        var records = document.records
        let now = Date()
        var assignedIDs = Array(repeating: "", count: discoveries.count)

        let groupedCurrent = Dictionary(grouping: discoveries.indices) { index in
            ChatTextNormalizer.normalize(discoveries[index].title)
        }
        let groupedExisting = Dictionary(grouping: records.indices) { index in
            records[index].normalizedName
        }

        for (normalizedName, currentIndices) in groupedCurrent {
            var unmatchedCurrent = currentIndices.sorted { discoveries[$0].listIndex < discoveries[$1].listIndex }
            var unmatchedRecords = (groupedExisting[normalizedName] ?? []).sorted { lhs, rhs in
                let lhsPreview = records[lhs].lastPreviewNormalized ?? ""
                let rhsPreview = records[rhs].lastPreviewNormalized ?? ""
                if lhsPreview == rhsPreview {
                    return (records[lhs].lastSeenIndex ?? .max) < (records[rhs].lastSeenIndex ?? .max)
                }
                return lhsPreview < rhsPreview
            }

            for currentIndex in currentIndices {
                let preview = normalizePreview(discoveries[currentIndex].lastMessage)
                guard let preview, !preview.isEmpty else { continue }
                guard let matchOffset = unmatchedRecords.firstIndex(where: { records[$0].lastPreviewNormalized == preview }) else {
                    continue
                }
                let recordIndex = unmatchedRecords.remove(at: matchOffset)
                unmatchedCurrent.removeAll { $0 == currentIndex }
                records[recordIndex] = updatedRecord(records[recordIndex], with: discoveries[currentIndex], preview: preview, now: now)
                assignedIDs[currentIndex] = records[recordIndex].chatID
            }

            let sortedRemainingRecords = unmatchedRecords.sorted { lhs, rhs in
                (records[lhs].lastSeenIndex ?? .max) < (records[rhs].lastSeenIndex ?? .max)
            }
            let zippedCount = min(unmatchedCurrent.count, sortedRemainingRecords.count)
            if zippedCount > 0 {
                for offset in 0..<zippedCount {
                    let currentIndex = unmatchedCurrent[offset]
                    let recordIndex = sortedRemainingRecords[offset]
                    let preview = normalizePreview(discoveries[currentIndex].lastMessage)
                    records[recordIndex] = updatedRecord(records[recordIndex], with: discoveries[currentIndex], preview: preview, now: now)
                    assignedIDs[currentIndex] = records[recordIndex].chatID
                }
                unmatchedCurrent.removeFirst(zippedCount)
            }

            for currentIndex in unmatchedCurrent {
                let preview = normalizePreview(discoveries[currentIndex].lastMessage)
                let chatID = nextChatID(for: normalizedName, existingRecords: records)
                let record = ChatIdentityRecord(
                    chatID: chatID,
                    displayName: discoveries[currentIndex].title,
                    normalizedName: normalizedName,
                    lastPreviewNormalized: preview,
                    firstSeenAt: now,
                    lastSeenAt: now,
                    lastSeenIndex: discoveries[currentIndex].listIndex
                )
                records.append(record)
                assignedIDs[currentIndex] = chatID
            }
        }

        document.records = records
        document.updatedAt = now
        cachedDocument = document
        try? persist(document)
        return assignedIDs
    }

    func record(for chatID: String) -> ChatIdentityRecord? {
        let document = loadDocument()
        return document.records.first(where: { $0.chatID == chatID })
    }

    private func updatedRecord(
        _ record: ChatIdentityRecord,
        with discovery: ChatListDiscovery,
        preview: String?,
        now: Date
    ) -> ChatIdentityRecord {
        var updated = record
        updated.displayName = discovery.title
        updated.lastSeenAt = now
        updated.lastSeenIndex = discovery.listIndex
        if let preview, !preview.isEmpty {
            updated.lastPreviewNormalized = preview
        }
        return updated
    }

    private func nextChatID(for normalizedName: String, existingRecords: [ChatIdentityRecord]) -> String {
        let base = shortHash(normalizedName)
        let prefix = "chat_\(base)"
        let existingIDs = Set(existingRecords.map(\.chatID))

        if !existingIDs.contains(prefix) {
            return prefix
        }

        var suffix = 2
        while existingIDs.contains("\(prefix)_\(suffix)") {
            suffix += 1
        }
        return "\(prefix)_\(suffix)"
    }

    private func shortHash(_ text: String) -> String {
        let digest = SHA256.hash(data: Data(text.utf8))
        return digest.prefix(6).map { String(format: "%02x", $0) }.joined()
    }

    private func normalizePreview(_ preview: String?) -> String? {
        guard let preview else { return nil }
        let normalized = ChatTextNormalizer.normalize(preview)
        guard !normalized.isEmpty else { return nil }
        return normalized
    }

    private func loadDocument(forceReload: Bool = false) -> ChatIdentityRegistryDocument {
        if !forceReload, let cachedDocument {
            return cachedDocument
        }

        guard FileManager.default.fileExists(atPath: fileURL.path) else {
            let document = emptyDocument()
            cachedDocument = document
            return document
        }

        do {
            let data = try Data(contentsOf: fileURL)
            let document = try decoder.decode(ChatIdentityRegistryDocument.self, from: data)
            guard document.schemaVersion == Self.schemaVersion else {
                let reset = emptyDocument()
                cachedDocument = reset
                return reset
            }
            cachedDocument = document
            return document
        } catch {
            let reset = emptyDocument()
            cachedDocument = reset
            return reset
        }
    }

    private func persist(_ document: ChatIdentityRegistryDocument) throws {
        let directory = fileURL.deletingLastPathComponent()
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        let data = try encoder.encode(document)
        try data.write(to: fileURL, options: .atomic)
    }

    private func emptyDocument() -> ChatIdentityRegistryDocument {
        ChatIdentityRegistryDocument(
            schemaVersion: Self.schemaVersion,
            records: [],
            updatedAt: Date()
        )
    }

    private static func defaultURL() -> URL {
        let home = FileManager.default.homeDirectoryForCurrentUser
        return home
            .appendingPathComponent(".kmsg", isDirectory: true)
            .appendingPathComponent("chat-registry.json")
    }
}

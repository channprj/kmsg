import AppKit
import Foundation

enum AXPathSlot: String, CaseIterable, Codable {
    case searchField
    case messageInput
    case chatListContainer
    case chatRowTitle
    case chatRowPreview
}

struct AXPathStep: Codable {
    let childIndex: Int
    let role: String?
    let identifier: String?
    let title: String?
}

struct AXElementPath: Codable {
    let steps: [AXPathStep]
}

struct AXPathCacheEntry: Codable {
    var slot: AXPathSlot
    var rootFingerprint: String
    var path: AXElementPath
    var updatedAt: Date
}

struct AXPathCacheDocument: Codable {
    var schemaVersion: Int
    var appFingerprint: String
    var entries: [AXPathCacheEntry]
    var updatedAt: Date
}

struct AXPathCacheStatus {
    let fileURL: URL
    let exists: Bool
    let schemaVersion: Int?
    let appFingerprint: String?
    let entryCount: Int
    let updatedAt: Date?
}

final class AXPathCacheStore: @unchecked Sendable {
    static let shared = AXPathCacheStore()
    static let schemaVersion = 2
    static let cacheEntryTTL: TimeInterval = 60 * 60 * 24 * 7

    let fileURL: URL

    private let encoder: JSONEncoder
    private let decoder: JSONDecoder
    private var cachedDocument: AXPathCacheDocument?

    init(fileURL: URL = AXPathCacheStore.defaultURL()) {
        self.fileURL = fileURL

        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601
        self.encoder = encoder

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        self.decoder = decoder
    }

    func status() -> AXPathCacheStatus {
        let exists = FileManager.default.fileExists(atPath: fileURL.path)
        guard exists else {
            return AXPathCacheStatus(
                fileURL: fileURL,
                exists: false,
                schemaVersion: nil,
                appFingerprint: nil,
                entryCount: 0,
                updatedAt: nil
            )
        }

        let doc = loadDocument(forceReload: true)
        return AXPathCacheStatus(
            fileURL: fileURL,
            exists: true,
            schemaVersion: doc.schemaVersion,
            appFingerprint: doc.appFingerprint,
            entryCount: doc.entries.count,
            updatedAt: doc.updatedAt
        )
    }

    func clearAll() throws {
        cachedDocument = emptyDocument()
        if FileManager.default.fileExists(atPath: fileURL.path) {
            try FileManager.default.removeItem(at: fileURL)
        }
    }

    func clear(slots: [AXPathSlot]) throws {
        var document = loadDocument()
        document.entries.removeAll { slots.contains($0.slot) }
        document.updatedAt = Date()
        cachedDocument = document
        try persist(document)
    }

    func export(to destinationURL: URL) throws {
        let document = loadDocument()
        let data = try encoder.encode(document)
        let directory = destinationURL.deletingLastPathComponent()
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        try data.write(to: destinationURL, options: .atomic)
    }

    func importDocument(from sourceURL: URL) throws {
        let data = try Data(contentsOf: sourceURL)
        var imported = try decoder.decode(AXPathCacheDocument.self, from: data)

        guard imported.schemaVersion == Self.schemaVersion else {
            throw AXPathCacheError.invalidSchema(expected: Self.schemaVersion, actual: imported.schemaVersion)
        }

        let currentFingerprint = Self.currentAppFingerprint()
        guard imported.appFingerprint == currentFingerprint else {
            throw AXPathCacheError.appFingerprintMismatch(expected: currentFingerprint, actual: imported.appFingerprint)
        }

        imported.updatedAt = Date()
        cachedDocument = imported
        try persist(imported)
    }

    func resolve(
        slot: AXPathSlot,
        root: UIElement,
        validate: (UIElement) -> Bool,
        trace: ((String) -> Void)? = nil
    ) -> UIElement? {
        var document = loadDocument()
        let currentFingerprint = Self.currentAppFingerprint()
        if document.appFingerprint != currentFingerprint {
            trace?("cache: fingerprint changed, invalidating entries")
            document = emptyDocument()
            cachedDocument = document
            try? persist(document)
            return nil
        }

        let rootFingerprint = AXPathResolver.rootFingerprint(of: root)
        guard let entry = document.entries.first(where: {
            $0.slot == slot && $0.rootFingerprint == rootFingerprint
        }) else {
            trace?("cache: miss slot=\(slot.rawValue)")
            return nil
        }

        if Date().timeIntervalSince(entry.updatedAt) > Self.cacheEntryTTL {
            trace?("cache: expired slot=\(slot.rawValue), removing")
            document.entries.removeAll {
                $0.slot == slot && $0.rootFingerprint == rootFingerprint
            }
            document.updatedAt = Date()
            cachedDocument = document
            try? persist(document)
            return nil
        }

        guard let candidate = AXPathResolver.resolve(path: entry.path, from: root), validate(candidate) else {
            trace?("cache: stale slot=\(slot.rawValue), removing")
            document.entries.removeAll {
                $0.slot == slot && $0.rootFingerprint == rootFingerprint
            }
            document.updatedAt = Date()
            cachedDocument = document
            try? persist(document)
            return nil
        }

        trace?("cache: hit slot=\(slot.rawValue)")
        return candidate
    }

    func remember(slot: AXPathSlot, root: UIElement, element: UIElement, trace: ((String) -> Void)? = nil) {
        guard let path = AXPathResolver.buildPath(from: root, to: element) else {
            trace?("cache: skip store slot=\(slot.rawValue) (path build failed)")
            return
        }

        var document = loadDocument()
        let rootFingerprint = AXPathResolver.rootFingerprint(of: root)
        let entry = AXPathCacheEntry(
            slot: slot,
            rootFingerprint: rootFingerprint,
            path: path,
            updatedAt: Date()
        )

        document.entries.removeAll {
            $0.slot == slot && $0.rootFingerprint == rootFingerprint
        }
        document.entries.append(entry)
        document.updatedAt = Date()
        document.appFingerprint = Self.currentAppFingerprint()

        cachedDocument = document
        do {
            try persist(document)
            trace?("cache: stored slot=\(slot.rawValue)")
        } catch {
            trace?("cache: store failed slot=\(slot.rawValue) (\(error))")
        }
    }

    private func loadDocument(forceReload: Bool = false) -> AXPathCacheDocument {
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
            let document = try decoder.decode(AXPathCacheDocument.self, from: data)
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

    private func persist(_ document: AXPathCacheDocument) throws {
        let directory = fileURL.deletingLastPathComponent()
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        let data = try encoder.encode(document)
        try data.write(to: fileURL, options: .atomic)
    }

    private func emptyDocument() -> AXPathCacheDocument {
        AXPathCacheDocument(
            schemaVersion: Self.schemaVersion,
            appFingerprint: Self.currentAppFingerprint(),
            entries: [],
            updatedAt: Date()
        )
    }

    private static func defaultURL() -> URL {
        let home = FileManager.default.homeDirectoryForCurrentUser
        return home
            .appendingPathComponent(".kmsg", isDirectory: true)
            .appendingPathComponent("ax-cache.json")
    }

    private static func currentAppFingerprint() -> String {
        guard
            let appURL = NSWorkspace.shared.urlForApplication(withBundleIdentifier: KakaoTalkApp.bundleIdentifier),
            let bundle = Bundle(url: appURL)
        else {
            return "unknown"
        }

        let version = bundle.infoDictionary?["CFBundleShortVersionString"] as? String ?? "unknown"
        let build = bundle.infoDictionary?["CFBundleVersion"] as? String ?? "unknown"
        return "\(version)+\(build)"
    }
}

enum AXPathCacheError: Error, CustomStringConvertible {
    case invalidSchema(expected: Int, actual: Int)
    case appFingerprintMismatch(expected: String, actual: String)

    var description: String {
        switch self {
        case .invalidSchema(let expected, let actual):
            return "Invalid cache schema (expected: \(expected), actual: \(actual))"
        case .appFingerprintMismatch(let expected, let actual):
            return "App fingerprint mismatch (expected: \(expected), actual: \(actual))"
        }
    }
}

enum AXPathResolver {
    static func rootFingerprint(of root: UIElement) -> String {
        let role = root.role ?? "unknown-role"
        let identifier = root.identifier ?? ""
        let size = root.size.map(sizeBucket) ?? "unknown-size"
        return [role, identifier, size].joined(separator: "|")
    }

    static func buildPath(from root: UIElement, to target: UIElement) -> AXElementPath? {
        var lineage: [UIElement] = []
        var cursor: UIElement? = target

        while let current = cursor {
            lineage.append(current)
            if isSameElement(current, root) {
                break
            }
            cursor = current.parent
        }

        guard let reachedRoot = lineage.last, isSameElement(reachedRoot, root) else {
            return nil
        }

        let ordered = Array(lineage.reversed())
        guard ordered.count >= 2 else {
            return AXElementPath(steps: [])
        }

        var steps: [AXPathStep] = []
        for index in 0..<(ordered.count - 1) {
            let parent = ordered[index]
            let child = ordered[index + 1]
            let children = parent.children
            guard let childIndex = children.firstIndex(where: { isSameElement($0, child) }) else {
                return nil
            }

            let step = AXPathStep(
                childIndex: childIndex,
                role: child.role,
                identifier: nonEmpty(child.identifier),
                title: nonEmpty(child.title)
            )
            steps.append(step)
        }

        return AXElementPath(steps: steps)
    }

    static func resolve(path: AXElementPath, from root: UIElement) -> UIElement? {
        var current = root
        for step in path.steps {
            let children = current.children
            guard let next = resolveChild(step: step, in: children) else {
                return nil
            }
            current = next
        }
        return current
    }

    private static func resolveChild(step: AXPathStep, in children: [UIElement]) -> UIElement? {
        if step.childIndex >= 0, step.childIndex < children.count {
            let indexed = children[step.childIndex]
            if matches(indexed, step: step) {
                return indexed
            }
        }

        if let identifier = step.identifier, !identifier.isEmpty {
            if let byID = children.first(where: { child in
                (child.identifier ?? "") == identifier && roleMatches(child: child, expectedRole: step.role)
            }) {
                return byID
            }
        }

        if let role = step.role, !role.isEmpty {
            if let byRole = children.first(where: { child in
                (child.role ?? "") == role && titleMatches(child: child, expectedTitle: step.title)
            }) {
                return byRole
            }
        }

        return nil
    }

    private static func matches(_ element: UIElement, step: AXPathStep) -> Bool {
        if !roleMatches(child: element, expectedRole: step.role) {
            return false
        }
        if let identifier = step.identifier, !identifier.isEmpty {
            if (element.identifier ?? "") != identifier {
                return false
            }
        }
        return titleMatches(child: element, expectedTitle: step.title)
    }

    private static func roleMatches(child: UIElement, expectedRole: String?) -> Bool {
        guard let expectedRole, !expectedRole.isEmpty else { return true }
        return (child.role ?? "") == expectedRole
    }

    private static func titleMatches(child: UIElement, expectedTitle: String?) -> Bool {
        guard let expectedTitle, !expectedTitle.isEmpty else { return true }
        return (child.title ?? "") == expectedTitle
    }

    private static func nonEmpty(_ value: String?) -> String? {
        guard let value, !value.isEmpty else { return nil }
        return value
    }

    private static func sizeBucket(_ size: CGSize) -> String {
        let widthBucket = Int(size.width / 40.0)
        let heightBucket = Int(size.height / 40.0)
        return "\(widthBucket)x\(heightBucket)"
    }

    private static func isSameElement(_ lhs: UIElement, _ rhs: UIElement) -> Bool {
        CFEqual(lhs.axElement, rhs.axElement)
    }
}

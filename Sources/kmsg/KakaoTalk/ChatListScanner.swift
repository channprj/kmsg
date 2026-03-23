import ApplicationServices.HIServices
import Foundation

enum ChatTextNormalizer {
    static func normalize(_ text: String) -> String {
        let lowered = text
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .folding(options: [.diacriticInsensitive, .widthInsensitive], locale: .current)
            .lowercased()

        var scalars = String.UnicodeScalarView()
        scalars.reserveCapacity(lowered.unicodeScalars.count)

        for scalar in lowered.unicodeScalars {
            if CharacterSet.whitespacesAndNewlines.contains(scalar) { continue }
            if CharacterSet.punctuationCharacters.contains(scalar) { continue }
            if CharacterSet.symbols.contains(scalar) { continue }
            if scalar.value == 0x200B || scalar.value == 0x200C || scalar.value == 0x200D || scalar.value == 0xFEFF {
                continue
            }
            scalars.append(scalar)
        }

        return String(scalars)
    }

    static func isTimeLikeValue(_ value: String) -> Bool {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        let parts = trimmed.split(separator: ":")
        if parts.count == 2,
           parts[0].count <= 2, parts[1].count == 2,
           parts[0].allSatisfy(\.isNumber), parts[1].allSatisfy(\.isNumber)
        {
            return true
        }

        if trimmed.hasSuffix("일") || trimmed == "어제" || trimmed == "그저께" {
            return true
        }

        return false
    }

    static func isUnreadCountLike(_ value: String) -> Bool {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return false }
        return trimmed.allSatisfy { $0.isNumber || $0 == "+" || $0 == "," }
    }
}

struct ChatListDiscovery {
    let title: String
    let lastMessage: String?
    let listIndex: Int
}

struct ChatListEntry: Codable, Equatable {
    let title: String
    let chatID: String?
    let lastMessage: String?

    enum CodingKeys: String, CodingKey {
        case title
        case chatID = "chat_id"
        case lastMessage = "last_message"
    }
}

struct ChatListSnapshotItem {
    let element: UIElement
    let discovery: ChatListDiscovery
}

struct ChatListScanner {
    func scan(in window: UIElement, limit: Int, trace: ((String) -> Void)? = nil) -> [ChatListSnapshotItem] {
        guard let container = resolveChatListContainer(in: window, trace: trace) else {
            trace?("chats: chat list container unavailable")
            return []
        }

        let rows = collectChatItems(from: container, limit: limit)
        guard !rows.isEmpty else {
            trace?("chats: chat list container found but no rows/items resolved")
            return []
        }

        var snapshots: [ChatListSnapshotItem] = []
        snapshots.reserveCapacity(rows.count)

        for (index, row) in rows.enumerated() {
            let title = extractTitle(from: row, trace: trace)
            let preview = extractPreview(from: row, title: title, trace: trace)
            let discovery = ChatListDiscovery(title: title, lastMessage: preview, listIndex: index)
            snapshots.append(ChatListSnapshotItem(element: row, discovery: discovery))
        }

        trace?("chats: resolved rows=\(snapshots.count)")
        return snapshots
    }

    func warmup(in window: UIElement, trace: ((String) -> Void)? = nil) -> [AXPathSlot] {
        guard let container = resolveChatListContainer(in: window, trace: trace) else {
            return []
        }

        var warmedSlots: [AXPathSlot] = [.chatListContainer]
        if let firstRow = collectChatItems(from: container, limit: 1).first {
            if extractTitleElement(from: firstRow, trace: trace)?.element != nil {
                warmedSlots.append(.chatRowTitle)
            }
            if extractPreviewElement(from: firstRow, title: extractTitle(from: firstRow, trace: trace), trace: trace)?.element != nil {
                warmedSlots.append(.chatRowPreview)
            }
        }

        return deduplicateSlots(warmedSlots)
    }

    private func resolveChatListContainer(in window: UIElement, trace: ((String) -> Void)? = nil) -> UIElement? {
        if let cached = AXPathCacheStore.shared.resolve(
            slot: .chatListContainer,
            root: window,
            validate: isLikelyChatListContainer,
            trace: trace
        ) {
            trace?("chats: container fast path hit")
            return cached
        }

        trace?("chats: container fast path miss, scanning")
        let tables = window.findAll(role: kAXTableRole, limit: 1, maxNodes: 220)
        let outlines = window.findAll(role: kAXOutlineRole, limit: 1, maxNodes: 220)
        let lists = window.findAll(role: kAXListRole, limit: 1, maxNodes: 220)
        let container = tables.first ?? outlines.first ?? lists.first

        if let container {
            AXPathCacheStore.shared.remember(slot: .chatListContainer, root: window, element: container, trace: trace)
        }

        return container
    }

    private func isLikelyChatListContainer(_ element: UIElement) -> Bool {
        switch element.role {
        case kAXTableRole, kAXOutlineRole, kAXListRole:
            return true
        default:
            return false
        }
    }

    private func collectChatItems(from container: UIElement, limit: Int) -> [UIElement] {
        let role = container.role ?? ""

        if role == kAXListRole {
            let children = Array(container.children.prefix(limit))
            return deduplicateElements(children)
        }

        let directRows = container.children.filter { $0.role == kAXRowRole }
        if !directRows.isEmpty {
            return Array(deduplicateElements(directRows).prefix(limit))
        }

        let discoveredRows = container.findAll(role: kAXRowRole, limit: limit, maxNodes: max(80, limit * 8))
        return deduplicateElements(discoveredRows)
    }

    private func extractTitle(from row: UIElement, trace: ((String) -> Void)? = nil) -> String {
        if let resolved = extractTitleElement(from: row, trace: trace) {
            return resolved.text
        }
        return "(Unknown Chat)"
    }

    private func extractTitleElement(from row: UIElement, trace: ((String) -> Void)? = nil) -> (element: UIElement, text: String)? {
        if let cached = AXPathCacheStore.shared.resolve(
            slot: .chatRowTitle,
            root: row,
            validate: { candidate in
                titleText(from: candidate) != nil
            },
            trace: trace
        ), let text = titleText(from: cached) {
            return (cached, text)
        }

        if let text = titleText(from: row) {
            AXPathCacheStore.shared.remember(slot: .chatRowTitle, root: row, element: row, trace: trace)
            return (row, text)
        }

        let staticTexts = row.findAll(role: kAXStaticTextRole, limit: 12, maxNodes: 80)
        for textNode in staticTexts {
            guard let text = titleText(from: textNode) else { continue }
            AXPathCacheStore.shared.remember(slot: .chatRowTitle, root: row, element: textNode, trace: trace)
            return (textNode, text)
        }

        return nil
    }

    private func extractPreview(from row: UIElement, title: String, trace: ((String) -> Void)? = nil) -> String? {
        extractPreviewElement(from: row, title: title, trace: trace)?.text
    }

    private func extractPreviewElement(from row: UIElement, title: String, trace: ((String) -> Void)? = nil) -> (element: UIElement, text: String)? {
        if let cached = AXPathCacheStore.shared.resolve(
            slot: .chatRowPreview,
            root: row,
            validate: { candidate in
                previewText(from: candidate, title: title) != nil
            },
            trace: trace
        ), let text = previewText(from: cached, title: title) {
            return (cached, text)
        }

        let textAreas = row.findAll(role: kAXTextAreaRole, limit: 4, maxNodes: 60)
        for textArea in textAreas {
            guard let text = previewText(from: textArea, title: title) else { continue }
            AXPathCacheStore.shared.remember(slot: .chatRowPreview, root: row, element: textArea, trace: trace)
            return (textArea, text)
        }

        let staticTexts = row.findAll(role: kAXStaticTextRole, limit: 16, maxNodes: 100)
        for textNode in staticTexts {
            guard let text = previewText(from: textNode, title: title) else { continue }
            AXPathCacheStore.shared.remember(slot: .chatRowPreview, root: row, element: textNode, trace: trace)
            return (textNode, text)
        }

        return nil
    }

    private func titleText(from element: UIElement) -> String? {
        if let title = normalizedText(element.title), !ChatTextNormalizer.isTimeLikeValue(title), !ChatTextNormalizer.isUnreadCountLike(title) {
            return title
        }

        if element.identifier == "Count Label" {
            return nil
        }

        switch element.role {
        case kAXRowRole, kAXCellRole, kAXGroupRole, kAXListRole, kAXTableRole, kAXOutlineRole:
            return nil
        default:
            break
        }

        if let value = normalizedText(element.stringValue), !ChatTextNormalizer.isTimeLikeValue(value), !ChatTextNormalizer.isUnreadCountLike(value) {
            return value
        }

        return nil
    }

    private func previewText(from element: UIElement, title: String) -> String? {
        guard let value = normalizedText(element.stringValue) ?? normalizedText(element.title) else {
            return nil
        }
        if element.identifier == "Count Label" {
            return nil
        }
        if ChatTextNormalizer.isTimeLikeValue(value) || ChatTextNormalizer.isUnreadCountLike(value) {
            return nil
        }
        if ChatTextNormalizer.normalize(value) == ChatTextNormalizer.normalize(title) {
            return nil
        }
        return value
    }

    private func normalizedText(_ raw: String?) -> String? {
        guard let raw else { return nil }
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return nil }
        return trimmed
    }

    private func deduplicateElements(_ elements: [UIElement]) -> [UIElement] {
        var unique: [UIElement] = []
        unique.reserveCapacity(elements.count)

        for element in elements {
            if unique.contains(where: { existing in
                CFEqual(existing.axElement, element.axElement)
            }) {
                continue
            }
            unique.append(element)
        }

        return unique
    }

    private func deduplicateSlots(_ slots: [AXPathSlot]) -> [AXPathSlot] {
        var seen = Set<AXPathSlot>()
        return slots.filter { seen.insert($0).inserted }
    }
}

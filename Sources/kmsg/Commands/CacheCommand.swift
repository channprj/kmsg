import ArgumentParser
import ApplicationServices.HIServices
import Darwin
import Foundation

struct CacheCommand: ParsableCommand {
    static let configuration = CommandConfiguration(
        commandName: "cache",
        abstract: "Manage AX path cache",
        subcommands: [
            CacheStatusCommand.self,
            CacheClearCommand.self,
            CacheExportCommand.self,
            CacheImportCommand.self,
            CacheWarmupCommand.self,
        ],
        defaultSubcommand: CacheStatusCommand.self
    )
}

struct CacheStatusCommand: ParsableCommand {
    static let configuration = CommandConfiguration(
        commandName: "status",
        abstract: "Show AX cache status"
    )

    func run() throws {
        let cache = AXPathCacheStore.shared
        let status = cache.status()

        print("AX Cache")
        print("Path: \(status.fileURL.path)")
        print("Exists: \(status.exists ? "yes" : "no")")

        guard status.exists else { return }

        print("Schema: \(status.schemaVersion.map(String.init) ?? "unknown")")
        print("App fingerprint: \(status.appFingerprint ?? "unknown")")
        print("Entries: \(status.entryCount)")
        if let updatedAt = status.updatedAt {
            print("Updated: \(ISO8601DateFormatter().string(from: updatedAt))")
        }
    }
}

struct CacheClearCommand: ParsableCommand {
    static let configuration = CommandConfiguration(
        commandName: "clear",
        abstract: "Clear AX cache"
    )

    func run() throws {
        try AXPathCacheStore.shared.clearAll()
        print("AX cache cleared.")
    }
}

struct CacheExportCommand: ParsableCommand {
    static let configuration = CommandConfiguration(
        commandName: "export",
        abstract: "Export AX cache JSON"
    )

    @Argument(help: "Destination path for exported JSON")
    var outputPath: String

    func run() throws {
        let destination = resolvedURL(outputPath)
        try AXPathCacheStore.shared.export(to: destination)
        print("AX cache exported to \(destination.path)")
    }
}

struct CacheImportCommand: ParsableCommand {
    static let configuration = CommandConfiguration(
        commandName: "import",
        abstract: "Import AX cache JSON"
    )

    @Argument(help: "Path of JSON cache to import")
    var inputPath: String

    func run() throws {
        let source = resolvedURL(inputPath)
        try AXPathCacheStore.shared.importDocument(from: source)
        print("AX cache imported from \(source.path)")
    }
}

struct CacheWarmupCommand: ParsableCommand {
    static let configuration = CommandConfiguration(
        commandName: "warmup",
        abstract: "Warm up AX cache paths for faster send and chats"
    )

    @Option(name: .long, help: "Optional recipient to warm up chat-open path")
    var recipient: String?

    @Flag(name: .long, help: "Show AX traversal and retry details")
    var traceAX: Bool = false

    @Flag(name: [.short, .long], help: "Keep auto-opened chat window after warmup")
    var keepWindow: Bool = false

    func run() throws {
        guard AccessibilityPermission.ensureGranted() else {
            AccessibilityPermission.printInstructions()
            throw ExitCode.failure
        }

        let runner = AXActionRunner(traceEnabled: traceAX)
        let kakao = try KakaoTalkApp()
        let windowResolver = ChatWindowResolver(kakao: kakao, runner: runner)

        guard let usableWindow = kakao.ensureMainWindow(timeout: 1.2, mode: .fast, trace: { message in
            runner.log(message)
        }) ?? kakao.ensureMainWindow(timeout: 3.0, mode: .recovery, trace: { message in
            runner.log(message)
        }) else {
            throw KakaoTalkError.actionFailed("[WINDOW_NOT_READY] Usable KakaoTalk window unavailable")
        }

        let searchRoot = kakao.chatListWindow ?? kakao.mainWindow ?? usableWindow
        let windowsBeforeWarmup = kakao.windows
        var warmedRecipientWindow: UIElement?
        var warmedSlots: [AXPathSlot] = []
        let chatListScanner = ChatListScanner()

        warmedSlots.append(contentsOf: chatListScanner.warmup(in: searchRoot, trace: { message in
            runner.log(message)
        }))

        if let searchField = locateWarmupSearchField(rootWindow: searchRoot, kakao: kakao, runner: runner) {
            AXPathCacheStore.shared.remember(slot: .searchField, root: searchRoot, element: searchField, trace: { message in
                runner.log(message)
            })
            warmedSlots.append(.searchField)

            if let recipient, !recipient.isEmpty {
                _ = runner.focusWithVerification(searchField, label: "warmup search field", attempts: 1)
                _ = runner.setTextWithVerification("", on: searchField, label: "warmup search clear", attempts: 1)
                _ = runner.setTextWithVerification(recipient, on: searchField, label: "warmup search input", attempts: 1)
                runner.pressEnterKey()
                let openedByEnter = runner.waitUntil(label: "warmup chat open", timeout: 0.8, pollInterval: 0.05, evaluateAfterTimeout: false) {
                    resolveWarmupRecipientWindow(kakao: kakao, recipient: recipient) != nil
                }
                if !openedByEnter {
                    runner.pressDownArrowKey()
                    Thread.sleep(forTimeInterval: 0.03)
                    runner.pressEnterKey()
                    _ = runner.waitUntil(label: "warmup chat open", timeout: 0.8, pollInterval: 0.05, evaluateAfterTimeout: false) {
                        resolveWarmupRecipientWindow(kakao: kakao, recipient: recipient) != nil
                    }
                }
                warmedRecipientWindow = resolveWarmupRecipientWindow(kakao: kakao, recipient: recipient)
            }
        } else {
            runner.log("warmup: search field not found")
        }

        let inputRoot = warmedRecipientWindow ?? resolveWarmupInputRoot(kakao: kakao, fallback: searchRoot)
        if let messageInput = locateWarmupMessageInput(in: inputRoot, kakao: kakao, runner: runner) {
            AXPathCacheStore.shared.remember(slot: .messageInput, root: inputRoot, element: messageInput, trace: { message in
                runner.log(message)
            })
            warmedSlots.append(.messageInput)
        } else {
            runner.log("warmup: message input not found")
        }

        var seenWarmedSlots = Set<AXPathSlot>()
        warmedSlots = warmedSlots.filter { seenWarmedSlots.insert($0).inserted }
        let status = warmedSlots.map(\.rawValue).joined(separator: ", ")
        print("Warmup complete: \(status.isEmpty ? "no slots warmed" : status)")

        guard let warmedRecipientWindow else {
            return
        }
        if keepWindow {
            runner.log("warmup: keep-window enabled; skipping auto-close")
            return
        }
        if warmupWindowWasPresent(warmedRecipientWindow, in: windowsBeforeWarmup) {
            runner.log("warmup: recipient window existed before warmup; keeping it open")
            return
        }
        if windowResolver.closeWindow(warmedRecipientWindow) {
            runner.log("warmup: auto-opened recipient window closed")
        } else {
            runner.log("warmup: failed to close auto-opened recipient window")
        }
    }
}

private func resolveWarmupInputRoot(kakao: KakaoTalkApp, fallback: UIElement) -> UIElement {
    if let focused = kakao.focusedWindow {
        return focused
    }
    if let main = kakao.mainWindow {
        return main
    }
    return fallback
}

private func locateWarmupSearchField(rootWindow: UIElement, kakao: KakaoTalkApp, runner: AXActionRunner) -> UIElement? {
    let initial = discoverWarmupSearchCandidates(rootWindow: rootWindow, kakao: kakao)
    if let field = pickWarmupSearchField(from: initial) {
        return field
    }

    let buttons = rootWindow.findAll(role: kAXButtonRole, limit: 18, maxNodes: 220).filter { button in
        let identifier = (button.identifier ?? "").lowercased()
        if identifier == "friends" || identifier == "chatrooms" || identifier == "more" {
            return false
        }
        let joined = [
            button.title ?? "",
            button.axDescription ?? "",
            identifier,
        ].joined(separator: " ").lowercased()
        return joined.contains("search") || joined.contains("검색")
    }

    for button in buttons.prefix(3) {
        do {
            try button.press()
            runner.log("warmup: pressed search-like button title='\(button.title ?? "")' id='\(button.identifier ?? "")'")
        } catch {
            runner.log("warmup: search-like button press failed (\(error))")
        }
        Thread.sleep(forTimeInterval: 0.05)
        if let field = pickWarmupSearchField(from: discoverWarmupSearchCandidates(rootWindow: rootWindow, kakao: kakao)) {
            return field
        }
    }

    return nil
}

private func discoverWarmupSearchCandidates(rootWindow: UIElement, kakao: KakaoTalkApp) -> [UIElement] {
    var fields: [UIElement] = []
    fields.append(contentsOf: rootWindow.findAll(role: kAXTextFieldRole, limit: 8, maxNodes: 140))
    if let focusedWindow = kakao.focusedWindow {
        fields.append(contentsOf: focusedWindow.findAll(role: kAXTextFieldRole, limit: 8, maxNodes: 140))
    }
    if let mainWindow = kakao.mainWindow {
        fields.append(contentsOf: mainWindow.findAll(role: kAXTextFieldRole, limit: 8, maxNodes: 140))
    }
    return fields.filter { $0.isEnabled }
}

private func pickWarmupSearchField(from fields: [UIElement]) -> UIElement? {
    fields
        .filter { $0.isEnabled }
        .sorted { lhs, rhs in
            let lhsY = lhs.position?.y ?? .greatestFiniteMagnitude
            let rhsY = rhs.position?.y ?? .greatestFiniteMagnitude
            return lhsY < rhsY
        }
        .first
}

private func locateWarmupMessageInput(in root: UIElement, kakao: KakaoTalkApp, runner: AXActionRunner) -> UIElement? {
    if let focused = kakao.applicationElement.focusedUIElement, warmupIsLikelyMessageInput(focused, window: root) {
        runner.log("warmup: message input from focused element")
        return focused
    }

    var candidates: [UIElement] = []
    candidates.append(contentsOf: collectWarmupInputCandidates(from: root, limit: 70))
    if let focusedWindow = kakao.focusedWindow, !warmupSameElement(root, focusedWindow) {
        candidates.append(contentsOf: collectWarmupInputCandidates(from: focusedWindow, limit: 70))
    }
    candidates.append(contentsOf: collectWarmupInputCandidates(from: kakao.applicationElement, limit: 90))

    return candidates
        .filter { warmupIsLikelyMessageInput($0, window: root) }
        .sorted { lhs, rhs in
            warmupInputScore(lhs, window: root) > warmupInputScore(rhs, window: root)
        }
        .first
}

private func collectWarmupInputCandidates(from root: UIElement, limit: Int) -> [UIElement] {
    let nodeBudget = max(200, limit * 4)
    let roleCandidates = root.findAll(where: { element in
        guard element.isEnabled else { return false }
        return element.role == kAXTextAreaRole || element.role == kAXTextFieldRole
    }, limit: limit, maxNodes: nodeBudget)

    let editableCandidates = root.findAll(where: { element in
        guard element.isEnabled else { return false }
        let editable: Bool = element.attributeOptional(kAXEditableAttribute) ?? false
        guard editable else { return false }
        let role = element.role ?? ""
        return role != kAXStaticTextRole && role != kAXImageRole
    }, limit: limit, maxNodes: nodeBudget)

    return roleCandidates + editableCandidates
}

private func resolveWarmupRecipientWindow(kakao: KakaoTalkApp, recipient: String) -> UIElement? {
    if let focused = kakao.focusedWindow, (focused.title ?? "").localizedCaseInsensitiveContains(recipient) {
        return focused
    }
    if let matching = kakao.windows.first(where: { ($0.title ?? "").localizedCaseInsensitiveContains(recipient) }) {
        return matching
    }
    if let focused = kakao.focusedWindow, warmupWindowContainsLikelyChatInput(focused) {
        return focused
    }
    return nil
}

private func warmupWindowContainsLikelyChatInput(_ window: UIElement) -> Bool {
    if window.findFirst(where: { element in
        guard element.isEnabled else { return false }
        return element.role == kAXTextAreaRole
    }) != nil {
        return true
    }

    return window.findFirst(where: { element in
        guard element.isEnabled else { return false }
        let role = element.role ?? ""
        let editable: Bool = element.attributeOptional(kAXEditableAttribute) ?? false
        guard editable else { return false }
        return role == kAXTextFieldRole || role == kAXTextAreaRole
    }) != nil
}

private func warmupIsLikelyMessageInput(_ element: UIElement, window: UIElement) -> Bool {
    guard element.isEnabled else { return false }
    let role = element.role ?? ""
    if role == kAXTextAreaRole {
        return true
    }

    let editable: Bool = element.attributeOptional(kAXEditableAttribute) ?? false
    guard editable else { return false }
    guard role != kAXStaticTextRole && role != kAXImageRole else { return false }
    if role == kAXTextFieldRole && warmupLooksLikeSearchField(element, window: window) {
        return false
    }
    return true
}

private func warmupLooksLikeSearchField(_ element: UIElement, window: UIElement) -> Bool {
    guard (element.role ?? "") == kAXTextFieldRole else { return false }
    let joined = [
        element.identifier ?? "",
        element.title ?? "",
        element.axDescription ?? "",
    ].joined(separator: " ").lowercased()

    if joined.contains("search") || joined.contains("검색") {
        return true
    }

    guard let windowFrame = window.frame, let elementFrame = element.frame, windowFrame.height > 0 else {
        return false
    }
    let relativeY = (elementFrame.midY - windowFrame.minY) / windowFrame.height
    return relativeY < 0.45
}

private func warmupInputScore(_ element: UIElement, window: UIElement) -> Double {
    if !warmupIsLikelyMessageInput(element, window: window) {
        return -Double.greatestFiniteMagnitude
    }

    let role = element.role ?? ""
    let roleScore: Double
    if role == kAXTextAreaRole {
        roleScore = 12_000.0
    } else if role == kAXTextFieldRole {
        roleScore = 9_000.0
    } else {
        let editable: Bool = element.attributeOptional(kAXEditableAttribute) ?? false
        roleScore = editable ? 6_000.0 : 0.0
    }

    let yScore = Double(element.position?.y ?? 0)
    let sizeScore = Double(element.size?.height ?? 0)
    let focusScore = element.isFocused ? 2_000.0 : 0.0
    return roleScore + yScore + sizeScore + focusScore
}

private func warmupSameElement(_ lhs: UIElement, _ rhs: UIElement) -> Bool {
    CFEqual(lhs.axElement, rhs.axElement)
}

private func warmupWindowWasPresent(_ window: UIElement, in windows: [UIElement]) -> Bool {
    windows.contains { existing in
        warmupSameElement(existing, window)
    }
}

private func resolvedURL(_ path: String) -> URL {
    let expanded = (path as NSString).expandingTildeInPath
    if expanded.hasPrefix("/") {
        return URL(fileURLWithPath: expanded).standardizedFileURL
    }
    let cwdPath = physicalCurrentDirectoryPath()
    let cwd = URL(fileURLWithPath: cwdPath, isDirectory: true)
    return URL(fileURLWithPath: expanded, relativeTo: cwd).standardizedFileURL
}

private func physicalCurrentDirectoryPath() -> String {
    var buffer = [CChar](repeating: 0, count: Int(PATH_MAX))
    guard realpath(FileManager.default.currentDirectoryPath, &buffer) != nil else {
        return FileManager.default.currentDirectoryPath
    }
    let bytes = buffer.prefix { $0 != 0 }.map { UInt8(bitPattern: $0) }
    return String(decoding: bytes, as: UTF8.self)
}

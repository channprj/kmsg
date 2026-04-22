import ArgumentParser
import Darwin
import Foundation

nonisolated(unsafe) private var watchSignalInterrupted: sig_atomic_t = 0

private func installWatchSignalHandlers() {
    watchSignalInterrupted = 0
    signal(SIGINT) { _ in
        watchSignalInterrupted = 1
    }
    signal(SIGTERM) { _ in
        watchSignalInterrupted = 1
    }
}

private func watchWasInterrupted() -> Bool {
    watchSignalInterrupted != 0
}

struct WatchCommand: ParsableCommand {
    private struct WatchJSONEvent: Encodable {
        let chat: String
        let event: String
        let detectedAt: String
        let message: TranscriptMessage

        enum CodingKeys: String, CodingKey {
            case chat
            case event
            case detectedAt = "detected_at"
            case message
        }
    }

    static let configuration = CommandConfiguration(
        commandName: "watch",
        abstract: "Watch a chat and print new messages in real time"
    )

    @Argument(help: "Name of the chat to watch (partial match supported)")
    var chat: String

    @Option(name: .long, help: "Polling interval in seconds")
    var pollInterval: Double = 0.2

    @Flag(name: .long, help: "Show AX traversal and retry details")
    var traceAX: Bool = false

    @Flag(name: [.short, .long], help: "Keep auto-opened chat window after watch exits")
    var keepWindow: Bool = false

    @Flag(
        name: .long,
        help: ArgumentHelp(
            "Enable deep window recovery when fast window detection fails",
            visibility: .default
        )
    )
    var deepRecovery: Bool = false

    @Flag(name: .long, help: "Output each event as a pretty-printed JSON object")
    var json: Bool = false

    @Flag(name: .long, help: "Include system messages such as date separators")
    var includeSystem: Bool = false

    func run() throws {
        guard AccessibilityPermission.ensureGranted() else {
            AccessibilityPermission.printInstructions()
            throw ExitCode.failure
        }

        let watchStartedAt = Date()
        let interval = max(0.2, min(pollInterval, 10.0))
        let snapshotLimit = 120

        let runner = AXActionRunner(traceEnabled: traceAX)
        let kakao = try AuthBootstrap.requireAuthenticated(traceAX: traceAX)
        let chatWindowResolver = ChatWindowResolver(
            kakao: kakao,
            runner: runner,
            deepRecoveryEnabled: deepRecovery
        )
        let messageContextResolver = MessageContextResolver(kakao: kakao, runner: runner)
        let transcriptReader = KakaoTalkTranscriptReader(kakao: kakao, runner: runner)

        let resolution: ChatWindowResolution
        do {
            resolution = try chatWindowResolver.resolve(query: chat)
        } catch {
            print("No chat window found for '\(chat)'")
            print("Reason: \(error)")
            print("\nAvailable windows:")
            for (index, window) in kakao.windows.enumerated() {
                print("  [\(index)] \(window.title ?? "(untitled)")")
            }
            throw ExitCode.failure
        }

        var currentWindow = resolution.window
        var currentChatTitle = currentWindow.title ?? chat
        var autoOpenedWindow: UIElement? = resolution.openedViaSearch ? currentWindow : nil
        var cachedContext: MessageTranscriptContext?

        defer {
            if !keepWindow, let autoOpenedWindow {
                let resolvedTitle = autoOpenedWindow.title ?? ""
                if !resolvedTitle.isEmpty && !resolvedTitle.localizedCaseInsensitiveContains(chat) {
                    runner.log("watch: skipped auto-close because resolved title '\(resolvedTitle)' did not match query")
                } else if chatWindowResolver.closeWindow(autoOpenedWindow) {
                    runner.log("watch: auto-opened chat window closed")
                } else {
                    runner.log("watch: failed to close auto-opened chat window")
                }
            }
        }

        let baseline: TranscriptSnapshot
        do {
            baseline = try stabilizeBaseline(
                transcriptReader: transcriptReader,
                messageContextResolver: messageContextResolver,
                currentWindow: currentWindow,
                currentChatTitle: currentChatTitle,
                snapshotLimit: snapshotLimit,
                interval: interval,
                phase: "startup",
                cachedContext: &cachedContext
            )
        } catch {
            try printWatchStartupFailure(error)
            throw ExitCode.failure
        }

        currentChatTitle = baseline.chat
        let startupMessages = filterMessagesAfterWatchStart(baseline.messages, watchStartedAt: watchStartedAt)
        var state = WatchPollingState(includeSystemMessages: includeSystem)
        state.replaceBaseline(with: startupMessages)

        if !json {
            writeStdout("Watching chat: \(currentChatTitle)\n")
            writeStdout("Polling every \(String(format: "%.1f", interval))s. Press Ctrl-C to stop.\n\n")
        }

        for message in startupMessages {
            try emit(message: message, chat: currentChatTitle, detectedAt: baseline.fetchedAt)
        }

        installWatchSignalHandlers()

        while !watchWasInterrupted() {
            Thread.sleep(forTimeInterval: interval)
            if watchWasInterrupted() {
                break
            }

            let snapshot: TranscriptSnapshot
            do {
                snapshot = try readNextSnapshot(
                    transcriptReader: transcriptReader,
                    messageContextResolver: messageContextResolver,
                    chatWindowResolver: chatWindowResolver,
                    currentWindow: &currentWindow,
                    currentChatTitle: &currentChatTitle,
                    autoOpenedWindow: &autoOpenedWindow,
                    snapshotLimit: snapshotLimit,
                    interval: interval,
                    cachedContext: &cachedContext
                )
            } catch {
                writeStderr("watch failed: \(error.localizedDescription)\n")
                throw ExitCode.failure
            }

            let eligibleMessages = filterMessagesAfterWatchStart(snapshot.messages, watchStartedAt: watchStartedAt)
            currentChatTitle = snapshot.chat
            let emitted = state.consume(snapshotMessages: eligibleMessages)
            for message in emitted {
                try emit(message: message, chat: currentChatTitle, detectedAt: snapshot.fetchedAt)
            }
        }
    }

    private func readNextSnapshot(
        transcriptReader: KakaoTalkTranscriptReader,
        messageContextResolver: MessageContextResolver,
        chatWindowResolver: ChatWindowResolver,
        currentWindow: inout UIElement,
        currentChatTitle: inout String,
        autoOpenedWindow: inout UIElement?,
        snapshotLimit: Int,
        interval: Double,
        cachedContext: inout MessageTranscriptContext?
    ) throws -> TranscriptSnapshot {
        do {
            return try readSnapshot(
                transcriptReader: transcriptReader,
                messageContextResolver: messageContextResolver,
                currentWindow: currentWindow,
                currentChatTitle: currentChatTitle,
                snapshotLimit: snapshotLimit,
                cachedContext: &cachedContext
            )
        } catch {
            runnerRecoveryLog("watch: snapshot read failed (\(error.localizedDescription)); attempting stabilized recovery")
        }

        if let stabilized = try? stabilizeBaseline(
            transcriptReader: transcriptReader,
            messageContextResolver: messageContextResolver,
            currentWindow: currentWindow,
            currentChatTitle: currentChatTitle,
            snapshotLimit: snapshotLimit,
            interval: interval,
            phase: "recovery",
            cachedContext: &cachedContext
        ) {
            return stabilized
        }

        runnerRecoveryLog("watch: in-place recovery failed; re-resolving chat window")
        let resolution = try chatWindowResolver.resolve(query: chat)
        currentWindow = resolution.window
        currentChatTitle = currentWindow.title ?? chat
        cachedContext = nil
        if resolution.openedViaSearch {
            autoOpenedWindow = currentWindow
        }
        return try stabilizeBaseline(
            transcriptReader: transcriptReader,
            messageContextResolver: messageContextResolver,
            currentWindow: currentWindow,
            currentChatTitle: currentChatTitle,
            snapshotLimit: snapshotLimit,
            interval: interval,
            phase: "recovery",
            cachedContext: &cachedContext
        )
    }

    private func stabilizeBaseline(
        transcriptReader: KakaoTalkTranscriptReader,
        messageContextResolver: MessageContextResolver,
        currentWindow: UIElement,
        currentChatTitle: String,
        snapshotLimit: Int,
        interval: Double,
        phase: String,
        cachedContext: inout MessageTranscriptContext?
    ) throws -> TranscriptSnapshot {
        let deadline = Date().addingTimeInterval(2.0)
        let sampleInterval = min(0.25, max(0.1, interval / 2))
        var previousTail: [String]?
        var latestSnapshot: TranscriptSnapshot?
        var latestError: Error?

        while true {
            if watchWasInterrupted() {
                throw ExitCode.failure
            }

            do {
                let snapshot = try readSnapshot(
                    transcriptReader: transcriptReader,
                    messageContextResolver: messageContextResolver,
                    currentWindow: currentWindow,
                    currentChatTitle: currentChatTitle,
                    snapshotLimit: snapshotLimit,
                    cachedContext: &cachedContext
                )
                let currentTail = stabilizationTailFingerprints(from: snapshot.messages)
                if let previousTail, previousTail == currentTail {
                    return snapshot
                }
                previousTail = currentTail
                latestSnapshot = snapshot
                latestError = nil
            } catch {
                latestError = error
                runnerRecoveryLog("watch: \(phase) baseline sample failed (\(error.localizedDescription))")
            }

            if Date() >= deadline {
                if let latestSnapshot {
                    return latestSnapshot
                }
                throw latestError ?? TranscriptReadError.noReadableMessages
            }

            Thread.sleep(forTimeInterval: sampleInterval)
        }
    }

    private func stabilizationTailFingerprints(from messages: [TranscriptMessage], tailSize: Int = 30) -> [String] {
        let filtered = messages.filter { includeSystem || !$0.isSystem }
        return filtered.suffix(tailSize).map(messageFingerprint)
    }

    private func readSnapshot(
        transcriptReader: KakaoTalkTranscriptReader,
        messageContextResolver: MessageContextResolver,
        currentWindow: UIElement,
        currentChatTitle: String,
        snapshotLimit: Int,
        cachedContext: inout MessageTranscriptContext?
    ) throws -> TranscriptSnapshot {
        if let cachedTranscriptContext = cachedContext {
            if let snapshot = try? transcriptReader.readSnapshot(from: cachedTranscriptContext,
                chatWindow: currentWindow,
                fallbackChatTitle: currentChatTitle,
                limit: snapshotLimit,
                includeSystemMessages: includeSystem
            ) {
                return snapshot
            }

            runnerRecoveryLog("watch: cached transcript context invalidated")
            cachedContext = nil
        }

        guard let resolvedContext = messageContextResolver.resolve(in: currentWindow) else {
            throw TranscriptReadError.transcriptContextUnavailable
        }

        cachedContext = resolvedContext
        return try transcriptReader.readSnapshot(
            from: resolvedContext,
            chatWindow: currentWindow,
            fallbackChatTitle: currentChatTitle,
            limit: snapshotLimit,
            includeSystemMessages: includeSystem
        )
    }

    private func filterMessagesAfterWatchStart(_ messages: [TranscriptMessage], watchStartedAt: Date) -> [TranscriptMessage] {
        messages.filter { message in
            guard let logicalTimestamp = message.logicalTimestamp else {
                return false
            }
            return logicalTimestamp > watchStartedAt
        }
    }

    private func emit(message: TranscriptMessage, chat: String, detectedAt: Date) throws {
        if json {
            try emitJSON(message: message, chat: chat, detectedAt: detectedAt)
            return
        }

        if message.isSystem {
            writeStdout("[system] \(message.body)\n\n")
            return
        }

        writeStdout("author: \(message.author ?? "(me)")\n")
        writeStdout("time: \(message.timeRaw ?? "unknown")\n")
        writeStdout("body: \(message.body)\n\n")
    }

    private func emitJSON(message: TranscriptMessage, chat: String, detectedAt: Date) throws {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]

        let payload = WatchJSONEvent(
            chat: chat,
            event: message.isSystem ? "system" : "message",
            detectedAt: formatter.string(from: detectedAt),
            message: message
        )

        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys, .withoutEscapingSlashes]
        let data = try encoder.encode(payload)
        FileHandle.standardOutput.write(data)
        FileHandle.standardOutput.write(Data([0x0A, 0x0A]))
    }

    private func printWatchStartupFailure(_ error: Error) throws {
        switch error {
        case TranscriptReadError.transcriptContextUnavailable:
            writeStderr("Could not locate chat transcript area.\n")
            writeStderr("Use 'kmsg inspect --window <n>' to inspect the opened chat window.\n")
        case TranscriptReadError.noMessageRows:
            writeStderr("No message rows found in the chat transcript area.\n")
            writeStderr("Use 'kmsg inspect --window <n>' to inspect transcript structure.\n")
        case TranscriptReadError.noReadableMessages:
            writeStderr("No message body text extracted from transcript container.\n")
            writeStderr("Use 'kmsg inspect --window <n>' to inspect message nodes.\n")
        default:
            writeStderr("watch failed: \(error.localizedDescription)\n")
        }
    }

    private func writeStdout(_ string: String) {
        guard let data = string.data(using: .utf8) else { return }
        FileHandle.standardOutput.write(data)
    }

    private func writeStderr(_ string: String) {
        guard let data = string.data(using: .utf8) else { return }
        FileHandle.standardError.write(data)
    }

    private func runnerRecoveryLog(_ message: String) {
        if traceAX {
            writeStderr("[trace-ax] \(message)\n")
        }
    }
}

struct WatchPollingState {
    private let includeSystemMessages: Bool
    private let maxFingerprintCount: Int
    private var previousMessages: [TranscriptMessage] = []

    init(includeSystemMessages: Bool = false, maxFingerprintCount: Int = 200) {
        self.includeSystemMessages = includeSystemMessages
        self.maxFingerprintCount = maxFingerprintCount
    }

    mutating func replaceBaseline(with snapshotMessages: [TranscriptMessage]) {
        previousMessages = recentMessages(from: snapshotMessages)
    }

    mutating func consume(snapshotMessages: [TranscriptMessage]) -> [TranscriptMessage] {
        let currentMessages = recentMessages(from: snapshotMessages)
        guard !previousMessages.isEmpty else {
            previousMessages = currentMessages
            return []
        }

        let overlap = findOverlap(previousMessages, currentMessages)
        let emitted = overlap.endIndex >= 0
            ? Array(currentMessages.dropFirst(overlap.endIndex + 1))
            : currentMessages

        previousMessages = currentMessages
        return emitted
    }

    private func recentMessages(from snapshotMessages: [TranscriptMessage]) -> [TranscriptMessage] {
        let filtered = snapshotMessages.filter { includeSystemMessages || !$0.isSystem }
        return Array(filtered.suffix(maxFingerprintCount))
    }

    private func findOverlap(_ previous: [TranscriptMessage], _ current: [TranscriptMessage]) -> (count: Int, endIndex: Int) {
        let maxCount = min(previous.count, current.count)
        guard maxCount > 0 else {
            return (0, -1)
        }

        for overlapCount in stride(from: maxCount, through: 1, by: -1) {
            let previousSuffix = Array(previous.suffix(overlapCount))
            let maxStartIndex = current.count - overlapCount
            for startIndex in 0...maxStartIndex {
                let currentSlice = Array(current[startIndex..<(startIndex + overlapCount)])
                let matches = zip(previousSuffix, currentSlice).allSatisfy { lhs, rhs in
                    messagesEquivalent(lhs, rhs)
                }
                if matches {
                    return (overlapCount, startIndex + overlapCount - 1)
                }
            }
        }

        return (0, -1)
    }

    private func findOverlapCount(_ previous: [TranscriptMessage], _ current: [TranscriptMessage]) -> Int {
        findOverlap(previous, current).count
    }

    private func messagesEquivalent(_ lhs: TranscriptMessage, _ rhs: TranscriptMessage) -> Bool {
        guard lhs.isSystem == rhs.isSystem else { return false }
        guard normalizeForDiff(lhs.body) == normalizeForDiff(rhs.body) else { return false }

        if let lhsTimestamp = lhs.logicalTimestamp, let rhsTimestamp = rhs.logicalTimestamp {
            let delta = abs(lhsTimestamp.timeIntervalSince(rhsTimestamp))
            if delta > 60 {
                return false
            }
        }

        let lhsAuthor = normalizedAuthor(lhs.author)
        let rhsAuthor = normalizedAuthor(rhs.author)
        if lhsAuthor.isEmpty || rhsAuthor.isEmpty {
            return true
        }

        return lhsAuthor == rhsAuthor
    }

    private func normalizedAuthor(_ author: String?) -> String {
        (author ?? "")
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .lowercased()
    }

    private func normalizeForDiff(_ text: String) -> String {
        text
            .replacingOccurrences(of: "\r\n", with: "\n")
            .replacingOccurrences(of: "\r", with: "\n")
            .trimmingCharacters(in: .whitespacesAndNewlines)
    }
}

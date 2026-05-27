import ArgumentParser
import Foundation

extension ChatWindowLayoutMode: ExpressibleByArgument {}

struct ReadCommand: ParsableCommand {
    private struct ReadJSONResponse: Encodable {
        let chat: String
        let fetchedAt: String
        let count: Int
        let messages: [TranscriptMessage]

        enum CodingKeys: String, CodingKey {
            case chat
            case fetchedAt = "fetched_at"
            case count
            case messages
        }
    }

    static let configuration = CommandConfiguration(
        commandName: "read",
        abstract: "Read messages from a chat",
        discussion: """
            Use either:
              kmsg read <chat>
              kmsg read --chat-id <chat-id>

            When author is "(me)", the message was sent by you.
            """
    )

    @Option(name: .long, help: "Read using a chat_id from 'kmsg chats'")
    var chatID: String?

    @Argument(help: "Name of the chat to read from (partial match supported)")
    var chat: String?

    @Option(name: .shortAndLong, help: "Maximum number of messages to show")
    var limit: Int = 20

    @Flag(name: .long, help: "Show raw element info for debugging")
    var debug: Bool = false

    @Flag(name: .long, help: "Show AX traversal and retry details")
    var traceAX: Bool = false

    @Flag(name: [.short, .long], help: "Keep auto-opened chat window after read")
    var keepWindow: Bool = false

    @Flag(
        name: .long,
        help: ArgumentHelp(
            "Enable deep window recovery when fast window detection fails",
            visibility: .default
        )
    )
    var deepRecovery: Bool = false

    @Option(name: .long, help: "Window layout before reading: preserve, left, or right")
    var layout: ChatWindowLayoutMode = .preserve

    @Flag(name: .long, help: "Output in JSON format")
    var json: Bool = false

    func validate() throws {
        if let chatID, !chatID.isEmpty {
            guard chat == nil else {
                throw ValidationError("Chat name cannot be provided together with --chat-id.")
            }
            return
        }

        guard let chat, !chat.isEmpty else {
            throw ValidationError("Chat name is required unless --chat-id is provided.")
        }
    }

    func run() throws {
        guard AccessibilityPermission.ensureGranted() else {
            AccessibilityPermission.printInstructions()
            throw ExitCode.failure
        }

        let runner = AXActionRunner(traceEnabled: traceAX)
        let kakao = try AuthBootstrap.requireAuthenticated(traceAX: traceAX)
        let chatWindowResolver = ChatWindowResolver(
            kakao: kakao,
            runner: runner,
            deepRecoveryEnabled: deepRecovery,
            layoutMode: layout
        )
        let transcriptReader = KakaoTalkTranscriptReader(kakao: kakao, runner: runner)

        let resolution: ChatWindowResolution
        let requestedChat: String
        do {
            if let chatID {
                requestedChat = chatID
                resolution = try chatWindowResolver.resolve(chatID: chatID)
            } else {
                let chat = chat ?? ""
                requestedChat = chat
                resolution = try chatWindowResolver.resolve(query: chat)
            }
        } catch {
            print("No chat window found for '\(requestedChat)'")
            print("Reason: \(error)")
            print("\nAvailable windows:")
            for (index, window) in kakao.windows.enumerated() {
                print("  [\(index)] \(window.title ?? "(untitled)")")
            }
            throw ExitCode.failure
        }

        let window = resolution.window
        if resolution.openedViaSearch {
            runner.log("read: opening chat via search")
        } else if resolution.method == .openedViaChatList {
            runner.log("read: opening chat via chat list")
        }

        if resolution.openedTransiently {
            if keepWindow {
                runner.log("read: keep-window enabled; auto-opened window will be kept")
            } else {
                runner.log("read: auto-opened window will be closed after read")
            }
        } else {
            runner.log("read: found existing chat window")
        }

        defer {
            if resolution.openedTransiently && !keepWindow {
                let resolvedTitle = window.title ?? ""
                if chatID == nil && !resolvedTitle.isEmpty && !resolvedTitle.localizedCaseInsensitiveContains(requestedChat) {
                    runner.log("read: skipped auto-close because resolved title '\(resolvedTitle)' did not match query")
                } else if chatWindowResolver.closeWindow(window) {
                    runner.log("read: auto-opened chat window closed")
                } else {
                    runner.log("read: failed to close auto-opened chat window")
                }
            } else if resolution.openedTransiently && keepWindow {
                runner.log("read: auto-opened chat window kept by --keep-window")
            }
        }

        let snapshot: TranscriptSnapshot
        do {
            snapshot = try transcriptReader.readSnapshot(
                from: window,
                fallbackChatTitle: window.title ?? requestedChat,
                limit: limit
            )
        } catch TranscriptReadError.transcriptContextUnavailable {
            print("Could not locate chat transcript area.")
            print("Use 'kmsg inspect --window <n>' to inspect the opened chat window.")
            return
        } catch TranscriptReadError.noMessageRows {
            print("No message rows found in the chat transcript area.")
            print("Use 'kmsg inspect --window <n>' to inspect transcript structure.")
            return
        } catch TranscriptReadError.noReadableMessages {
            print("No message body text extracted from transcript container.")
            print("Use 'kmsg inspect --window <n>' to inspect message nodes.")
            return
        }

        if json {
            try printMessagesAsJSON(snapshot)
            return
        }

        print("Reading messages from: \(snapshot.chat)\n")
        print("Recent messages (\(snapshot.count)):\n")
        for (index, message) in snapshot.messages.enumerated() {
            if debug {
                print("[\(index + 1)] author=\(message.author ?? "(me)") time=\(message.timeRaw ?? "unknown") body=\(message.body)")
                continue
            }

            print("[\(index + 1)] author: \(message.author ?? "(me)")")
            print("    time: \(message.timeRaw ?? "unknown")")
            print("    body: \(message.body)")
            print("")
        }
    }

    private func printMessagesAsJSON(_ snapshot: TranscriptSnapshot) throws {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]

        let payload = ReadJSONResponse(
            chat: snapshot.chat,
            fetchedAt: formatter.string(from: snapshot.fetchedAt),
            count: snapshot.count,
            messages: snapshot.messages
        )

        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys, .withoutEscapingSlashes]
        let data = try encoder.encode(payload)
        FileHandle.standardOutput.write(data)
        FileHandle.standardOutput.write(Data([0x0A]))
    }
}

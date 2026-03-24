import ArgumentParser
import Foundation

struct StatusCommand: ParsableCommand {
    static let configuration = CommandConfiguration(
        commandName: "status",
        abstract: "Check KakaoTalk and accessibility status"
    )

    @Flag(name: .long, help: "Show detailed information")
    var verbose: Bool = false

    func run() throws {
        print("kmsg - KakaoTalk CLI Tool\n")

        // Check accessibility permission
        let hasPermission = AccessibilityPermission.ensureGranted()
        print("Accessibility Permission: \(hasPermission ? "✓ Granted" : "✗ Not Granted")")

        if !hasPermission {
            print("")
            AccessibilityPermission.printInstructions()
            return
        }

        // Check KakaoTalk status - launch if not running
        var isRunning = KakaoTalkApp.isRunning
        if !isRunning {
            print("KakaoTalk: Not running, launching...")
            if KakaoTalkApp.launch() != nil {
                isRunning = true
                print("KakaoTalk: ✓ Launched")
            } else {
                print("KakaoTalk: ✗ Failed to launch")
                return
            }
        } else {
            print("KakaoTalk: ✓ Running")
        }

        // Get detailed info if verbose
        if verbose {
            print("")
            do {
                let kakao = try KakaoTalkApp()
                let windows = kakao.windows

                print("Windows (\(windows.count)):")
                for (index, window) in windows.enumerated() {
                    let title = window.title ?? "(untitled)"
                    let frame = window.frame.map { "(\(Int($0.origin.x)), \(Int($0.origin.y))) \(Int($0.size.width))x\(Int($0.size.height))" } ?? "unknown"
                    print("  [\(index)] \(title) - \(frame)")
                }
            } catch {
                print("Error accessing KakaoTalk: \(error)")
            }
        }

        print("\n✓ Ready to use kmsg commands\n")
        printUsage()
    }

    private func printUsage() {
        print("""
        USAGE: kmsg <command> [options]

        COMMANDS:
          status    Check KakaoTalk and accessibility status
          chats     List chat rooms
          read      Read messages from a chat room
          send      Send a message to a chat room
          send-image Send an image to a chat
          cache     Manage AX path cache
          inspect   Inspect KakaoTalk UI hierarchy (debug)
          mcp-server Run the stdio MCP server for integrations

        OPTIONS:
          --help    Show help for any command
          -v, --version Show version

        EXAMPLES:
          kmsg -v                         Show version
          kmsg chats                      List all chat rooms
          kmsg chats --json               List chat rooms with chat_id in JSON
          kmsg read "친구이름"             Read messages from chat
          kmsg send "친구이름" "안녕!"      Send a message
          kmsg send-image "친구이름" "/tmp/a.png" Send an image
          kmsg send --chat-id "<id>" "안녕!" Send a message by chat_id
          kmsg mcp-server                 Run local MCP server
        """)
    }
}

import ArgumentParser
import Foundation

@main
struct Kmsg: ParsableCommand {
    static let configuration = CommandConfiguration(
        commandName: "kmsg",
        abstract: "A CLI tool for KakaoTalk on macOS",
        discussion: """
            kmsg uses macOS Accessibility APIs to interact with KakaoTalk.

            Before using kmsg, make sure:
            1. KakaoTalk is installed and running
            2. Accessibility permission is granted (System Settings > Privacy & Security > Accessibility)

            Run 'kmsg status' to check if everything is set up correctly.

            Examples:
              kmsg status
              kmsg chats --json
              kmsg send "채팅방" "메시지"
              kmsg send-image "채팅방" "/path/to/image.png"
              kmsg mcp-server

            Tip:
              kmsg -v
            """,
        version: BuildVersion.current,
        subcommands: [
            StatusCommand.self,
            InspectCommand.self,
            ChatsCommand.self,
            SendCommand.self,
            SendImageCommand.self,
            ReadCommand.self,
            CacheCommand.self,
            MCPServerCommand.self,
        ],
        defaultSubcommand: StatusCommand.self
    )

    static func main() {
        let arguments = Array(CommandLine.arguments.dropFirst())
        if arguments.count == 1, arguments[0] == "-v" {
            print(BuildVersion.current)
            return
        }
        self.main(arguments)
    }
}

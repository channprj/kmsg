import ArgumentParser
import Foundation

private func invokedCommandName() -> String {
    let executable = CommandLine.arguments.first ?? "kmsg"
    let name = URL(fileURLWithPath: executable).lastPathComponent
    return name.isEmpty ? "kmsg" : name
}

@main
struct Kmsg: ParsableCommand {
    private static let commandName = invokedCommandName()

    static let configuration = CommandConfiguration(
        commandName: commandName,
        abstract: "A CLI tool for KakaoTalk on macOS",
        discussion: """
            \(commandName) uses macOS Accessibility APIs to interact with KakaoTalk.

            Before using \(commandName), make sure:
            1. KakaoTalk is installed and running
            2. Accessibility permission is granted (System Settings > Privacy & Security > Accessibility)

            Run '\(commandName) status' to check if everything is set up correctly.

            Examples:
              \(commandName) status
              \(commandName) auth login
              \(commandName) chats --json
              \(commandName) send "채팅방" "메시지"
              \(commandName) send-image "채팅방" "/path/to/image.png"
              \(commandName) watch "채팅방"
              \(commandName) watch "채팅방" --json
              \(commandName) mcp-server
              \(commandName) update

            Tip:
              \(commandName) -v
            """,
        version: BuildVersion.current,
        subcommands: [
            AuthCommand.self,
            StatusCommand.self,
            InspectCommand.self,
            ChatsCommand.self,
            SendCommand.self,
            SendImageCommand.self,
            ReadCommand.self,
            WatchCommand.self,
            CacheCommand.self,
            MCPServerCommand.self,
            UpdateCommand.self,
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

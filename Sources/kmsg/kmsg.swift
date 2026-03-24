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
}

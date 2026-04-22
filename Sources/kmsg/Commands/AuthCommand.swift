import ArgumentParser
import Foundation

struct AuthCommand: ParsableCommand {
    static let configuration = CommandConfiguration(
        commandName: "auth",
        abstract: "Manage KakaoTalk authentication",
        subcommands: [
            AuthLoginCommand.self,
        ],
        defaultSubcommand: AuthLoginCommand.self
    )
}

struct AuthLoginCommand: ParsableCommand {
    static let configuration = CommandConfiguration(
        commandName: "login",
        abstract: "Log in to KakaoTalk and save encrypted credentials"
    )

    @Flag(name: .long, help: "Use stored credentials when available; otherwise prompt and save")
    var auto: Bool = false

    @Flag(name: .long, help: "Show AX traversal and retry details")
    var traceAX: Bool = false

    func run() throws {
        guard AccessibilityPermission.ensureGranted() else {
            AccessibilityPermission.printInstructions()
            throw ExitCode.failure
        }

        let kakao = try KakaoTalkApp()
        let runner = AXActionRunner(traceEnabled: traceAX)
        let authenticator = KakaoTalkAuthenticator(kakao: kakao, runner: runner)
        let mode: AuthenticationMode = auto ? .automaticIfNeeded : .promptForFreshCredentials
        if auto {
            print("Checking stored credentials and KakaoTalk login state...")
        } else {
            print("Prompting for KakaoTalk credentials...")
        }
        let outcome = try authenticator.ensureAuthenticated(using: CredentialStore.shared, mode: mode)

        switch outcome {
        case .alreadyAuthenticated:
            if auto {
                print("KakaoTalk is already logged in.")
            } else {
                print("KakaoTalk is already logged in. Credentials were refreshed.")
            }
        case .loggedIn:
            print("KakaoTalk login completed.")
            print("Credentials saved to \(AuthPaths.credentialsURL.path)")
        }
    }
}

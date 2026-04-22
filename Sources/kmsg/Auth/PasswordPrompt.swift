import ArgumentParser
import Darwin
import Foundation

enum PasswordPrompt {
    static func promptForCredentials(defaultIdentifier: String?) throws -> DecryptedCredentials {
        FileHandle.standardOutput.write(Data("Enter KakaoTalk credentials.\n".utf8))
        fflush(stdout)

        let identifierPrompt: String
        if let defaultIdentifier, !defaultIdentifier.isEmpty {
            identifierPrompt = "KakaoTalk ID [\(defaultIdentifier)]: "
        } else {
            identifierPrompt = "KakaoTalk ID: "
        }

        guard let rawIdentifier = prompt(identifierPrompt) else {
            throw ExitCode.failure
        }
        let identifier = rawIdentifier.isEmpty ? (defaultIdentifier ?? "") : rawIdentifier
        guard !identifier.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            throw ValidationError("KakaoTalk ID is required.")
        }

        let password = try promptPassword("KakaoTalk Password: ")
        guard !password.isEmpty else {
            throw ValidationError("KakaoTalk password is required.")
        }

        return DecryptedCredentials(
            identifier: identifier.trimmingCharacters(in: .whitespacesAndNewlines),
            password: password
        )
    }

    private static func prompt(_ message: String) -> String? {
        FileHandle.standardOutput.write(Data(message.utf8))
        fflush(stdout)
        return readLine(strippingNewline: true)
    }

    private static func promptPassword(_ message: String) throws -> String {
        FileHandle.standardOutput.write(Data(message.utf8))
        fflush(stdout)

        let disableSucceeded = setTerminalEcho(enabled: false)
        defer {
            if disableSucceeded {
                _ = setTerminalEcho(enabled: true)
                FileHandle.standardOutput.write(Data("\n".utf8))
            }
        }

        guard let password = readLine(strippingNewline: true) else {
            throw ExitCode.failure
        }
        return password
    }

    @discardableResult
    private static func setTerminalEcho(enabled: Bool) -> Bool {
        guard isatty(STDIN_FILENO) == 1 else {
            return false
        }

        var attributes = termios()
        guard tcgetattr(STDIN_FILENO, &attributes) == 0 else {
            return false
        }

        if enabled {
            attributes.c_lflag |= tcflag_t(ECHO)
        } else {
            attributes.c_lflag &= ~tcflag_t(ECHO)
        }

        return tcsetattr(STDIN_FILENO, TCSANOW, &attributes) == 0
    }
}

import Foundation

/// Captured result of a subprocess run.
struct CommandOutput {
    let status: Int32
    let standardOutput: String
    let standardError: String
}

enum SelfUpdateError: LocalizedError {
    case commandFailed(command: String, status: Int32, details: String)
    case homebrewMissingAfterInstall
    case homebrewBinaryMissing(String)
    case migrationFailed(target: String, homebrewBinary: String)

    var errorDescription: String? {
        switch self {
        case let .commandFailed(command, status, details):
            // 130 is the shell convention for an interrupted command.
            guard status != 130 else {
                return "`\(command)` was cancelled. Run `kmsg update` again when you are ready."
            }
            let trimmed = details.trimmingCharacters(in: .whitespacesAndNewlines)
            let suffix = trimmed.isEmpty ? "" : "\n\(trimmed)"
            return "`\(command)` exited with code \(status).\(suffix)"
        case .homebrewMissingAfterInstall:
            return """
                Homebrew was installed but `brew` is still not on PATH.
                Open a new shell and run `kmsg update` again.
                """
        case let .homebrewBinaryMissing(path):
            return """
                Homebrew reported \(path), but no executable is there.
                Run `brew doctor` and then `kmsg update` again.
                """
        case let .migrationFailed(target, homebrewBinary):
            return """
                \(target) could not be pointed at \(homebrewBinary).
                The Homebrew binary is ready; run it directly or link it manually.
                """
        }
    }
}

/// Runs the external commands the updater depends on.
///
/// Arguments are always passed as an array so no value is interpreted by a shell.
enum UpdateProcess {
    /// Runs an executable and captures its output. For small discovery commands only.
    static func capture(_ executable: String, _ arguments: [String]) throws -> CommandOutput {
        let process = Process()
        process.executableURL = URL(fileURLWithPath: executable)
        process.arguments = arguments

        let stdoutPipe = Pipe()
        let stderrPipe = Pipe()
        process.standardOutput = stdoutPipe
        process.standardError = stderrPipe

        try process.run()
        // ponytail: sequential pipe reads, fine for the short discovery output used here.
        let stdoutData = stdoutPipe.fileHandleForReading.readDataToEndOfFile()
        let stderrData = stderrPipe.fileHandleForReading.readDataToEndOfFile()
        process.waitUntilExit()

        return CommandOutput(
            status: process.terminationStatus,
            standardOutput: String(decoding: stdoutData, as: UTF8.self),
            standardError: String(decoding: stderrData, as: UTF8.self)
        )
    }

    /// Runs an executable with the terminal's streams so it can report progress and prompt.
    /// Its standard output is routed to standard error to keep the command's own result clean.
    static func inherit(_ executable: String, _ arguments: [String]) throws -> Int32 {
        let process = Process()
        process.executableURL = URL(fileURLWithPath: executable)
        process.arguments = arguments
        process.standardInput = FileHandle.standardInput
        process.standardOutput = FileHandle.standardError
        process.standardError = FileHandle.standardError

        try process.run()
        process.waitUntilExit()
        return process.terminationStatus
    }
}

/// Finds an absolute `brew` path, so Homebrew works before the parent shell reloads its PATH.
enum HomebrewLocator {
    static let defaultLocations = [
        "/opt/homebrew/bin/brew",
        "/usr/local/bin/brew",
    ]

    static func locate() -> String? {
        let searchPath = ProcessInfo.processInfo.environment["PATH"] ?? ""
        let fromPath = searchPath
            .split(separator: ":")
            .filter { !$0.isEmpty }
            .map { URL(fileURLWithPath: String($0)).appendingPathComponent("brew").path }

        return (fromPath + defaultLocations).first {
            FileManager.default.isExecutableFile(atPath: $0)
        }
    }
}

/// Installs Homebrew with its official installer.
enum HomebrewInstaller {
    static let scriptURL = "https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh"

    /// Downloads the installer, runs it interactively, and returns the new `brew` path.
    static func install(progress: (String) -> Void) throws -> String {
        let script = URL(fileURLWithPath: NSTemporaryDirectory())
            .appendingPathComponent("kmsg-homebrew-install-\(UUID().uuidString).sh")
        defer { try? FileManager.default.removeItem(at: script) }

        progress("Downloading the Homebrew installer...")
        let download = try UpdateProcess.capture(
            "/usr/bin/curl",
            ["--fail", "--silent", "--show-error", "--location", scriptURL, "--output", script.path]
        )
        guard download.status == 0 else {
            throw SelfUpdateError.commandFailed(
                command: "curl \(scriptURL)",
                status: download.status,
                details: download.standardError
            )
        }

        progress("Running the Homebrew installer. It may ask for confirmation...")
        let status = try UpdateProcess.inherit("/bin/bash", [script.path])
        guard status == 0 else {
            throw SelfUpdateError.commandFailed(
                command: "bash <Homebrew installer>",
                status: status,
                details: ""
            )
        }

        guard let brewPath = HomebrewLocator.locate() else {
            throw SelfUpdateError.homebrewMissingAfterInstall
        }
        return brewPath
    }
}

/// Installs or upgrades the tap formula and verifies the resulting binary.
struct HomebrewUpdater {
    struct Installed {
        let binaryPath: String
        let version: String
    }

    static let formula = "channprj/tap/kmsg"

    let brewPath: String
    let progress: (String) -> Void

    func updateFormula() throws -> Installed {
        progress("Refreshing Homebrew metadata...")
        try runInteractively(["update-if-needed"])

        let listed = try UpdateProcess.capture(brewPath, ["list", "--formula", "--versions", "kmsg"])
        let operation = listed.status == 0 ? "upgrade" : "install"
        progress("Running brew \(operation) for \(Self.formula)...")
        try runInteractively([operation, "--formula", "--overwrite", "--no-ask", Self.formula])

        let binaryPath = try resolveBinaryPath()
        let version = try UpdateProcess.capture(binaryPath, ["--version"])
        guard version.status == 0 else {
            throw SelfUpdateError.commandFailed(
                command: "\(binaryPath) --version",
                status: version.status,
                details: version.standardError
            )
        }

        return Installed(
            binaryPath: binaryPath,
            version: version.standardOutput.trimmingCharacters(in: .whitespacesAndNewlines)
        )
    }

    private func resolveBinaryPath() throws -> String {
        let prefix = try UpdateProcess.capture(brewPath, ["--prefix", "kmsg"])
        guard prefix.status == 0 else {
            throw SelfUpdateError.commandFailed(
                command: describe(["--prefix", "kmsg"]),
                status: prefix.status,
                details: prefix.standardError
            )
        }

        let binaryPath = URL(
            fileURLWithPath: prefix.standardOutput.trimmingCharacters(in: .whitespacesAndNewlines)
        )
        .appendingPathComponent("bin/kmsg").path

        guard FileManager.default.isExecutableFile(atPath: binaryPath) else {
            throw SelfUpdateError.homebrewBinaryMissing(binaryPath)
        }
        return binaryPath
    }

    private func runInteractively(_ arguments: [String]) throws {
        let status = try UpdateProcess.inherit(brewPath, arguments)
        guard status == 0 else {
            throw SelfUpdateError.commandFailed(
                command: describe(arguments),
                status: status,
                details: ""
            )
        }
    }

    private func describe(_ arguments: [String]) -> String {
        (["brew"] + arguments).joined(separator: " ")
    }
}

import ArgumentParser
import Foundation

struct UpdateCommand: ParsableCommand {
    static let configuration = CommandConfiguration(
        commandName: "update",
        abstract: "Update kmsg to the latest Homebrew release",
        discussion: """
            Moves this installation onto the Homebrew-managed release and updates it:

            1. Finds Homebrew, installing it with its official installer when missing.
            2. Installs or upgrades channprj/tap/kmsg.
            3. Verifies the Homebrew binary by running it with --version.
            4. Points a directly installed kmsg at the Homebrew binary, so the path
               your shell already resolved keeps working.

            A binary built with `swift build` is left untouched. Homebrew and sudo
            may ask for confirmation. Accessibility permission is not required.

            Examples:
              kmsg update
            """
    )

    func run() throws {
        do {
            let installed = try HomebrewUpdater(
                brewPath: try locateHomebrew(),
                progress: note
            ).updateFormula()

            let executablePath = Bundle.main.executablePath ?? CommandLine.arguments[0]
            switch try BinaryMigrator.migrate(
                to: installed.binaryPath,
                from: executablePath,
                progress: note
            ) {
            case let .replaced(path):
                note("Linked \(path) to the Homebrew binary.")
                print("kmsg \(installed.version) is installed at \(path)")
            case let .buildProduct(path):
                note("Left the local build product \(path) unchanged.")
                print("kmsg \(installed.version) is installed at \(installed.binaryPath)")
            case .alreadyLinked:
                print("kmsg \(installed.version) is installed at \(installed.binaryPath)")
            }
        } catch let error as SelfUpdateError {
            note("Update failed. \(error.errorDescription ?? "Unknown error.")")
            throw ExitCode.failure
        } catch {
            note("Update failed. \(error.localizedDescription)")
            throw ExitCode.failure
        }
    }

    private func locateHomebrew() throws -> String {
        if let brewPath = HomebrewLocator.locate() {
            return brewPath
        }
        note("Homebrew was not found. Installing it first...")
        return try HomebrewInstaller.install(progress: note)
    }

    /// Progress and errors go to standard error so only the final summary reaches standard output.
    private func note(_ message: String) {
        FileHandle.standardError.write(Data("\(message)\n".utf8))
    }
}

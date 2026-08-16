import Foundation

/// Points a directly installed `kmsg` executable at the Homebrew-managed binary,
/// so the path the shell already resolved keeps working.
enum BinaryMigrator {
    enum Outcome {
        /// The running executable already resolves to the Homebrew binary.
        case alreadyLinked(String)
        /// A SwiftPM build product, which is never replaced.
        case buildProduct(String)
        /// The executable now links to the Homebrew binary.
        case replaced(String)
    }

    static func migrate(
        to homebrewBinary: String,
        from executablePath: String,
        progress: (String) -> Void
    ) throws -> Outcome {
        // Kept exactly as invoked, so the path the shell already resolved is the one replaced.
        let target = executablePath

        if links(target, to: homebrewBinary) {
            return .alreadyLinked(target)
        }
        if URL(fileURLWithPath: target).pathComponents.contains(".build") {
            return .buildProduct(target)
        }

        let directory = (target as NSString).deletingLastPathComponent
        if FileManager.default.isWritableFile(atPath: directory) {
            try replace(target: target, with: homebrewBinary)
        } else {
            try replaceWithPrivileges(target: target, with: homebrewBinary, progress: progress)
        }

        guard links(target, to: homebrewBinary) else {
            throw SelfUpdateError.migrationFailed(target: target, homebrewBinary: homebrewBinary)
        }
        return .replaced(target)
    }

    /// Creates the link beside the target and renames it over the target atomically.
    private static func replace(target: String, with homebrewBinary: String) throws {
        let staged = "\(target).kmsg-update-\(UUID().uuidString)"
        try FileManager.default.createSymbolicLink(atPath: staged, withDestinationPath: homebrewBinary)
        guard rename(staged, target) == 0 else {
            try? FileManager.default.removeItem(atPath: staged)
            throw SelfUpdateError.migrationFailed(target: target, homebrewBinary: homebrewBinary)
        }
    }

    /// Replaces a target inside a directory the user cannot write to, keeping a backup
    /// until the new link is verified.
    private static func replaceWithPrivileges(
        target: String,
        with homebrewBinary: String,
        progress: (String) -> Void
    ) throws {
        let backup = "\(target).kmsg-backup"
        progress("Administrator access is required to replace \(target)...")
        try sudo(["/bin/mv", target, backup])

        do {
            try sudo(["/bin/ln", "-s", homebrewBinary, target])
            guard links(target, to: homebrewBinary) else {
                throw SelfUpdateError.migrationFailed(target: target, homebrewBinary: homebrewBinary)
            }
        } catch {
            try? sudo(["/bin/rm", "-f", target])
            try? sudo(["/bin/mv", backup, target])
            throw error
        }

        try? sudo(["/bin/rm", "-f", backup])
    }

    private static func sudo(_ arguments: [String]) throws {
        let status = try UpdateProcess.inherit("/usr/bin/sudo", arguments)
        guard status == 0 else {
            throw SelfUpdateError.commandFailed(
                command: (["sudo"] + arguments).joined(separator: " "),
                status: status,
                details: ""
            )
        }
    }

    private static func links(_ path: String, to homebrewBinary: String) -> Bool {
        let resolved = URL(fileURLWithPath: path).resolvingSymlinksInPath().path
        return resolved == URL(fileURLWithPath: homebrewBinary).resolvingSymlinksInPath().path
    }
}

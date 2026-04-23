import Foundation

@main
struct VersionGenTool {
    static func main() throws {
        let args = CommandLine.arguments
        guard args.count == 3 else {
            throw ToolError.usage
        }

        let versionFilePath = args[1]
        let outputFilePath = args[2]

        let rawVersion = try String(contentsOfFile: versionFilePath, encoding: .utf8)
        guard let firstLine = rawVersion.split(whereSeparator: \.isNewline).first else {
            throw ToolError.invalidVersion("VERSION file is empty")
        }

        let version = String(firstLine).trimmingCharacters(in: .whitespacesAndNewlines)
        guard !version.isEmpty else {
            throw ToolError.invalidVersion("VERSION file is empty")
        }

        guard isValidReleaseVersion(version) else {
            throw ToolError.invalidVersion("VERSION must match MAJOR.YYMMDD.PATCH_COUNT (e.g. 1.260424.0)")
        }

        let generated = """
        import Foundation

        enum BuildVersion {
            static let current = "\(escapeForSwiftLiteral(version))"
        }
        """

        let outputURL = URL(fileURLWithPath: outputFilePath)
        try FileManager.default.createDirectory(
            at: outputURL.deletingLastPathComponent(),
            withIntermediateDirectories: true
        )
        try generated.write(to: outputURL, atomically: true, encoding: .utf8)
    }

    private static func isValidReleaseVersion(_ version: String) -> Bool {
        let parts = version.split(separator: ".", omittingEmptySubsequences: false)
        guard parts.count == 3 else { return false }

        let majorPart = String(parts[0])
        let datePart = String(parts[1])
        let patchCountPart = String(parts[2])

        guard !majorPart.isEmpty,
              datePart.count == 6,
              !patchCountPart.isEmpty,
              CharacterSet.decimalDigits.isSuperset(of: CharacterSet(charactersIn: majorPart)),
              CharacterSet.decimalDigits.isSuperset(of: CharacterSet(charactersIn: datePart)),
              CharacterSet.decimalDigits.isSuperset(of: CharacterSet(charactersIn: patchCountPart)),
              let major = Int(majorPart),
              let yearSuffix = Int(datePart.prefix(2)),
              let month = Int(datePart.dropFirst(2).prefix(2)),
              let day = Int(datePart.suffix(2)),
              let patchCount = Int(patchCountPart),
              major >= 1,
              patchCount >= 0
        else {
            return false
        }

        var components = DateComponents()
        components.calendar = Calendar(identifier: .gregorian)
        components.year = 2000 + yearSuffix
        components.month = month
        components.day = day

        guard let date = components.date else {
            return false
        }

        let resolved = components.calendar?.dateComponents([.year, .month, .day], from: date)
        return resolved?.year == 2000 + yearSuffix && resolved?.month == month && resolved?.day == day
    }

    private static func escapeForSwiftLiteral(_ value: String) -> String {
        value
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "\"", with: "\\\"")
    }
}

enum ToolError: LocalizedError {
    case usage
    case invalidVersion(String)

    var errorDescription: String? {
        switch self {
        case .usage:
            return "Usage: VersionGenTool <VERSION file> <output swift file>"
        case .invalidVersion(let message):
            return message
        }
    }
}

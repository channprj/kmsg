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

        guard isValidCalendarVersion(version) else {
            throw ToolError.invalidVersion("VERSION must match YYYY.MMDD.COUNT (e.g. 2026.0422.123)")
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

    private static func isValidCalendarVersion(_ version: String) -> Bool {
        let parts = version.split(separator: ".", omittingEmptySubsequences: false)
        guard parts.count == 3 else { return false }

        let yearPart = String(parts[0])
        let monthDayPart = String(parts[1])
        let countPart = String(parts[2])

        guard yearPart.count == 4,
              monthDayPart.count == 4,
              CharacterSet.decimalDigits.isSuperset(of: CharacterSet(charactersIn: yearPart)),
              CharacterSet.decimalDigits.isSuperset(of: CharacterSet(charactersIn: monthDayPart)),
              CharacterSet.decimalDigits.isSuperset(of: CharacterSet(charactersIn: countPart)),
              let year = Int(yearPart),
              let month = Int(monthDayPart.prefix(2)),
              let day = Int(monthDayPart.suffix(2)),
              let count = Int(countPart),
              count > 0
        else {
            return false
        }

        var components = DateComponents()
        components.calendar = Calendar(identifier: .gregorian)
        components.year = year
        components.month = month
        components.day = day

        guard let date = components.date else {
            return false
        }

        let resolved = components.calendar?.dateComponents([.year, .month, .day], from: date)
        return resolved?.year == year && resolved?.month == month && resolved?.day == day
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

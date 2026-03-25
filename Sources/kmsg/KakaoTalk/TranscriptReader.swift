import ApplicationServices.HIServices
import Foundation

struct TranscriptMessage: Encodable, Equatable, Sendable {
    let author: String?
    let timeRaw: String?
    let body: String
    let isSystem: Bool
    let logicalTimestamp: Date?

    enum CodingKeys: String, CodingKey {
        case author
        case timeRaw = "time_raw"
        case body
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(author ?? "(me)", forKey: .author)
        try container.encodeIfPresent(timeRaw, forKey: .timeRaw)
        try container.encode(body, forKey: .body)
    }
}

struct TranscriptSnapshot: Sendable {
    let chat: String
    let fetchedAt: Date
    let messages: [TranscriptMessage]

    var count: Int {
        messages.count
    }
}

enum TranscriptReadError: LocalizedError {
    case transcriptContextUnavailable
    case noMessageRows
    case noReadableMessages

    var errorDescription: String? {
        switch self {
        case .transcriptContextUnavailable:
            return "Could not locate chat transcript area."
        case .noMessageRows:
            return "No message rows found in the chat transcript area."
        case .noReadableMessages:
            return "No message body text extracted from transcript container."
        }
    }
}

struct KakaoTalkTranscriptReader {
    private let kakao: KakaoTalkApp
    private let runner: AXActionRunner

    init(kakao: KakaoTalkApp, runner: AXActionRunner) {
        self.kakao = kakao
        self.runner = runner
    }

    func readSnapshot(
        from window: UIElement,
        fallbackChatTitle: String,
        limit: Int,
        includeSystemMessages: Bool = false
    ) throws -> TranscriptSnapshot {
        let referenceDate = Date()
        let messageContextResolver = MessageContextResolver(kakao: kakao, runner: runner)
        guard let messageContext = messageContextResolver.resolve(in: window) else {
            throw TranscriptReadError.transcriptContextUnavailable
        }

        return try readSnapshot(
            from: messageContext,
            chatWindow: window,
            fallbackChatTitle: fallbackChatTitle,
            limit: limit,
            includeSystemMessages: includeSystemMessages,
            referenceDate: referenceDate
        )
    }

    func readSnapshot(
        from context: MessageTranscriptContext,
        chatWindow: UIElement,
        fallbackChatTitle: String,
        limit: Int,
        includeSystemMessages: Bool = false,
        referenceDate: Date = Date()
    ) throws -> TranscriptSnapshot {

        let frameCache = FrameCache()
        let messageRows = collectTranscriptRows(
            from: context.transcriptRoot,
            inputElement: context.inputElement,
            messageLimit: limit,
            frameCache: frameCache
        )
        guard !messageRows.isEmpty else {
            throw TranscriptReadError.noMessageRows
        }

        let displayMessages = extractMessages(
            from: messageRows,
            transcriptRoot: context.transcriptRoot,
            limit: limit,
            includeSystemMessages: includeSystemMessages,
            referenceDate: referenceDate,
            frameCache: frameCache
        )
        guard !displayMessages.isEmpty else {
            throw TranscriptReadError.noReadableMessages
        }

        return TranscriptSnapshot(
            chat: chatWindow.title ?? fallbackChatTitle,
            fetchedAt: referenceDate,
            messages: displayMessages
        )
    }

    private func collectTranscriptRows(
        from transcriptRoot: UIElement,
        inputElement: UIElement,
        messageLimit: Int,
        frameCache: FrameCache
    ) -> [UIElement] {
        let targetRowCount = max(messageLimit * 4, 50)
        var rows: [UIElement] = []

        rows.append(contentsOf: directRowChildren(from: transcriptRoot))

        let containerCandidates = transcriptRoot.findAll(where: { element in
            guard let role = element.role else { return false }
            return role == kAXTableRole || role == kAXOutlineRole || role == kAXListRole || role == kAXScrollAreaRole
        }, limit: 8, maxNodes: 900)

        for container in containerCandidates {
            rows.append(contentsOf: directRowChildren(from: container))
        }

        if rows.count < targetRowCount {
            let bfsRows = transcriptRoot.findAll(
                role: kAXRowRole,
                limit: max(targetRowCount * 3, 240),
                maxNodes: 3_000
            )
            rows.append(contentsOf: bfsRows)
        }

        if rows.isEmpty {
            let cells = transcriptRoot.findAll(role: kAXCellRole, limit: max(targetRowCount * 2, 160), maxNodes: 2_000)
            rows.append(contentsOf: cells.compactMap(\.parent))
        }

        let deduplicated = deduplicateElements(rows)
        var filtered = deduplicated
        if let inputFrame = inputElement.frame {
            filtered = deduplicated.filter { row in
                guard let rowFrame = frameCache.frame(of: row) else { return true }
                return rowFrame.maxY <= inputFrame.minY + 20
            }
        }

        let sorted = filtered.sorted { lhs, rhs in
            let lhsY = frameCache.frame(of: lhs)?.minY ?? .greatestFiniteMagnitude
            let rhsY = frameCache.frame(of: rhs)?.minY ?? .greatestFiniteMagnitude
            if lhsY == rhsY {
                let lhsX = frameCache.frame(of: lhs)?.minX ?? .greatestFiniteMagnitude
                let rhsX = frameCache.frame(of: rhs)?.minX ?? .greatestFiniteMagnitude
                return lhsX < rhsX
            }
            return lhsY < rhsY
        }

        let recentWindow = max(messageLimit * 6, 80)
        let recentRows = Array(sorted.suffix(recentWindow))
        runner.log("read: transcript rows raw=\(rows.count), unique=\(deduplicated.count), filtered=\(sorted.count), recent=\(recentRows.count)")
        return recentRows
    }

    private func extractMessages(
        from rows: [UIElement],
        transcriptRoot: UIElement,
        limit: Int,
        includeSystemMessages: Bool,
        referenceDate: Date,
        frameCache: FrameCache
    ) -> [TranscriptMessage] {
        let analysisBudget = max(limit * 5, 60)
        let rowsToAnalyze = Array(rows.suffix(analysisBudget))
        let analyses = rowsToAnalyze.map {
            analyzeRow($0, transcriptRoot: transcriptRoot, referenceDate: referenceDate, frameCache: frameCache)
        }

        var messages: [TranscriptMessage] = []
        messages.reserveCapacity(min(analyses.count, limit * 2))
        var selectedLogs = 0
        var skippedLogs = 0
        var lastKnownTime: String?
        var lastTimeBySide: [MessageSide: String] = [:]
        var leftAnchorAuthor: String?
        var leftAnchorTimeRaw: String?
        var currentDateAnchor: Date?

        for (offset, analysis) in analyses.enumerated() {
            let side = analysis.side
            if side != .left || analysis.isSystemLikeRow {
                leftAnchorAuthor = nil
                leftAnchorTimeRaw = nil
            }

            if side == .left,
               let explicitAuthor = analysis.explicitAuthor,
               !analysis.isSystemLikeRow
            {
                leftAnchorAuthor = explicitAuthor
                leftAnchorTimeRaw = analysis.timeRaw
            }

            guard let bodyCandidate = analysis.bodyCandidate else {
                if skippedLogs < 10 {
                    if analysis.isSystemLikeRow {
                        runner.log("read: row[\(offset + 1)] skipped (system row)")
                    } else {
                        runner.log("read: row[\(offset + 1)] skipped (no body text)")
                    }
                    skippedLogs += 1
                }
                continue
            }

            if let parsedDate = parseSystemDate(from: bodyCandidate.body, relativeTo: referenceDate) {
                currentDateAnchor = parsedDate
            }

            if analysis.isSystemLikeRow, !includeSystemMessages {
                if skippedLogs < 10 {
                    runner.log("read: row[\(offset + 1)] skipped (system-like content)")
                    skippedLogs += 1
                }
                continue
            }

            if analysis.isSystemLikeRow {
                let message = TranscriptMessage(
                    author: nil,
                    timeRaw: analysis.timeRaw,
                    body: bodyCandidate.body,
                    isSystem: true,
                    logicalTimestamp: currentDateAnchor
                )
                messages.append(message)
                continue
            }

            let resolvedAuthor = resolveAuthorInSegment(
                analysis: analysis,
                leftAnchorAuthor: leftAnchorAuthor,
                leftAnchorTimeRaw: leftAnchorTimeRaw
            )
            let author = resolvedAuthor.author

            let resolvedTime: String?
            if let explicitTime = analysis.timeRaw {
                resolvedTime = explicitTime
                lastKnownTime = explicitTime
                if side != .unknown {
                    lastTimeBySide[side] = explicitTime
                }
            } else if side != .unknown, let sideTime = lastTimeBySide[side] {
                resolvedTime = sideTime
            } else {
                resolvedTime = lastKnownTime
            }

            let message = TranscriptMessage(
                author: author,
                timeRaw: resolvedTime,
                body: bodyCandidate.body,
                isSystem: false,
                logicalTimestamp: logicalTimestamp(
                    for: resolvedTime,
                    dateAnchor: currentDateAnchor,
                    referenceDate: referenceDate
                )
            )
            messages.append(message)
            if selectedLogs < 10 {
                runner.log(
                    "read: row[\(offset + 1)] side=\(side.rawValue) author='\(author ?? "(me)")' source=\(resolvedAuthor.source) time='\(resolvedTime ?? "unknown")' body='\(bodyCandidate.body.prefix(60))'"
                )
                selectedLogs += 1
            }
        }

        runner.log("read: row parser messages=\(messages.count)")

        if messages.isEmpty || messages.count < max(3, min(limit / 2, 8)) {
            let fallback = extractFallbackMessages(from: transcriptRoot, limit: limit, referenceDate: referenceDate)
            runner.log("read: fallback messages=\(fallback.count)")
            messages.append(contentsOf: fallback)
        }

        return Array(deduplicateMessagesPreservingOrder(messages).suffix(limit))
    }

    private func directRowChildren(from element: UIElement) -> [UIElement] {
        element.children.filter { $0.role == kAXRowRole }
    }

    private func analyzeRow(
        _ row: UIElement,
        transcriptRoot: UIElement,
        referenceDate: Date,
        frameCache: FrameCache
    ) -> RowAnalysis {
        let directCells = row.children.filter { $0.role == kAXCellRole }
        let containers = directCells.isEmpty ? [row] : directCells

        var bodyCandidates: [MessageBodyCandidate] = []
        var metadataTokensBuffer: [String] = []
        var buttonTitlesBuffer: [String] = []
        var imageFrames: [CGRect] = []

        for container in containers {
            var textAreas: [UIElement] = []
            var staticTexts: [UIElement] = []
            var images: [UIElement] = []
            var buttons: [UIElement] = []

            for child in container.children {
                switch child.role {
                case kAXTextAreaRole:
                    textAreas.append(child)
                case kAXStaticTextRole:
                    staticTexts.append(child)
                case kAXImageRole:
                    images.append(child)
                case kAXButtonRole:
                    buttons.append(child)
                default:
                    break
                }
            }

            let missingRoles = [
                textAreas.isEmpty ? kAXTextAreaRole : nil,
                staticTexts.isEmpty ? kAXStaticTextRole : nil,
                images.isEmpty ? kAXImageRole : nil,
                buttons.isEmpty ? kAXButtonRole : nil,
            ].compactMap { $0 }

            if !missingRoles.isEmpty {
                let found = container.findAll(
                    roles: Set(missingRoles),
                    roleLimits: [
                        kAXTextAreaRole: 4,
                        kAXStaticTextRole: 8,
                        kAXImageRole: 3,
                        kAXButtonRole: 6,
                    ],
                    maxNodes: 140
                )
                if textAreas.isEmpty { textAreas = found[kAXTextAreaRole] ?? [] }
                if staticTexts.isEmpty { staticTexts = found[kAXStaticTextRole] ?? [] }
                if images.isEmpty { images = found[kAXImageRole] ?? [] }
                if buttons.isEmpty { buttons = found[kAXButtonRole] ?? [] }
            }

            for staticText in staticTexts {
                let normalized = normalizeBodyText(staticText.stringValue)
                guard !normalized.isEmpty else { continue }
                metadataTokensBuffer.append(contentsOf: metadataTokens(from: normalized))
            }

            for button in buttons {
                let title = normalizeBodyText(button.title)
                guard !title.isEmpty else { continue }
                buttonTitlesBuffer.append(title)
            }

            for image in images {
                if let frame = image.frame {
                    imageFrames.append(frame)
                }
            }

            for textArea in textAreas {
                let normalized = normalizeBodyText(textArea.stringValue)
                guard !normalized.isEmpty else { continue }

                var resolved = normalized
                if shouldPromoteLinkTitle(for: normalized),
                   let fullLink = bestLinkTitle(from: textArea) ?? bestLinkTitle(from: container)
                {
                    if isURLOnlyText(normalized) {
                        resolved = fullLink
                    } else if !normalized.contains(fullLink) {
                        resolved = "\(normalized)\n\(fullLink)"
                    }
                    runner.log("read: link title used as fallback")
                }

                bodyCandidates.append(MessageBodyCandidate(body: resolved, frame: textArea.frame))
            }

            if textAreas.isEmpty, let linkOnlyText = bestLinkTitle(from: container) {
                bodyCandidates.append(MessageBodyCandidate(body: linkOnlyText, frame: container.frame))
            }
        }

        let bestBody = deduplicateBodyCandidates(bodyCandidates).max { lhs, rhs in
            scoreBodyCandidate(lhs.body) < scoreBodyCandidate(rhs.body)
        }

        let uniqueMetadataTokens = deduplicatePreservingOrder(metadataTokensBuffer)
        let uniqueButtonTitles = deduplicatePreservingOrder(buttonTitlesBuffer)
        let metadata = parseRowMetadata(tokens: metadataTokensBuffer)
        let cachedRowFrame = frameCache.frame(of: row)
        let side = inferMessageSide(
            bodyFrame: bestBody?.frame,
            imageFrames: imageFrames,
            rowFrame: cachedRowFrame,
            transcriptRoot: transcriptRoot
        )
        let systemLikeRow = isLikelySystemRow(
            metadataTokens: uniqueMetadataTokens,
            buttonTitles: uniqueButtonTitles,
            bodyCandidate: bestBody,
            referenceDate: referenceDate
        )
        return RowAnalysis(
            bodyCandidate: bestBody,
            explicitAuthor: metadata.author,
            timeRaw: metadata.timeRaw,
            side: side,
            rowFrame: cachedRowFrame,
            isSystemLikeRow: systemLikeRow
        )
    }

    private func extractFallbackMessages(from transcriptRoot: UIElement, limit: Int, referenceDate: Date) -> [TranscriptMessage] {
        var messages: [TranscriptMessage] = []
        let textAreas = transcriptRoot.findAll(role: kAXTextAreaRole, limit: max(limit * 80, 1_200), maxNodes: 6_000)
        let recentTextAreas = Array(sortElementsByReadingOrder(textAreas).suffix(max(limit * 20, 240)))
        for textArea in recentTextAreas {
            let normalized = normalizeBodyText(textArea.stringValue)
            guard !normalized.isEmpty else { continue }

            var resolved = normalized
            if shouldPromoteLinkTitle(for: normalized), let fullLink = bestLinkTitle(from: textArea) {
                if isURLOnlyText(normalized) {
                    resolved = fullLink
                } else if !normalized.contains(fullLink) {
                    resolved = "\(normalized)\n\(fullLink)"
                }
                runner.log("read: fallback link title used")
            }
            let row = firstAncestor(of: textArea, role: kAXRowRole, maxHops: 6)
            let metadata = row.map { extractRowMetadata(from: $0) } ?? RowMetadata(author: nil, timeRaw: nil)
            messages.append(
                TranscriptMessage(
                    author: metadata.author,
                    timeRaw: metadata.timeRaw,
                    body: resolved,
                    isSystem: false,
                    logicalTimestamp: logicalTimestamp(
                        for: metadata.timeRaw,
                        dateAnchor: nil,
                        referenceDate: referenceDate
                    )
                )
            )
        }

        if messages.isEmpty {
            let links = transcriptRoot.findAll(where: { $0.role == kAXLinkRole }, limit: max(limit * 40, 320), maxNodes: 4_000)
            let recentLinks = Array(sortElementsByReadingOrder(links).suffix(max(limit * 10, 80)))
            for link in recentLinks {
                let title = normalizeBodyText(link.title ?? link.stringValue)
                if !title.isEmpty {
                    messages.append(
                        TranscriptMessage(
                            author: nil,
                            timeRaw: nil,
                            body: title,
                            isSystem: false,
                            logicalTimestamp: nil
                        )
                    )
                }
            }
        }

        return Array(deduplicateMessagesPreservingOrder(messages).suffix(limit))
    }

    private func extractRowMetadata(from row: UIElement) -> RowMetadata {
        let cells = row.findAll(role: kAXCellRole, limit: 8, maxNodes: 180)
        let containers = cells.isEmpty ? [row] : cells

        var tokens: [String] = []
        for container in containers {
            let staticTexts = container.findAll(role: kAXStaticTextRole, limit: 12, maxNodes: 240)
            for staticText in staticTexts {
                let normalized = normalizeBodyText(staticText.stringValue)
                guard !normalized.isEmpty else { continue }
                tokens.append(contentsOf: metadataTokens(from: normalized))
            }
        }

        return parseRowMetadata(tokens: tokens)
    }

    private func parseRowMetadata(tokens: [String]) -> RowMetadata {
        let uniqueTokens = deduplicatePreservingOrder(tokens)
        var author: String?
        var timeRaw: String?

        for token in uniqueTokens {
            if let parsedTime = extractTimeToken(from: token) {
                timeRaw = parsedTime
                continue
            }

            if isLikelyCountToken(token)
                || isLikelySystemMetadataToken(token)
                || isLikelyAttachmentMetadataToken(token)
            {
                continue
            }

            if author == nil {
                author = token
            }
        }

        return RowMetadata(author: author, timeRaw: timeRaw)
    }

    private func metadataTokens(from text: String) -> [String] {
        text
            .replacingOccurrences(of: "\r\n", with: "\n")
            .replacingOccurrences(of: "\r", with: "\n")
            .split(separator: "\n", omittingEmptySubsequences: true)
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
    }

    private func extractTimeToken(from token: String) -> String? {
        let trimmed = token.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return nil }

        if let meridiemRange = trimmed.range(
            of: #"(오전|오후)\s*([1-9]|1[0-2]):[0-5][0-9]"#,
            options: .regularExpression
        ) {
            return String(trimmed[meridiemRange])
        }

        let parts = trimmed.split(whereSeparator: \.isWhitespace)
        for part in parts {
            let normalized = String(part).trimmingCharacters(in: .punctuationCharacters)
            if normalized.range(
                of: #"^([01]?[0-9]|2[0-3]):[0-5][0-9]$"#,
                options: .regularExpression
            ) != nil {
                return normalized
            }
        }

        return nil
    }

    private func isLikelyCountToken(_ token: String) -> Bool {
        let trimmed = token.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return false }
        return trimmed.unicodeScalars.allSatisfy { CharacterSet.decimalDigits.contains($0) }
    }

    private func isLikelySystemMetadataToken(_ token: String) -> Bool {
        let trimmed = token.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return false }

        if trimmed.range(of: #"^\d{4}-\d{2}-\d{2}"#, options: .regularExpression) != nil {
            return true
        }
        if trimmed.range(of: #"^\d{4}[./-]\d{1,2}[./-]\d{1,2}"#, options: .regularExpression) != nil {
            return true
        }
        if trimmed.range(of: #"^\d{1,2}월\s*\d{1,2}일"#, options: .regularExpression) != nil {
            return true
        }

        return false
    }

    private func isLikelyAttachmentMetadataToken(_ token: String) -> Bool {
        let trimmed = token.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return false }

        let lowered = trimmed.lowercased()
        if lowered.hasPrefix("expiry") || lowered.hasPrefix("size:") {
            return true
        }
        if lowered.contains("만료") || lowered.contains("용량") {
            return true
        }
        if trimmed == "·" {
            return true
        }
        if lowered.range(
            of: #"\.(pdf|png|jpe?g|gif|webp|zip|hwp|docx?|pptx?|xlsx?)$"#,
            options: .regularExpression
        ) != nil {
            return true
        }

        return false
    }

    private func isLikelyAttachmentButtonTitle(_ title: String) -> Bool {
        let lowered = title.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !lowered.isEmpty else { return false }
        if lowered == "save" || lowered == "save as" {
            return true
        }
        if lowered == "저장" || lowered == "다른 이름으로 저장" {
            return true
        }
        return false
    }

    private func isLikelySystemRow(
        metadataTokens: [String],
        buttonTitles: [String],
        bodyCandidate: MessageBodyCandidate?,
        referenceDate: Date
    ) -> Bool {
        if let body = bodyCandidate?.body, parseSystemDate(from: body, relativeTo: referenceDate) != nil {
            return true
        }
        let hasAttachmentMetadata = metadataTokens.contains(where: isLikelyAttachmentMetadataToken)
        let hasAttachmentActions = buttonTitles.contains(where: isLikelyAttachmentButtonTitle)
        if hasAttachmentMetadata && hasAttachmentActions {
            return true
        }
        if bodyCandidate == nil && (hasAttachmentMetadata || hasAttachmentActions) {
            return true
        }
        return false
    }

    private func inferMessageSide(
        bodyFrame: CGRect?,
        imageFrames: [CGRect],
        rowFrame: CGRect?,
        transcriptRoot: UIElement
    ) -> MessageSide {
        if let bodyF = bodyFrame {
            for imageFrame in imageFrames {
                if imageFrame.midX + 10 < bodyF.minX {
                    return .left
                }
                if imageFrame.midX > bodyF.maxX + 10 {
                    return .right
                }
            }
        }

        let referenceFrame = bodyFrame ?? rowFrame
        guard let candidateFrame = referenceFrame, let transcriptFrame = transcriptRoot.frame else {
            return .unknown
        }

        let ratio = (candidateFrame.midX - transcriptFrame.minX) / max(transcriptFrame.width, 1)
        if ratio <= 0.56 {
            return .left
        }
        if ratio >= 0.62 {
            return .right
        }
        return .unknown
    }

    private func resolveAuthorInSegment(
        analysis: RowAnalysis,
        leftAnchorAuthor: String?,
        leftAnchorTimeRaw: String?
    ) -> (author: String?, source: String) {
        if let explicitAuthor = analysis.explicitAuthor {
            return (explicitAuthor, "explicit")
        }

        if analysis.side == .right || analysis.side == .unknown {
            return (nil, "default-me")
        }

        guard let anchorAuthor = leftAnchorAuthor else {
            return (nil, "left-unresolved")
        }

        guard isForwardTimeProgress(anchorTimeRaw: leftAnchorTimeRaw, candidateTimeRaw: analysis.timeRaw) else {
            return (nil, "left-time-guard")
        }

        return (anchorAuthor, "left-chain")
    }

    private func isForwardTimeProgress(anchorTimeRaw: String?, candidateTimeRaw: String?) -> Bool {
        guard
            let anchorMinutes = minuteOfDay(from: anchorTimeRaw),
            let candidateMinutes = minuteOfDay(from: candidateTimeRaw)
        else {
            return true
        }

        return candidateMinutes >= anchorMinutes
    }

    private func minuteOfDay(from timeRaw: String?) -> Int? {
        guard let timeRaw else { return nil }
        let trimmed = timeRaw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return nil }

        if let meridiemRange = trimmed.range(
            of: #"(오전|오후)\s*([1-9]|1[0-2]):([0-5][0-9])"#,
            options: .regularExpression
        ) {
            let token = String(trimmed[meridiemRange])
                .replacingOccurrences(of: "오전", with: "")
                .replacingOccurrences(of: "오후", with: "")
                .trimmingCharacters(in: .whitespaces)
            let parts = token.split(separator: ":")
            guard parts.count == 2,
                  let hourPart = Int(parts[0]),
                  let minutePart = Int(parts[1])
            else {
                return nil
            }

            var hour = hourPart % 12
            if trimmed.contains("오후") {
                hour += 12
            }
            return hour * 60 + minutePart
        }

        if let range = trimmed.range(
            of: #"([01]?[0-9]|2[0-3]):([0-5][0-9])"#,
            options: .regularExpression
        ) {
            let token = String(trimmed[range])
            let parts = token.split(separator: ":")
            guard parts.count == 2,
                  let hour = Int(parts[0]),
                  let minute = Int(parts[1])
            else {
                return nil
            }
            return hour * 60 + minute
        }

        return nil
    }

    private func logicalTimestamp(for timeRaw: String?, dateAnchor: Date?, referenceDate: Date) -> Date? {
        guard let messageMinuteOfDay = minuteOfDay(from: timeRaw) else {
            return nil
        }

        let calendar = Calendar.current
        if let dateAnchor {
            let startOfDay = calendar.startOfDay(for: dateAnchor)
            return calendar.date(byAdding: .minute, value: messageMinuteOfDay, to: startOfDay)
        }

        guard let referenceMinuteOfDay = minuteOfDay(from: formattedTime(from: referenceDate)),
              messageMinuteOfDay <= referenceMinuteOfDay
        else {
            return nil
        }

        let startOfDay = calendar.startOfDay(for: referenceDate)
        return calendar.date(byAdding: .minute, value: messageMinuteOfDay, to: startOfDay)
    }

    private func formattedTime(from date: Date) -> String {
        let components = Calendar.current.dateComponents([.hour, .minute], from: date)
        guard let hour = components.hour, let minute = components.minute else {
            return ""
        }
        return String(format: "%02d:%02d", hour, minute)
    }

    private func parseSystemDate(from text: String, relativeTo referenceDate: Date) -> Date? {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return nil }

        let calendar = Calendar.current
        let normalized = trimmed
            .replacingOccurrences(of: ".", with: "-")
            .replacingOccurrences(of: "/", with: "-")

        if let match = normalized.range(
            of: #"^(\d{4})-(\d{1,2})-(\d{1,2})(?:\s+\S+)?$"#,
            options: .regularExpression
        ) {
            let token = String(normalized[match])
            let parts = token.split(whereSeparator: { $0 == "-" || $0 == " " })
            guard parts.count >= 3,
                  let year = Int(parts[0]),
                  let month = Int(parts[1]),
                  let day = Int(parts[2])
            else {
                return nil
            }
            return calendar.date(from: DateComponents(year: year, month: month, day: day))
        }

        if let match = trimmed.range(
            of: #"^(\d{1,2})월\s*(\d{1,2})일(?:\s+\S+)?$"#,
            options: .regularExpression
        ) {
            let token = String(trimmed[match])
            let numbers = token
                .split(whereSeparator: { !$0.isNumber })
                .compactMap { Int($0) }
            guard numbers.count >= 2 else {
                return nil
            }

            let referenceYear = calendar.component(.year, from: referenceDate)
            let month = numbers[0]
            let day = numbers[1]
            guard var candidate = calendar.date(from: DateComponents(year: referenceYear, month: month, day: day)) else {
                return nil
            }

            if candidate.timeIntervalSince(referenceDate) > 86_400 * 2,
               let adjusted = calendar.date(byAdding: .year, value: -1, to: candidate)
            {
                candidate = adjusted
            }

            return candidate
        }

        return nil
    }

    private func firstAncestor(of element: UIElement, role: String, maxHops: Int) -> UIElement? {
        var cursor: UIElement? = element
        var hops = 0

        while let current = cursor, hops <= maxHops {
            if current.role == role {
                return current
            }
            cursor = current.parent
            hops += 1
        }

        return nil
    }

    private func bestLinkTitle(from element: UIElement) -> String? {
        let links = element.findAll(where: { $0.role == kAXLinkRole }, limit: 4, maxNodes: 120)
        let titles = links.compactMap { link in
            normalizeBodyText(link.title ?? link.stringValue)
        }
        .filter { !$0.isEmpty }

        return titles.max { lhs, rhs in lhs.count < rhs.count }
    }

    private func normalizeBodyText(_ text: String?) -> String {
        guard let text else { return "" }
        let canonical = text
            .replacingOccurrences(of: "\r\n", with: "\n")
            .replacingOccurrences(of: "\r", with: "\n")

        let lines = canonical
            .split(separator: "\n", omittingEmptySubsequences: false)
            .map { $0.trimmingCharacters(in: .whitespaces) }

        let joined = lines.joined(separator: "\n")
            .trimmingCharacters(in: .whitespacesAndNewlines)

        return joined
    }

    private func deduplicatePreservingOrder(_ values: [String]) -> [String] {
        var seen = Set<String>()
        var unique: [String] = []
        unique.reserveCapacity(values.count)

        for value in values {
            guard !value.isEmpty else { continue }
            if seen.contains(value) { continue }
            seen.insert(value)
            unique.append(value)
        }

        return unique
    }

    private func deduplicateBodyCandidates(_ candidates: [MessageBodyCandidate]) -> [MessageBodyCandidate] {
        var seen = Set<String>()
        var unique: [MessageBodyCandidate] = []
        unique.reserveCapacity(candidates.count)

        for candidate in candidates {
            guard !candidate.body.isEmpty else { continue }
            if seen.contains(candidate.body) { continue }
            seen.insert(candidate.body)
            unique.append(candidate)
        }

        return unique
    }

    private func deduplicateMessagesPreservingOrder(_ messages: [TranscriptMessage]) -> [TranscriptMessage] {
        var seen = Set<String>()
        var unique: [TranscriptMessage] = []
        unique.reserveCapacity(messages.count)

        for message in messages {
            let key = messageFingerprint(message)
            if seen.contains(key) { continue }
            seen.insert(key)
            unique.append(message)
        }

        return unique
    }

    private func shouldPromoteLinkTitle(for text: String) -> Bool {
        let lower = text.lowercased()
        guard lower.contains("http://") || lower.contains("https://") else { return false }
        return text.contains("...")
    }

    private func isURLOnlyText(_ text: String) -> Bool {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        return trimmed.hasPrefix("http://") || trimmed.hasPrefix("https://")
    }

    private func scoreBodyCandidate(_ text: String) -> Int {
        var score = min(text.count * 10, 500)
        if text.contains("\n") {
            score += 60
        }
        if text.contains(" ") {
            score += 40
        }
        let lower = text.lowercased()
        if lower.contains("http://") || lower.contains("https://") {
            score += 180
        }
        return score
    }

    private func deduplicateElements(_ elements: [UIElement]) -> [UIElement] {
        var unique: [UIElement] = []
        unique.reserveCapacity(elements.count)

        var buckets: [CFHashCode: [UIElement]] = [:]
        for element in elements {
            let hash = CFHash(element.axElement)
            let alreadySeen = buckets[hash]?.contains(where: { existing in
                CFEqual(existing.axElement, element.axElement)
            }) ?? false
            if alreadySeen {
                continue
            }
            buckets[hash, default: []].append(element)
            unique.append(element)
        }

        return unique
    }

    private func sortElementsByReadingOrder(_ elements: [UIElement]) -> [UIElement] {
        elements.sorted { lhs, rhs in
            let lhsY = lhs.frame?.minY ?? .greatestFiniteMagnitude
            let rhsY = rhs.frame?.minY ?? .greatestFiniteMagnitude
            if lhsY == rhsY {
                let lhsX = lhs.frame?.minX ?? .greatestFiniteMagnitude
                let rhsX = rhs.frame?.minX ?? .greatestFiniteMagnitude
                return lhsX < rhsX
            }
            return lhsY < rhsY
        }
    }
}

func messageFingerprint(_ message: TranscriptMessage) -> String {
    "\(message.author ?? "")\u{1F}\(message.timeRaw ?? "")\u{1F}\(message.body)"
}

private struct RowMetadata {
    let author: String?
    let timeRaw: String?
}

private struct MessageBodyCandidate {
    let body: String
    let frame: CGRect?
}

private struct RowAnalysis {
    let bodyCandidate: MessageBodyCandidate?
    let explicitAuthor: String?
    let timeRaw: String?
    let side: MessageSide
    let rowFrame: CGRect?
    let isSystemLikeRow: Bool

    var referenceFrame: CGRect? {
        bodyCandidate?.frame ?? rowFrame
    }
}

private enum MessageSide: String, Hashable {
    case left
    case right
    case unknown
}

private final class FrameCache {
    private var entries: [(element: AXUIElement, frame: CGRect?)] = []
    private var buckets: [CFHashCode: [Int]] = [:]

    func frame(of element: UIElement) -> CGRect? {
        let hash = CFHash(element.axElement)
        if let indices = buckets[hash] {
            for idx in indices {
                if CFEqual(entries[idx].element, element.axElement) {
                    return entries[idx].frame
                }
            }
        }
        let frame = element.frame
        let idx = entries.count
        entries.append((element: element.axElement, frame: frame))
        buckets[hash, default: []].append(idx)
        return frame
    }
}

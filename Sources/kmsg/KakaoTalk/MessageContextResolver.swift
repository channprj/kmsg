import Foundation

struct MessageTranscriptContext {
    let inputElement: UIElement
    let chatPaneRoot: UIElement?
    let transcriptRoot: UIElement
}

struct MessageContextResolver {
    private let kakao: KakaoTalkApp
    private let runner: AXActionRunner
    private let useCache: Bool

    init(kakao: KakaoTalkApp, runner: AXActionRunner, useCache: Bool = true) {
        self.kakao = kakao
        self.runner = runner
        self.useCache = useCache
    }

    func resolve(in chatWindow: UIElement) -> MessageTranscriptContext? {
        guard let inputElement = resolveMessageInputField(chatWindow: chatWindow) else {
            runner.log("read: message input context unavailable")
            return nil
        }

        let paneRoot = preferredChatPaneRoot(for: inputElement, in: chatWindow)
        if let paneRoot {
            runner.log("read: chat pane root role='\(paneRoot.role ?? "unknown")' frame=\(frameDescription(paneRoot.frame))")
        } else {
            runner.log("read: chat pane root unresolved; using window fallback")
        }

        guard let transcriptRoot = resolveTranscriptRoot(chatWindow: chatWindow, paneRoot: paneRoot, inputElement: inputElement) else {
            runner.log("read: transcript container unresolved")
            return nil
        }

        runner.log("read: transcript root role='\(transcriptRoot.role ?? "unknown")' frame=\(frameDescription(transcriptRoot.frame))")
        return MessageTranscriptContext(
            inputElement: inputElement,
            chatPaneRoot: paneRoot,
            transcriptRoot: transcriptRoot
        )
    }

    private func resolveMessageInputField(chatWindow: UIElement) -> UIElement? {
        if let cachedInput = resolveCachedElement(
            slot: .messageInput,
            root: chatWindow,
            validate: { candidate in
                isLikelyMessageInputElement(candidate, in: chatWindow)
            }
        ) {
            return cachedInput
        }

        if let focusedElement = kakao.applicationElement.focusedUIElement {
            let focusedCandidates = collectFocusedElementLineageCandidates(focusedElement)
            runner.log("read: input fast path focused candidates=\(focusedCandidates.count)")
            if let input = pickMessageInputField(from: focusedCandidates, in: chatWindow) {
                rememberCachedElement(slot: .messageInput, root: chatWindow, element: input)
                return input
            }
        }

        for attempt in 1...2 {
            var candidates: [UIElement] = []

            if let focusedWindow = kakao.focusedWindow {
                let focusedWindowCandidates = collectMessageInputCandidates(from: focusedWindow, limit: attempt == 1 ? 36 : 60)
                candidates.append(contentsOf: focusedWindowCandidates)
                if !areSameAXElement(focusedWindow, chatWindow) {
                    let chatWindowCandidates = collectMessageInputCandidates(from: chatWindow, limit: attempt == 1 ? 36 : 60)
                    candidates.append(contentsOf: chatWindowCandidates)
                }
                runner.log("read: input attempt \(attempt) focused=\(focusedWindowCandidates.count) total=\(candidates.count)")
            } else {
                let chatWindowCandidates = collectMessageInputCandidates(from: chatWindow, limit: attempt == 1 ? 36 : 60)
                candidates.append(contentsOf: chatWindowCandidates)
                runner.log("read: input attempt \(attempt) chatWindow=\(chatWindowCandidates.count)")
            }

            if let focusedElement = kakao.applicationElement.focusedUIElement {
                let focusedCandidates = collectFocusedElementLineageCandidates(focusedElement)
                candidates.append(contentsOf: focusedCandidates)
            }

            if attempt > 1 {
                candidates.append(contentsOf: collectMessageInputCandidates(from: kakao.applicationElement, limit: 60))
            }

            if let input = pickMessageInputField(from: deduplicateElements(candidates), in: chatWindow) {
                runner.log("read: input resolved attempt \(attempt) role='\(input.role ?? "unknown")'")
                rememberCachedElement(slot: .messageInput, root: chatWindow, element: input)
                return input
            }

            kakao.activate()
            _ = runner.focusWithVerification(chatWindow, label: "chat window", attempts: 1)
            Thread.sleep(forTimeInterval: 0.05)
        }

        let appCandidates = collectMessageInputCandidates(from: kakao.applicationElement, limit: 90)
        runner.log("read: input final fallback app candidates=\(appCandidates.count)")
        if let input = pickMessageInputField(from: deduplicateElements(appCandidates), in: chatWindow) {
            rememberCachedElement(slot: .messageInput, root: chatWindow, element: input)
            return input
        }

        return nil
    }

    private func resolveTranscriptRoot(chatWindow: UIElement, paneRoot: UIElement?, inputElement: UIElement) -> UIElement? {
        let cacheRoot = paneRoot ?? chatWindow
        if let cachedTranscriptRoot = resolveCachedElement(
            slot: .transcriptRoot,
            root: cacheRoot,
            validate: { candidate in
                isLikelyTranscriptRoot(candidate, chatWindow: chatWindow, inputElement: inputElement)
            }
        ) {
            runner.log("read: transcript root cache hit")
            return cachedTranscriptRoot
        }

        var candidates: [UIElement] = []

        if let paneRoot {
            candidates.append(contentsOf: collectTranscriptContainers(from: paneRoot))
        }

        candidates.append(contentsOf: collectTranscriptContainers(from: chatWindow))

        candidates = deduplicateElements(candidates)
        if candidates.isEmpty {
            return nil
        }

        // Phase 1: spatial/role scoring only (no BFS)
        var phase1 = candidates.map { candidate in
            (
                candidate: candidate,
                score: scoreTranscriptContainerSpatial(
                    candidate,
                    chatWindow: chatWindow,
                    inputElement: inputElement
                )
            )
        }
        .sorted { lhs, rhs in lhs.score > rhs.score }

        // Phase 2: child bonus via BFS for top 3 candidates only
        let topCount = min(3, phase1.count)
        for i in 0..<topCount {
            guard phase1[i].score > 0 else { continue }
            phase1[i].score += scoreTranscriptContainerChildBonus(phase1[i].candidate)
        }
        let scored = phase1.sorted { lhs, rhs in lhs.score > rhs.score }

        if let top = scored.first {
            runner.log("read: transcript candidates=\(scored.count) bestScore=\(Int(top.score))")
        }

        guard let transcriptRoot = scored.first(where: { $0.score > 0 })?.candidate else {
            return nil
        }

        rememberCachedElement(slot: .transcriptRoot, root: cacheRoot, element: transcriptRoot)
        return transcriptRoot
    }

    private func collectTranscriptContainers(from root: UIElement) -> [UIElement] {
        let roles: Set<String> = [
            kAXScrollAreaRole, kAXTableRole, kAXOutlineRole, kAXListRole, kAXGroupRole,
        ]
        let roleLimits: [String: Int] = [
            kAXScrollAreaRole: 12,
            kAXTableRole: 8,
            kAXOutlineRole: 8,
            kAXListRole: 8,
            kAXGroupRole: 10,
        ]
        let found = root.findAll(roles: roles, roleLimits: roleLimits, maxNodes: 600)

        var containers: [UIElement] = []
        for role in [kAXScrollAreaRole, kAXTableRole, kAXOutlineRole, kAXListRole, kAXGroupRole] {
            containers.append(contentsOf: found[role] ?? [])
        }
        return containers
    }

    /// Phase 1: spatial/role-based scoring (no BFS calls)
    private func scoreTranscriptContainerSpatial(_ candidate: UIElement, chatWindow: UIElement, inputElement: UIElement) -> Double {
        guard
            let windowFrame = chatWindow.frame,
            let inputFrame = inputElement.frame,
            let candidateFrame = candidate.frame
        else {
            return -Double.greatestFiniteMagnitude
        }

        let candidateWidthRatio = candidateFrame.width / max(windowFrame.width, 1)
        if candidateWidthRatio < 0.35 {
            return -8_000
        }

        let overlapWidth = max(0, min(candidateFrame.maxX, inputFrame.maxX) - max(candidateFrame.minX, inputFrame.minX))
        let overlapRatio = overlapWidth / max(min(candidateFrame.width, inputFrame.width), 1)
        if overlapRatio < 0.15 {
            return -7_000
        }

        var score: Double = 0
        let role = candidate.role ?? ""
        switch role {
        case kAXScrollAreaRole:
            score += 4_400
        case kAXTableRole:
            score += 3_600
        case kAXListRole, kAXOutlineRole:
            score += 3_000
        case kAXGroupRole:
            score += 1_500
        default:
            break
        }

        if candidateFrame.maxY <= inputFrame.minY + 24 {
            score += 1_300
        } else {
            score -= 2_800
        }

        score += overlapRatio * 2_200

        let centerX = (candidateFrame.midX - windowFrame.minX) / max(windowFrame.width, 1)
        if centerX < 0.35 {
            score -= 1_600
        }

        if candidateFrame.minY >= inputFrame.minY {
            score -= 3_000
        }

        if candidateFrame.height > inputFrame.height * 2.2 {
            score += 320
        }

        return score
    }

    /// Phase 2: child bonus via single multi-role BFS
    private func scoreTranscriptContainerChildBonus(_ candidate: UIElement) -> Double {
        let roles: Set<String> = [kAXRowRole, kAXStaticTextRole]
        let found = candidate.findAll(
            roles: roles,
            roleLimits: [kAXRowRole: 20, kAXStaticTextRole: 20],
            maxNodes: 240
        )
        let rowCount = found[kAXRowRole]?.count ?? 0
        let textCount = found[kAXStaticTextRole]?.count ?? 0
        return Double(rowCount * 150) + Double(textCount * 25)
    }

    private func isLikelyTranscriptRoot(_ candidate: UIElement, chatWindow: UIElement, inputElement: UIElement) -> Bool {
        let role = candidate.role ?? ""
        guard role == kAXScrollAreaRole || role == kAXTableRole || role == kAXOutlineRole || role == kAXListRole || role == kAXGroupRole else {
            return false
        }

        return scoreTranscriptContainerSpatial(candidate, chatWindow: chatWindow, inputElement: inputElement) > 0
    }

    private func preferredChatPaneRoot(for inputElement: UIElement, in chatWindow: UIElement) -> UIElement? {
        guard let windowFrame = chatWindow.frame else { return nil }
        let ancestors = ancestorChain(of: inputElement, maxHops: 8)

        let filtered = ancestors.filter { candidate in
            guard let frame = candidate.frame else { return false }
            guard isElementLikelyInsideWindow(elementFrame: frame, windowFrame: windowFrame) else { return false }
            let widthRatio = frame.width / max(windowFrame.width, 1)
            let heightRatio = frame.height / max(windowFrame.height, 1)
            return widthRatio >= 0.45 && heightRatio >= 0.35
        }

        return filtered.min { lhs, rhs in
            guard let lhsFrame = lhs.frame, let rhsFrame = rhs.frame else { return false }
            return lhsFrame.width * lhsFrame.height < rhsFrame.width * rhsFrame.height
        }
    }

    private func ancestorChain(of element: UIElement, maxHops: Int) -> [UIElement] {
        var ancestors: [UIElement] = []
        var cursor: UIElement? = element.parent
        var hops = 0

        while let current = cursor, hops < maxHops {
            ancestors.append(current)
            cursor = current.parent
            hops += 1
        }

        return ancestors
    }

    private func collectMessageInputCandidates(from root: UIElement, limit: Int = 80) -> [UIElement] {
        let nodeBudget = max(200, limit * 4)
        let roleCandidates = root.findAll(where: { element in
            guard element.isEnabled else { return false }
            return element.role == kAXTextAreaRole || element.role == kAXTextFieldRole
        }, limit: limit, maxNodes: nodeBudget)

        let editableCandidates = root.findAll(where: { element in
            guard element.isEnabled else { return false }
            let editable: Bool = element.attributeOptional(kAXEditableAttribute) ?? false
            guard editable else { return false }
            let role = element.role ?? ""
            return role != kAXStaticTextRole && role != kAXImageRole
        }, limit: limit, maxNodes: nodeBudget)

        return roleCandidates + editableCandidates
    }

    private func collectFocusedElementLineageCandidates(_ focusedElement: UIElement) -> [UIElement] {
        var candidates: [UIElement] = [focusedElement]
        var cursor: UIElement? = focusedElement.parent
        var hops = 0

        while let element = cursor, hops < 4 {
            candidates.append(element)
            let textDescendants = element.findAll(where: { node in
                guard node.isEnabled else { return false }
                return node.role == kAXTextAreaRole || node.role == kAXTextFieldRole
            }, limit: 8, maxNodes: 48)
            candidates.append(contentsOf: textDescendants)
            cursor = element.parent
            hops += 1
        }

        return candidates
    }

    private func pickMessageInputField(from fields: [UIElement], in window: UIElement) -> UIElement? {
        fields.sorted { lhs, rhs in
            scoreMessageInputCandidate(lhs, in: window) > scoreMessageInputCandidate(rhs, in: window)
        }
        .first
    }

    private func scoreMessageInputCandidate(_ element: UIElement, in window: UIElement) -> Double {
        if !isLikelyMessageInputElement(element, in: window) {
            return -Double.greatestFiniteMagnitude
        }

        let role = element.role ?? ""
        let roleScore: Double
        if role == kAXTextAreaRole {
            roleScore = 12_000.0
        } else if role == kAXTextFieldRole {
            roleScore = 9_000.0
        } else {
            let editable: Bool = element.attributeOptional(kAXEditableAttribute) ?? false
            roleScore = editable ? 6_000.0 : 0.0
        }

        let yScore = Double(element.position?.y ?? 0)
        let topPenalty: Double
        if role == kAXTextFieldRole, isLikelySearchField(element, in: window) {
            topPenalty = 8_000.0
        } else {
            topPenalty = 0.0
        }

        let locationScore: Double
        if let windowFrame = window.frame, let elementFrame = element.frame {
            if isElementLikelyInsideWindow(elementFrame: elementFrame, windowFrame: windowFrame) {
                let relativeY = (elementFrame.midY - windowFrame.minY) / max(windowFrame.height, 1.0)
                locationScore = relativeY > 0.55 ? 1_500.0 : 0.0
            } else {
                locationScore = -6_000.0
            }
        } else {
            locationScore = 0.0
        }

        let sizeScore = Double(element.size?.height ?? 0)
        let focusScore = element.isFocused ? 2_000.0 : 0.0
        return roleScore + yScore + sizeScore + focusScore + locationScore - topPenalty
    }

    private func isLikelyMessageInputElement(_ element: UIElement, in window: UIElement? = nil) -> Bool {
        guard element.isEnabled else { return false }
        let role = element.role ?? ""
        if role == kAXTextAreaRole {
            return true
        }

        let editable: Bool = element.attributeOptional(kAXEditableAttribute) ?? false
        guard editable else { return false }
        guard role != kAXStaticTextRole && role != kAXImageRole else { return false }
        if role == kAXTextFieldRole && isLikelySearchField(element, in: window) {
            return false
        }
        return true
    }

    private func isLikelySearchField(_ element: UIElement, in window: UIElement?) -> Bool {
        let role = element.role ?? ""
        guard role == kAXTextFieldRole else { return false }

        let joinedText = [
            element.identifier ?? "",
            element.title ?? "",
            element.axDescription ?? "",
        ]
        .joined(separator: " ")
        .lowercased()

        if joinedText.contains("search") || joinedText.contains("검색") {
            return true
        }

        guard let windowFrame = window?.frame, let elementFrame = element.frame, windowFrame.height > 0 else {
            return false
        }

        if !isElementLikelyInsideWindow(elementFrame: elementFrame, windowFrame: windowFrame) {
            return true
        }

        let relativeY = (elementFrame.midY - windowFrame.minY) / windowFrame.height
        return relativeY < 0.5
    }

    private func resolveCachedElement(
        slot: AXPathSlot,
        root: UIElement,
        validate: (UIElement) -> Bool
    ) -> UIElement? {
        guard useCache else { return nil }
        return AXPathCacheStore.shared.resolve(
            slot: slot,
            root: root,
            validate: validate,
            trace: { message in
                runner.log(message)
            }
        )
    }

    private func rememberCachedElement(slot: AXPathSlot, root: UIElement, element: UIElement) {
        guard useCache else { return }
        AXPathCacheStore.shared.remember(
            slot: slot,
            root: root,
            element: element,
            trace: { message in
                runner.log(message)
            }
        )
    }

    private func deduplicateElements(_ candidates: [UIElement]) -> [UIElement] {
        var unique: [UIElement] = []
        unique.reserveCapacity(candidates.count)
        for candidate in candidates {
            if unique.contains(where: { areSameAXElement($0, candidate) }) {
                continue
            }
            unique.append(candidate)
        }
        return unique
    }

    private func areSameAXElement(_ lhs: UIElement, _ rhs: UIElement) -> Bool {
        CFEqual(lhs.axElement, rhs.axElement)
    }

    private func isElementLikelyInsideWindow(elementFrame: CGRect, windowFrame: CGRect) -> Bool {
        let expandedWindow = windowFrame.insetBy(dx: -24, dy: -24)
        return expandedWindow.intersects(elementFrame)
    }

    private func frameDescription(_ frame: CGRect?) -> String {
        guard let frame else { return "unknown" }
        return "x=\(Int(frame.origin.x)) y=\(Int(frame.origin.y)) w=\(Int(frame.size.width)) h=\(Int(frame.size.height))"
    }
}

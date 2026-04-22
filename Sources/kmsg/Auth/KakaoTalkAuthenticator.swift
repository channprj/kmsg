import ApplicationServices.HIServices
import Foundation

enum AuthenticationMode {
    case automaticIfNeeded
    case promptForFreshCredentials
}

enum AuthenticationOutcome: String {
    case alreadyAuthenticated
    case loggedIn
}

enum AuthenticationError: Error, LocalizedError {
    case loginWindowNotFound
    case missingUsernameField
    case missingPasswordField
    case loginFailed

    var errorDescription: String? {
        switch self {
        case .loginWindowNotFound:
            return "KakaoTalk login window was not found."
        case .missingUsernameField:
            return "Could not locate the KakaoTalk ID field."
        case .missingPasswordField:
            return "Could not locate the KakaoTalk password field."
        case .loginFailed:
            return "KakaoTalk login did not complete successfully."
        }
    }
}

private struct LoginForm {
    let window: UIElement
    let usernameField: UIElement
    let passwordField: UIElement
}

final class KakaoTalkAuthenticator {
    private let kakao: KakaoTalkApp
    private let runner: AXActionRunner

    init(kakao: KakaoTalkApp, runner: AXActionRunner) {
        self.kakao = kakao
        self.runner = runner
    }

    func ensureAuthenticated(
        using store: CredentialStore,
        mode: AuthenticationMode
    ) throws -> AuthenticationOutcome {
        if mode == .promptForFreshCredentials {
            let prompted = try PasswordPrompt.promptForCredentials(defaultIdentifier: store.storedIdentifier())

            if isAuthenticated() {
                try store.save(identifier: prompted.identifier, password: prompted.password)
                return .alreadyAuthenticated
            }

            guard let form = findLoginForm() else {
                try performBlindLogin(with: prompted)
                try store.save(identifier: prompted.identifier, password: prompted.password)
                return .loggedIn
            }

            try performLogin(with: prompted, form: form)
            try store.save(identifier: prompted.identifier, password: prompted.password)
            return .loggedIn
        }

        if isAuthenticated() {
            return .alreadyAuthenticated
        }

        let storedCredentials = try store.loadCredentials()
        let credentials = try storedCredentials ?? PasswordPrompt.promptForCredentials(defaultIdentifier: store.storedIdentifier())
        guard let form = findLoginForm() else {
            try performBlindLogin(with: credentials)
            if storedCredentials == nil {
                try store.save(identifier: credentials.identifier, password: credentials.password)
            }
            return .loggedIn
        }

        try performLogin(with: credentials, form: form)
        if storedCredentials == nil {
            try store.save(identifier: credentials.identifier, password: credentials.password)
        }
        return .loggedIn
    }

    private func performLogin(with credentials: DecryptedCredentials, form: LoginForm) throws {
        runner.log("auth: using login window title='\(form.window.title ?? "")'")
        print("Attempting KakaoTalk login...")

        guard runner.focusWithVerification(form.usernameField, label: "auth username field", attempts: 2) else {
            throw AuthenticationError.missingUsernameField
        }
        _ = runner.setTextWithVerification("", on: form.usernameField, label: "auth username clear", attempts: 1)
        let usernameReady =
            runner.setTextWithVerification(credentials.identifier, on: form.usernameField, label: "auth username", attempts: 2) ||
            runner.typeTextWithVerification(credentials.identifier, on: form.usernameField, label: "auth username", attempts: 2)
        guard usernameReady else {
            throw AuthenticationError.missingUsernameField
        }

        guard runner.focusWithVerification(form.passwordField, label: "auth password field", attempts: 2) else {
            throw AuthenticationError.missingPasswordField
        }
        clearFieldBestEffort(form.passwordField, label: "auth password clear")
        let passwordReady =
            setTextWithoutReflection(credentials.password, on: form.passwordField, label: "auth password") ||
            typeTextWithoutReflection(credentials.password, into: form.passwordField, label: "auth password")
        guard passwordReady else {
            throw AuthenticationError.missingPasswordField
        }

        kakao.activate()
        if let submitButton = resolveSubmitButton(in: form.window, near: form.passwordField),
           runner.clickWithRetry(submitButton, label: "auth login button", attempts: 2)
        {
            runner.log("auth: login button clicked")
        } else {
            runner.log("auth: falling back to Enter for submit")
            runner.pressEnterKey()
        }

        let loggedIn = runner.waitUntil(label: "auth completion", timeout: 10.0, pollInterval: 0.2) { [self] in
            isAuthenticated()
        }
        guard loggedIn else {
            throw AuthenticationError.loginFailed
        }
    }

    private func clearFieldBestEffort(_ element: UIElement, label: String) {
        do {
            try element.setAttribute(kAXValueAttribute, value: "" as CFString)
            runner.log("\(label): cleared with AXValue")
        } catch {
            runner.log("\(label): clear skipped (\(error))")
        }
    }

    private func setTextWithoutReflection(_ text: String, on element: UIElement, label: String) -> Bool {
        do {
            try element.setAttribute(kAXValueAttribute, value: text as CFString)
            runner.log("\(label): set via AXValue without reflection check")
            return true
        } catch {
            runner.log("\(label): AXValue set failed (\(error))")
            return false
        }
    }

    private func typeTextWithoutReflection(_ text: String, into element: UIElement, label: String) -> Bool {
        guard runner.focusWithVerification(element, label: "\(label) refocus", attempts: 1) else {
            runner.log("\(label): refocus failed before typing fallback")
            return false
        }
        runner.typeTextDirect(text, label: label)
        return true
    }

    private func performBlindLogin(with credentials: DecryptedCredentials) throws {
        runner.log("auth: login form not found; falling back to keyboard-only login")
        print("Attempting KakaoTalk login with keyboard fallback...")
        kakao.activate()
        Thread.sleep(forTimeInterval: 0.25)

        runner.pressCommandA()
        Thread.sleep(forTimeInterval: 0.05)
        runner.typeTextDirect(credentials.identifier, label: "auth blind username")
        Thread.sleep(forTimeInterval: 0.1)

        runner.pressTabKey()
        Thread.sleep(forTimeInterval: 0.1)

        runner.pressCommandA()
        Thread.sleep(forTimeInterval: 0.05)
        runner.typeTextDirect(credentials.password, label: "auth blind password")
        Thread.sleep(forTimeInterval: 0.1)

        kakao.activate()
        if clickPreferredLoginButton(timeout: 1.0, label: "auth blind login button") {
            runner.log("auth: blind submit clicked preferred login button")
        } else {
            runner.log("auth: direct login button unavailable; trying keyboard focus traversal")
            pressBlindSubmitSequence([.tab], label: "auth blind submit tab-space")
        }

        if !runner.waitUntil(label: "auth blind completion", timeout: 2.0, pollInterval: 0.2, evaluateAfterTimeout: false, condition: { [self] in
            isAuthenticated()
        }) {
            runner.log("auth: first blind submit did not complete; retrying with extended Tab traversal")
            pressBlindSubmitSequence([.tab, .tab], label: "auth blind submit tab-tab-space")
        }

        if !runner.waitUntil(label: "auth blind completion retry", timeout: 1.2, pollInterval: 0.2, evaluateAfterTimeout: false, condition: { [self] in
            isAuthenticated()
        }) {
            runner.log("auth: keyboard traversal still pending; retrying with reverse traversal")
            pressBlindSubmitSequence([.shiftTab], label: "auth blind submit shift-tab-space")
        }

        let loggedIn = runner.waitUntil(label: "auth completion", timeout: 10.0, pollInterval: 0.2) { [self] in
            isAuthenticated()
        }
        guard loggedIn else {
            throw AuthenticationError.loginFailed
        }
    }

    private func isAuthenticated() -> Bool {
        if let chatListWindow = kakao.chatListWindow, !isLikelyLoginWindow(chatListWindow) {
            runner.log("auth: chatListWindow considered authenticated title='\(chatListWindow.title ?? "")'")
            return true
        }

        if let usableWindow = kakao.ensureMainWindow(timeout: 0.6, mode: .fast, trace: { [self] message in
            self.runner.log("auth: \(message)")
        }) {
            let title = usableWindow.title ?? ""
            let loginLike = isLikelyLoginWindow(usableWindow)
            runner.log("auth: usableWindow title='\(title)' loginLike=\(loginLike)")
            if !loginLike {
                return true
            }
        }

        return false
    }

    private func findLoginForm() -> LoginForm? {
        kakao.activate()
        let deadline = Date().addingTimeInterval(3.5)
        var attempt = 0
        var attemptedResetFromQRCode = false

        while Date() < deadline {
            attempt += 1
            let roots = collectLoginSearchRoots()
            runner.log("auth: login search roots=\(roots.count) attempt=\(attempt)")
            for root in roots {
                if let form = buildLoginForm(from: root) {
                    runner.log("auth: login form found on attempt \(attempt)")
                    return form
                }
            }

            if !attemptedResetFromQRCode {
                for root in roots {
                    if let resetButton = resolveQRCodeResetButton(in: root),
                       runner.clickWithRetry(resetButton, label: "auth qr reset button", attempts: 2)
                    {
                        attemptedResetFromQRCode = true
                        runner.log("auth: QR login screen reset to account login form")
                        Thread.sleep(forTimeInterval: 0.2)
                        break
                    }
                }
            }

            if attempt == 1 {
                runner.log("auth: no login form after initial activate; forcing app open")
                _ = KakaoTalkApp.forceOpen(timeout: 0.8)
                kakao.activate()
            }
            Thread.sleep(forTimeInterval: 0.15)
        }

        return nil
    }

    private func collectLoginSearchRoots() -> [UIElement] {
        var roots: [UIElement] = []
        appendUnique(kakao.focusedWindow, to: &roots)
        appendUnique(kakao.mainWindow, to: &roots)
        appendUnique(kakao.applicationElement.focusedUIElement, to: &roots)
        appendFocusedElementAncestorChain(from: kakao.applicationElement.focusedUIElement, to: &roots)

        let systemWide = UIElement.systemWide()
        appendUnique(systemWide.focusedUIElement, to: &roots)
        appendFocusedElementAncestorChain(from: systemWide.focusedUIElement, to: &roots)

        for window in kakao.windows {
            appendUnique(window, to: &roots)
        }

        let discoveredWindows = kakao.applicationElement.findAll(role: kAXWindowRole, limit: 8, maxNodes: 600)
        for window in discoveredWindows {
            appendUnique(window, to: &roots)
        }

        appendUnique(kakao.applicationElement, to: &roots)
        let sortedRoots = roots.sorted { lhs, rhs in
            let lhsScore = loginWindowScore(lhs)
            let rhsScore = loginWindowScore(rhs)
            if lhsScore == rhsScore {
                let lhsY = lhs.position?.y ?? .greatestFiniteMagnitude
                let rhsY = rhs.position?.y ?? .greatestFiniteMagnitude
                return lhsY < rhsY
            }
            return lhsScore > rhsScore
        }
        for (index, root) in sortedRoots.enumerated() {
            runner.log(
                "auth: root[\(index)] role='\(root.role ?? "")' title='\(root.title ?? "")' id='\(root.identifier ?? "")' score=\(loginWindowScore(root))"
            )
        }
        return sortedRoots
    }

    private func appendUnique(_ candidate: UIElement?, to roots: inout [UIElement]) {
        guard let candidate else { return }
        guard !roots.contains(where: { CFEqual($0.axElement, candidate.axElement) }) else { return }
        roots.append(candidate)
    }

    private func appendFocusedElementAncestorChain(from element: UIElement?, to roots: inout [UIElement]) {
        var current = element
        var remaining = 8
        while let candidate = current, remaining > 0 {
            appendUnique(candidate, to: &roots)
            current = candidate.parent
            remaining -= 1
        }
    }

    private func buildLoginForm(from window: UIElement) -> LoginForm? {
        let inputFields = window.findAll(where: { element in
            let role = element.role ?? ""
            return element.isEnabled && (role == kAXTextFieldRole || role == kAXTextAreaRole || role == "AXSecureTextField")
        }, limit: 8, maxNodes: 240)

        guard inputFields.count >= 2 else { return nil }
        let sortedInputs = inputFields.sorted { lhs, rhs in
            let lhsY = lhs.position?.y ?? .greatestFiniteMagnitude
            let rhsY = rhs.position?.y ?? .greatestFiniteMagnitude
            if lhsY == rhsY {
                let lhsX = lhs.position?.x ?? .greatestFiniteMagnitude
                let rhsX = rhs.position?.x ?? .greatestFiniteMagnitude
                return lhsX < rhsX
            }
            return lhsY < rhsY
        }

        guard let usernameField = sortedInputs.first(where: { !looksLikePasswordField($0) }) ?? sortedInputs.first else {
            return nil
        }
        guard let passwordField = sortedInputs.first(where: { candidate in
            !CFEqual(candidate.axElement, usernameField.axElement) && looksLikePasswordField(candidate)
        }) ?? sortedInputs.dropFirst().first else {
            return nil
        }

        return LoginForm(window: window, usernameField: usernameField, passwordField: passwordField)
    }

    private func loginWindowScore(_ window: UIElement) -> Int {
        var score = 0
        if isLikelyLoginWindow(window) {
            score += 100
        }
        if let title = window.title.map(normalizedText),
           title.contains("login") || title.contains("log in") || title.contains("로그인")
        {
            score += 40
        }
        return score
    }

    private func isLikelyLoginWindow(_ window: UIElement) -> Bool {
        let title = normalizedText(window.title ?? "")
        if title.contains("login") || title.contains("log in") || title.contains("로그인") {
            return true
        }

        let loginMarkerText = collectLoginMarkerText(from: window)
        if containsLoginMarkers(loginMarkerText) {
            return true
        }

        let inputs = window.findAll(where: { element in
            let role = element.role ?? ""
            return element.isEnabled && (role == kAXTextFieldRole || role == kAXTextAreaRole || role == "AXSecureTextField")
        }, limit: 6, maxNodes: 200)
        if inputs.count >= 2 {
            return true
        }

        let buttonTitles = window.findAll(role: kAXButtonRole, limit: 10, maxNodes: 200).map { button in
            normalizedText([
                button.title,
                button.axDescription,
                button.identifier,
            ].compactMap { $0 }.joined(separator: " "))
        }

        if buttonTitles.contains(where: {
            $0.contains("login") || $0.contains("log in") || $0.contains("로그인") || $0.contains("signin")
        }) {
            return true
        }

        return inputs.contains(where: looksLikePasswordField)
    }

    private func resolveSubmitButton(in window: UIElement, near referenceElement: UIElement? = nil) -> UIElement? {
        bestScoredLoginButton(from: collectLoginButtons(primaryRoot: window), near: referenceElement)
    }

    private func resolveSubmitButton(near referenceElement: UIElement? = nil) -> UIElement? {
        var buttons: [UIElement] = []
        for root in collectLoginSearchRoots() {
            for button in collectLoginButtons(primaryRoot: root) {
                appendUnique(button, to: &buttons)
            }
        }
        return bestScoredLoginButton(from: buttons, near: referenceElement)
    }

    private func resolveQRCodeResetButton(in root: UIElement) -> UIElement? {
        let buttons = collectLoginButtons(primaryRoot: root)
        return buttons.first { button in
            let text = normalizedText([
                button.title,
                button.axDescription,
                button.identifier,
            ].compactMap { $0 }.joined(separator: " "))
            return text == "start over" || text == "다시 시작"
        }
    }

    private func collectLoginButtons(primaryRoot: UIElement) -> [UIElement] {
        var buttons: [UIElement] = []
        let roots: [UIElement?] = [
            primaryRoot,
            kakao.focusedWindow,
            kakao.mainWindow,
            kakao.applicationElement.focusedUIElement,
            kakao.applicationElement,
        ]

        for root in roots {
            guard let root else { continue }
            for button in root.findAll(role: kAXButtonRole, limit: 20, maxNodes: 400) {
                appendUnique(button, to: &buttons)
            }
        }

        return buttons
    }

    private func bestScoredLoginButton(from buttons: [UIElement], near referenceElement: UIElement?) -> UIElement? {
        let referenceFrame = referenceElement?.frame
        let scoredButtons = buttons.map { button in
            (button: button, score: scoreButton(button, relativeTo: referenceFrame))
        }

        for (index, candidate) in scoredButtons.sorted(by: { $0.score > $1.score }).enumerated() {
            let metadata = buttonTextCandidates(candidate.button).joined(separator: " | ")
            runner.log("auth: submit candidate[\(index)] score=\(candidate.score) text='\(metadata)'")
        }

        return scoredButtons.max(by: { lhs, rhs in
            if lhs.score == rhs.score {
                let lhsY = lhs.button.position?.y ?? .greatestFiniteMagnitude
                let rhsY = rhs.button.position?.y ?? .greatestFiniteMagnitude
                return lhsY > rhsY
            }
            return lhs.score < rhs.score
        })?.button
    }

    private func collectLoginMarkerText(from root: UIElement) -> String {
        let roles: Set<String> = [kAXButtonRole, kAXStaticTextRole, kAXCheckBoxRole]
        let found = root.findAll(roles: roles, roleLimits: [
            kAXButtonRole: 12,
            kAXStaticTextRole: 12,
            kAXCheckBoxRole: 6,
        ], maxNodes: 260)

        let tokens = (found[kAXButtonRole] ?? []) + (found[kAXStaticTextRole] ?? []) + (found[kAXCheckBoxRole] ?? [])
        return normalizedText(tokens.map {
            [
                $0.title,
                $0.axDescription,
                $0.stringValue,
                $0.identifier,
            ].compactMap { $0 }.joined(separator: " ")
        }.joined(separator: " "))
    }

    private func containsLoginMarkers(_ text: String) -> Bool {
        let markers = [
            "qr code",
            "start over",
            "keep me logged in",
            "find my kakao account",
            "reset password",
            "remaining time",
            "how to log in",
            "log in using a qr code",
        ]
        return markers.contains(where: text.contains)
    }

    private func looksLikePasswordField(_ element: UIElement) -> Bool {
        let role = element.role ?? ""
        if role == "AXSecureTextField" {
            return true
        }

        let metadata = normalizedText([
            element.title,
            element.axDescription,
            element.identifier,
        ].compactMap { $0 }.joined(separator: " "))
        if metadata.contains("password") || metadata.contains("passwd") || metadata.contains("비밀번호") {
            return true
        }

        if let stringValue = element.stringValue, stringValue.contains("•") || stringValue.contains("*") {
            return true
        }

        return false
    }

    private func clickPreferredLoginButton(
        timeout: TimeInterval,
        label: String,
        near referenceElement: UIElement? = nil
    ) -> Bool {
        let deadline = Date().addingTimeInterval(timeout)
        repeat {
            if let submitButton = resolveSubmitButton(near: referenceElement),
               runner.clickWithRetry(submitButton, label: label, attempts: 1)
            {
                return true
            }
            if Date() >= deadline {
                return false
            }
            Thread.sleep(forTimeInterval: 0.1)
        } while true
    }

    private enum BlindSubmitStep {
        case tab
        case shiftTab
    }

    private func pressBlindSubmitSequence(_ steps: [BlindSubmitStep], label: String) {
        for step in steps {
            switch step {
            case .tab:
                runner.pressTabKey()
            case .shiftTab:
                runner.pressShiftTabKey()
            }
            Thread.sleep(forTimeInterval: 0.08)
        }
        runner.log("\(label): submitting via Space on focused button")
        runner.pressSpaceKey()
    }

    private func scoreButton(_ button: UIElement, relativeTo referenceFrame: CGRect? = nil) -> Int {
        let texts = buttonTextCandidates(button)
        var score = 0
        if texts.contains(where: isExactLoginButtonLabel) {
            score += 220
        }
        if texts.contains(where: containsAccountLoginMarker) {
            score += 120
        }
        if texts.contains(where: containsQRCodeMarker) {
            score -= 260
        }
        if button.isEnabled {
            score += 20
        }
        if let referenceFrame, let buttonFrame = button.frame {
            let deltaY = buttonFrame.midY - referenceFrame.midY
            if deltaY >= -12 && deltaY <= 180 {
                score += 30
            } else if deltaY < -12 {
                score -= 20
            }

            let deltaX = abs(buttonFrame.midX - referenceFrame.midX)
            if deltaX <= max(referenceFrame.width, buttonFrame.width) {
                score += 20
            }
        }
        return score
    }

    private func buttonTextCandidates(_ button: UIElement) -> [String] {
        Array(
            Set(
                [
                    button.title,
                    button.axDescription,
                    button.identifier,
                    button.stringValue,
                ]
                .compactMap { $0 }
                .map(normalizedText)
                .filter { !$0.isEmpty }
            )
        )
    }

    private func isExactLoginButtonLabel(_ text: String) -> Bool {
        [
            "login",
            "log in",
            "signin",
            "sign in",
            "로그인",
        ].contains(text)
    }

    private func containsAccountLoginMarker(_ text: String) -> Bool {
        guard !containsQRCodeMarker(text) else { return false }
        return text.contains("로그인") ||
            text.contains("login") ||
            text.contains("log in") ||
            text.contains("signin") ||
            text.contains("sign in")
    }

    private func containsQRCodeMarker(_ text: String) -> Bool {
        text.contains("qr") ||
            text.contains("qrcode") ||
            text.contains("qr code") ||
            text.contains("큐알") ||
            text.contains("qr코드")
    }

    private func normalizedText(_ text: String) -> String {
        text
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .folding(options: [.caseInsensitive, .diacriticInsensitive], locale: .current)
            .lowercased()
    }
}

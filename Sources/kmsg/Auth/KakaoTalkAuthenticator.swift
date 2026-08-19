import ApplicationServices.HIServices
import Foundation

enum AuthenticationMode {
    case automaticIfNeeded
    case promptForFreshCredentials
}

enum AuthenticationOutcome: String {
    case alreadyAuthenticated
    case unlocked
    case loggedIn
}

enum AuthenticationError: Error, LocalizedError {
    case loginWindowNotFound
    case missingUsernameField
    case missingPasswordField
    case loginFailed
    case lockScreenUnlockFailed
    case lockPasswordUnavailable
    case lockRejectedAccountPassword

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
        case .lockScreenUnlockFailed:
            return "KakaoTalk lock screen could not be unlocked. The saved lock password was discarded; kmsg will ask for it again on the next run."
        case .lockPasswordUnavailable:
            return "KakaoTalk is locked and no password is saved. Run `kmsg auth login --auto` in a terminal to unlock and save it."
        case .lockRejectedAccountPassword:
            return "KakaoTalk rejected the saved account password at the lock screen. Run `kmsg auth login` to save your current password, then retry."
        }
    }
}

private struct LoginForm {
    let window: UIElement
    let usernameField: UIElement
    let passwordField: UIElement
}

private struct LockScreen {
    let window: UIElement
    let passwordField: UIElement
    let confirmButton: UIElement?
}

private struct LockPasscode {
    let value: String
    /// Already persisted as the lock passcode, so a success needs no further write.
    let isRemembered: Bool
    /// Came from the saved account credentials. A rejection has to be recorded so the
    /// next run does not replay it and spend another of KakaoTalk's allowed attempts.
    let isAccountPassword: Bool
}

private struct PostLoginAcknowledgement {
    let root: UIElement
    let button: UIElement
    let message: String
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
        // KakaoTalk may be running with its main window closed (the user closed the window
        // but left the app running in the background). Activation alone won't reopen it, so
        // an already-authenticated session would be misread as logged-out and fall through to
        // a failing blind keyboard login. Reopen the window once before evaluating auth state.
        _ = kakao.ensureWindowReopened(timeout: 3.0, trace: { [self] message in
            runner.log("auth: \(message)")
        })

        let didUnlock = try unlockLockScreenIfPresent(using: store)

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
            return didUnlock ? .unlocked : .alreadyAuthenticated
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
        if dismissPostLoginAcknowledgementIfPresent() {
            return false
        }

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

    private func dismissPostLoginAcknowledgementIfPresent() -> Bool {
        guard let acknowledgement = resolvePostLoginAcknowledgement() else {
            return false
        }

        let compactMessage = acknowledgement.message.replacingOccurrences(of: "\n", with: " ")
        runner.log("auth: post-login acknowledgement detected text='\(String(compactMessage.prefix(120)))'")

        guard runner.clickWithRetry(acknowledgement.button, label: "auth post-login ok button", attempts: 2) else {
            runner.log("auth: failed to dismiss post-login acknowledgement")
            return false
        }

        Thread.sleep(forTimeInterval: 0.15)
        runner.log("auth: post-login acknowledgement dismissed")
        return true
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

    private func resolvePostLoginAcknowledgement() -> PostLoginAcknowledgement? {
        for root in collectDialogRoots() {
            guard let acknowledgement = resolvePostLoginAcknowledgement(in: root) else {
                continue
            }
            return acknowledgement
        }
        return nil
    }

    private func collectDialogRoots() -> [UIElement] {
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

        appendUnique(kakao.applicationElement, to: &roots)
        return roots
    }

    private func resolvePostLoginAcknowledgement(in root: UIElement) -> PostLoginAcknowledgement? {
        let message = collectDialogText(from: root)
        guard containsPostLoginAcknowledgementMarkers(message) else {
            return nil
        }

        let buttons = root.findAll(role: kAXButtonRole, limit: 8, maxNodes: 220)
        guard let button = buttons.max(by: { scoreAcknowledgementButton($0) < scoreAcknowledgementButton($1) }),
              scoreAcknowledgementButton(button) > 0
        else {
            return nil
        }

        return PostLoginAcknowledgement(root: root, button: button, message: message)
    }

    private func collectDialogText(from root: UIElement) -> String {
        let roles: Set<String> = [kAXButtonRole, kAXStaticTextRole, kAXGroupRole]
        let found = root.findAll(roles: roles, roleLimits: [
            kAXButtonRole: 8,
            kAXStaticTextRole: 16,
            kAXGroupRole: 6,
        ], maxNodes: 260)

        let tokens = (found[kAXStaticTextRole] ?? []) + (found[kAXButtonRole] ?? []) + (found[kAXGroupRole] ?? [])
        return normalizedText(tokens.map {
            [
                $0.title,
                $0.axDescription,
                $0.stringValue,
                $0.identifier,
            ].compactMap { $0 }.joined(separator: " ")
        }.joined(separator: " "))
    }

    // MARK: - Lock Mode

    /// KakaoTalk's "Lock mode" screen hides a still-logged-in session behind a single
    /// password field. It is not a login form, so `isAuthenticated()` accepts it as a
    /// usable window and every command silently operates against a locked app. Unlock it
    /// before the auth state is evaluated.
    /// - Returns: `true` when a lock screen was present and has been released.
    private func unlockLockScreenIfPresent(using store: CredentialStore) throws -> Bool {
        guard let lock = resolveLockScreen() else {
            return false
        }

        runner.log("auth: lock screen detected title='\(lock.window.title ?? "")'")
        print("KakaoTalk is locked. Unlocking...")

        let passcode = try resolveLockPasscode(from: store)
        kakao.activate()

        guard lock.passwordField.isFocused ||
            runner.focusWithVerification(lock.passwordField, label: "auth lock password field", attempts: 2)
        else {
            throw AuthenticationError.lockScreenUnlockFailed
        }

        // Type real key events: KakaoTalk keeps the confirm button disabled until it
        // observes input, so an AXValue-only write leaves nothing to submit.
        runner.pressCommandA()
        runner.typeTextDirect(passcode.value, label: "auth lock passcode")
        Thread.sleep(forTimeInterval: 0.1)

        // The field echoes its contents over the accessibility API, so confirm the
        // keystrokes landed intact. A dropped character would spend a real attempt and
        // look exactly like a wrong password.
        let typedValue = lock.passwordField.stringValue ?? ""
        if typedValue != passcode.value {
            runner.log("auth lock passcode: typed value did not match input; repairing before submit")
            _ = setTextWithoutReflection(passcode.value, on: lock.passwordField, label: "auth lock passcode repair")
        }

        if let confirmButton = lock.confirmButton,
           confirmButton.isEnabled,
           runner.clickWithRetry(confirmButton, label: "auth lock confirm button", attempts: 2)
        {
            runner.log("auth: lock confirm button clicked")
        } else {
            runner.log("auth: falling back to Enter for lock submit")
            runner.pressEnterKey()
        }

        // Single attempt on purpose: KakaoTalk signs the account out after repeated
        // wrong lock passwords, so a retry loop would do real damage.
        let released = runner.waitUntil(label: "auth lock release", timeout: 8.0, pollInterval: 0.2) { [self] in
            resolveLockScreen() == nil
        }

        guard released else {
            // The lock field is a plain AXTextField that echoes its value over the
            // accessibility API, so a rejected password must not be left on screen.
            clearFieldBestEffort(lock.passwordField, label: "auth lock passcode clear")
            // Drop the stored passcode so the next run does not replay a value KakaoTalk
            // just refused.
            try? store.clearLockPassword()
            if passcode.isAccountPassword {
                try? store.markAccountPasswordRejectedByLock()
                throw AuthenticationError.lockRejectedAccountPassword
            }
            throw AuthenticationError.lockScreenUnlockFailed
        }

        runner.log("auth: lock screen released")
        if !passcode.isRemembered {
            try? store.saveLockPassword(passcode.value)
        }

        // The command that triggered the unlock runs next, so let KakaoTalk finish
        // swapping the lock window for the real chat UI before handing control back.
        _ = runner.waitUntil(
            label: "auth lock settle",
            timeout: 5.0,
            pollInterval: 0.2,
            evaluateAfterTimeout: false
        ) { [self] in
            kakao.chatListWindow != nil
        }
        return true
    }

    /// Prefer secrets already on disk so an unattended run can unlock on its own; only
    /// fall back to asking when nothing stored is usable.
    private func resolveLockPasscode(from store: CredentialStore) throws -> LockPasscode {
        if let savedPasscode = store.loadLockPassword() {
            runner.log("auth: unlocking with the saved lock passcode")
            return LockPasscode(value: savedPasscode, isRemembered: true, isAccountPassword: false)
        }

        if store.isAccountPasswordRejectedByLock() {
            runner.log("auth: skipping the saved account password; the lock screen refused it before")
        } else if let account = try? store.loadCredentials() {
            runner.log("auth: unlocking with the saved account password")
            return LockPasscode(value: account.password, isRemembered: false, isAccountPassword: true)
        }

        // Background callers (mcp-server, watch, cron) have no terminal to read a secret
        // from, so say what to run instead of failing on an empty read.
        guard PasswordPrompt.canPrompt else {
            throw AuthenticationError.lockPasswordUnavailable
        }
        return LockPasscode(
            value: try PasswordPrompt.promptForPassword("KakaoTalk lock password: "),
            isRemembered: false,
            isAccountPassword: false
        )
    }

    private func resolveLockScreen() -> LockScreen? {
        for root in collectDialogRoots() {
            if let lock = resolveLockScreen(in: root) {
                return lock
            }
        }
        return nil
    }

    private func resolveLockScreen(in root: UIElement) -> LockScreen? {
        let candidates = shallowDescendants(of: root)

        // Match on the on-screen notice only, never the window title: a chat merely
        // *named* "Lock mode" must not be able to pose as the lock screen.
        let markerText = normalizedText(
            candidates
                .filter { $0.role == kAXStaticTextRole }
                .compactMap { $0.stringValue }
                .joined(separator: " ")
        )
        guard containsLockScreenMarkers(markerText) else {
            return nil
        }

        // Chat and chat-list windows always expose a scrolling message area; the lock
        // screen never does. Without this a chat whose message text quotes the lock
        // notice could be handed the password.
        guard !candidates.contains(where: { $0.role == kAXScrollAreaRole || $0.role == kAXTableRole }) else {
            return nil
        }

        // A login form also exposes an ID field; the lock screen has exactly one input.
        let fields = candidates.filter { element in
            let role = element.role ?? ""
            return element.isEnabled && (role == kAXTextFieldRole || role == kAXTextAreaRole || role == "AXSecureTextField")
        }
        guard fields.count == 1, let passwordField = fields.first else {
            return nil
        }

        let confirmButton = candidates
            .filter { $0.role == kAXButtonRole }
            .max { scoreLockConfirmButton($0) < scoreLockConfirmButton($1) }
            .flatMap { scoreLockConfirmButton($0) > 0 ? $0 : nil }

        return LockScreen(window: root, passwordField: passwordField, confirmButton: confirmButton)
    }

    /// Lock screen controls sit directly under the window, so the top two levels are
    /// enough. Staying shallow also keeps chat message text — nested deep inside scroll
    /// areas — from matching a lock marker, which would type the password into a chat.
    private func shallowDescendants(of root: UIElement) -> [UIElement] {
        let children = root.children
        return children + children.flatMap { $0.children }
    }

    private func containsLockScreenMarkers(_ text: String) -> Bool {
        let markers = [
            "currently locked",
            "lock mode",
            "잠금 모드",
            "잠겨 있습니다",
            "잠금 상태",
        ]
        return markers.contains(where: text.contains)
    }

    private func scoreLockConfirmButton(_ button: UIElement) -> Int {
        let texts = buttonTextCandidates(button)
        var score = 0
        if texts.contains("ok") || texts.contains("확인") {
            score += 120
        }
        if texts.contains("unlock") || texts.contains("잠금 해제") {
            score += 100
        }
        if texts.contains(where: { $0.contains("switch account") || $0.contains("계정 변경") }) {
            score -= 200
        }
        return score
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

    private func containsPostLoginAcknowledgementMarkers(_ text: String) -> Bool {
        let exactMarkers = [
            "currently logged in",
            "already logged in",
            "you are currently logged in",
            "you are already logged in",
            "logged in on another device",
            "이미 로그인",
            "로그인되어 있습니다",
        ]

        if exactMarkers.contains(where: text.contains) {
            return true
        }

        let hasLoggedInMarker =
            text.contains("logged in") ||
            text.contains("이미 로그인") ||
            text.contains("로그인되어")
        let hasPromptMarker =
            text.contains("ok") ||
            text.contains("확인") ||
            text.contains("currently") ||
            text.contains("already") ||
            text.contains("device")

        return hasLoggedInMarker && hasPromptMarker
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

    private func scoreAcknowledgementButton(_ button: UIElement) -> Int {
        let texts = buttonTextCandidates(button)
        var score = 0
        if texts.contains("ok") {
            score += 140
        }
        if texts.contains("확인") {
            score += 120
        }
        if texts.contains("confirm") {
            score += 100
        }
        if button.isEnabled {
            score += 20
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

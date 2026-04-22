import ApplicationServices.HIServices
import Foundation

struct AXActionRunner {
    typealias TraceWriter = (String) -> Void

    private let traceEnabled: Bool
    private let traceWriter: TraceWriter

    init(traceEnabled: Bool) {
        self.traceEnabled = traceEnabled
        self.traceWriter = { message in
            guard let data = "[trace-ax] \(message)\n".data(using: .utf8) else { return }
            FileHandle.standardError.write(data)
        }
    }

    func log(_ message: @autoclosure () -> String) {
        guard traceEnabled else { return }
        traceWriter(message())
    }

    @discardableResult
    func waitUntil(
        label: String,
        timeout: TimeInterval,
        pollInterval: TimeInterval = 0.1,
        evaluateAfterTimeout: Bool = true,
        condition: () -> Bool
    ) -> Bool {
        let start = Date()
        while Date().timeIntervalSince(start) < timeout {
            if condition() {
                log("\(label): ready")
                return true
            }
            Thread.sleep(forTimeInterval: pollInterval)
        }
        let elapsed = Date().timeIntervalSince(start)
        log("\(label): timeout after \(String(format: "%.2f", elapsed))s")
        return evaluateAfterTimeout ? condition() : false
    }

    @discardableResult
    func focusWithVerification(
        _ element: UIElement,
        label: String,
        attempts: Int = 3,
        retryDelay: TimeInterval = 0.08
    ) -> Bool {
        for attempt in 1...max(attempts, 1) {
            do {
                try element.focus()
            } catch {
                log("\(label): focus attempt \(attempt) failed (\(error))")
            }

            if element.isFocused || waitUntil(label: "\(label) focused", timeout: 0.25, condition: {
                element.isFocused
            }) {
                log("\(label): focused on attempt \(attempt)")
                return true
            }

            do {
                try element.press()
            } catch {
                log("\(label): press fallback \(attempt) failed (\(error))")
            }

            if element.isFocused || waitUntil(label: "\(label) focused", timeout: 0.25, condition: {
                element.isFocused
            }) {
                log("\(label): focused by press fallback on attempt \(attempt)")
                return true
            }

            Thread.sleep(forTimeInterval: retryDelay)
        }

        log("\(label): focus verification failed")
        return false
    }

    @discardableResult
    func setTextWithVerification(
        _ text: String,
        on element: UIElement,
        label: String,
        attempts: Int = 2,
        retryDelay: TimeInterval = 0.08
    ) -> Bool {
        for attempt in 1...max(attempts, 1) {
            do {
                try element.setAttribute(kAXValueAttribute, value: text as CFString)
            } catch {
                log("\(label): set AXValue attempt \(attempt) failed (\(error))")
                Thread.sleep(forTimeInterval: retryDelay)
                continue
            }

            let reflected = waitUntil(label: "\(label) AXValue reflected", timeout: 0.3, condition: {
                isInputReflected(expected: text, current: element.stringValue)
            })
            if reflected {
                log("\(label): set AXValue succeeded on attempt \(attempt)")
                return true
            }

            Thread.sleep(forTimeInterval: retryDelay)
        }

        log("\(label): set AXValue verification failed")
        return false
    }

    @discardableResult
    func typeTextWithVerification(
        _ text: String,
        on element: UIElement?,
        label: String,
        attempts: Int = 2,
        perCharacterDelay: TimeInterval = 0.01,
        retryDelay: TimeInterval = 0.08
    ) -> Bool {
        for attempt in 1...max(attempts, 1) {
            let before = element?.stringValue
            typeText(text, perCharacterDelay: perCharacterDelay)
            guard let element else {
                log("\(label): typed without verification target")
                return true
            }

            let reflected = waitUntil(label: "\(label) typing reflected", timeout: 0.3, condition: {
                let after = element.stringValue
                return isTypingReflected(before: before, after: after, typed: text)
            })
            if reflected {
                log("\(label): typing reflected on attempt \(attempt)")
                return true
            }

            Thread.sleep(forTimeInterval: retryDelay)
        }

        log("\(label): typing verification failed")
        return false
    }

    @discardableResult
    func pressEnterWithVerification(
        on element: UIElement?,
        label: String,
        attempts: Int = 2,
        reflectionTimeout: TimeInterval = 0.45,
        retryDelay: TimeInterval = 0.12
    ) -> Bool {
        for attempt in 1...max(attempts, 1) {
            let before = element?.stringValue ?? ""
            pressKey(code: 36)

            guard let element else {
                log("\(label): Enter sent without verification target")
                return true
            }

            let reflected = waitUntil(label: "\(label) Enter reflected", timeout: reflectionTimeout, condition: {
                let after = element.stringValue ?? ""
                return didEnterEffect(before: before, after: after)
            })
            if reflected {
                log("\(label): Enter reflected on attempt \(attempt)")
                return true
            }

            Thread.sleep(forTimeInterval: retryDelay)
        }

        log("\(label): Enter verification failed")
        return false
    }

    @discardableResult
    func clickWithRetry(
        _ element: UIElement,
        label: String,
        attempts: Int = 3,
        retryDelay: TimeInterval = 0.2
    ) -> Bool {
        for attempt in 1...attempts {
            do {
                try element.press()
                log("\(label): clicked on attempt \(attempt)")
                return true
            } catch {
                log("\(label): click attempt \(attempt) failed (\(error))")
                Thread.sleep(forTimeInterval: retryDelay)
            }
        }
        return false
    }

    func pressEscape() {
        pressKey(code: 53)
    }

    func pressEnterKey() {
        pressKey(code: 36)
    }

    func pressDownArrowKey() {
        pressKey(code: 125)
    }

    func pressTabKey() {
        pressKey(code: 48)
    }

    func pressShiftTabKey() {
        pressKey(code: 48, flags: .maskShift)
    }

    func pressSpaceKey() {
        pressKey(code: 49)
    }

    func pressCommandW() {
        pressKey(code: 13, flags: .maskCommand) // W
    }

    func pressCommandA() {
        pressKey(code: 0, flags: .maskCommand) // A
    }

    func pressPaste() {
        pressKey(code: 9, flags: .maskCommand) // V
    }

    func typeTextDirect(_ text: String, label: String, perCharacterDelay: TimeInterval = 0.01) {
        typeText(text, perCharacterDelay: perCharacterDelay)
        log("\(label): typed without reflection check")
    }

    private func typeText(_ text: String, perCharacterDelay: TimeInterval) {
        let source = CGEventSource(stateID: .hidSystemState)

        for char in text {
            let unit = String(char)
            if let down = CGEvent(keyboardEventSource: source, virtualKey: 0, keyDown: true) {
                var unicode = Array(unit.utf16)
                down.keyboardSetUnicodeString(stringLength: unicode.count, unicodeString: &unicode)
                down.post(tap: .cghidEventTap)
            }
            if let up = CGEvent(keyboardEventSource: source, virtualKey: 0, keyDown: false) {
                up.post(tap: .cghidEventTap)
            }
            Thread.sleep(forTimeInterval: perCharacterDelay)
        }
    }

    private func pressKey(code: CGKeyCode, flags: CGEventFlags = []) {
        let source = CGEventSource(stateID: .hidSystemState)
        if let down = CGEvent(keyboardEventSource: source, virtualKey: code, keyDown: true) {
            down.flags = flags
            down.post(tap: .cghidEventTap)
        }
        if let up = CGEvent(keyboardEventSource: source, virtualKey: code, keyDown: false) {
            up.flags = flags
            up.post(tap: .cghidEventTap)
        }
    }

    private func isInputReflected(expected: String, current: String?) -> Bool {
        guard let current else { return false }
        return current == expected || current.contains(expected)
    }

    private func isTypingReflected(before: String?, after: String?, typed: String) -> Bool {
        guard let after else { return false }
        if after == typed || after.contains(typed) {
            return true
        }
        guard let before else { return !after.isEmpty }
        return after != before
    }

    private func didEnterEffect(before: String, after: String) -> Bool {
        let trimmedAfter = after.trimmingCharacters(in: .whitespacesAndNewlines)
        if !before.isEmpty && trimmedAfter.isEmpty {
            return true
        }
        return after != before
    }
}

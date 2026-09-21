import ApplicationServices.HIServices
import AppKit
import Foundation

/// Handles macOS Accessibility permission checking and requesting
public enum AccessibilityPermission {
    private static let settingsURL = URL(string: "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility")

    private static var executableURL: URL? {
        Bundle.main.executableURL?.resolvingSymlinksInPath()
    }

    /// Check if the app has accessibility permissions
    public static func isGranted() -> Bool {
        AXIsProcessTrusted()
    }

    /// Prompt user to grant accessibility permissions if not already granted
    /// Returns true if permissions are already granted
    @discardableResult
    public static func requestIfNeeded() -> Bool {
        let key = "AXTrustedCheckOptionPrompt" as CFString
        let options = [key: true] as CFDictionary
        return AXIsProcessTrustedWithOptions(options)
    }

    /// Ensure accessibility permission by triggering the system prompt and opening settings if needed.
    /// Note: macOS does not allow fully automatic granting; user confirmation in System Settings is required.
    @discardableResult
    public static func ensureGranted(
        autoPrompt: Bool = true,
        openSettingsOnFailure: Bool = true,
        waitAfterPrompt: TimeInterval = 1.0
    ) -> Bool {
        if isGranted() {
            return true
        }

        if autoPrompt {
            _ = requestIfNeeded()
            if waitUntilGranted(timeout: waitAfterPrompt) {
                return true
            }
        }

        if openSettingsOnFailure {
            // Reveal the actual binary (including Homebrew symlink targets) so it
            // can be dragged into the permission list or selected with '+'.
            if let executableURL {
                NSWorkspace.shared.activateFileViewerSelecting([executableURL])
            }
            FileHandle.standardError.write(Data("Opening Accessibility settings...\n".utf8))
            if !openAccessibilitySettings() {
                FileHandle.standardError.write(Data("Could not open System Settings automatically. Please open System Settings > Privacy & Security > Accessibility manually.\n".utf8))
            }
        }

        return isGranted()
    }

    /// Open the Accessibility pane, falling back to System Settings if the deep link fails.
    @discardableResult
    public static func openAccessibilitySettings() -> Bool {
        if let settingsURL, NSWorkspace.shared.open(settingsURL) {
            return true
        }
        guard let appURL = NSWorkspace.shared.urlForApplication(withBundleIdentifier: "com.apple.systempreferences") else {
            return false
        }
        return NSWorkspace.shared.open(appURL)
    }

    /// Print instructions for granting accessibility permissions
    public static func printInstructions() {
        print("""
        ⚠️  Accessibility permission required!

        macOS requires you to approve Accessibility access manually.

        To use kmsg, you need to grant Accessibility permissions:

        1. Open System Settings > Privacy & Security > Accessibility
        2. Click the '+' button
        3. Press Command+Shift+G, paste the binary path below, and select it
        4. Enable the toggle for kmsg
        5. Run your kmsg command again

        Binary path: \(executableURL?.path ?? "(unavailable; select the kmsg binary you just ran)")

        You can also drag the kmsg binary from Finder into the Accessibility list.
        If kmsg is already enabled but permission is still denied after an update,
        remove its old entry with '-' and add the binary above again.
        """)
    }

    private static func waitUntilGranted(timeout: TimeInterval, pollInterval: TimeInterval = 0.1) -> Bool {
        let start = Date()
        while Date().timeIntervalSince(start) < timeout {
            if isGranted() {
                return true
            }
            Thread.sleep(forTimeInterval: pollInterval)
        }
        return isGranted()
    }
}

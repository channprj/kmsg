import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
AUTHENTICATOR = REPO_ROOT / "Sources" / "kmsg" / "Auth" / "KakaoTalkAuthenticator.swift"
STATUS_COMMAND = REPO_ROOT / "Sources" / "kmsg" / "Commands" / "StatusCommand.swift"


def section(source: str, start: str, end: str) -> str:
    begin = source.index(start)
    return source[begin : source.index(end, begin)]


class PostLoginAcknowledgementContractTests(unittest.TestCase):
    def test_attached_sheets_are_inspected_before_parent_windows(self) -> None:
        source = AUTHENTICATOR.read_text(encoding="utf-8")
        roots = section(
            source,
            "private func collectDialogRoots() -> [UIElement] {",
            "private func appendAttachedSheets(",
        )

        sheets = roots.index("appendAttachedSheets(from: window, to: &roots)")
        windows = roots.index("appendUnique(window, to: &roots)")
        self.assertLess(sheets, windows)
        self.assertIn("kAXSheetsAttribute", source)
        self.assertIn("kAXSheetRole", source)

    def test_existing_another_device_modal_is_dismissed_and_waited_before_relogin(self) -> None:
        source = AUTHENTICATOR.read_text(encoding="utf-8")
        ensure = section(
            source,
            "func ensureAuthenticated(",
            "private func performLogin(",
        )

        # Dismissing the modal must wait for KakaoTalk to finish signing in rather than
        # immediately falling through into findLoginForm / performBlindLogin.
        auto_branch = ensure[ensure.index("if try completeLoginIfPostLoginAcknowledgementPresent(using: store) {\n            return .loggedIn"):]
        ack_pos = auto_branch.index("completeLoginIfPostLoginAcknowledgementPresent(using: store)")
        auth_pos = auto_branch.index("if isAuthenticated() {")
        form_pos = auto_branch.index("findLoginFormOrAuthCompletion(using: store)")
        self.assertLess(ack_pos, auth_pos)
        self.assertLess(auth_pos, form_pos)

    def test_modal_dismissal_verifies_by_state_and_has_click_and_enter_fallbacks(self) -> None:
        source = AUTHENTICATOR.read_text(encoding="utf-8")
        dismiss = section(
            source,
            "private func handlePostLoginAcknowledgementIfPresent()",
            "private func waitForAcknowledgementDismissal(",
        )

        self.assertIn("kakao.activate()", dismiss)
        self.assertIn("acknowledgement.button.press()", dismiss)
        self.assertIn("waitForAcknowledgementDismissal(", dismiss)
        self.assertIn("runner.mouseClick(", dismiss)
        self.assertIn("runner.pressEnterKey()", dismiss)

    def test_acknowledgement_button_prefers_right_ok_and_rejects_cancel(self) -> None:
        source = AUTHENTICATOR.read_text(encoding="utf-8")
        resolve = section(
            source,
            "private func resolvePostLoginAcknowledgement(in root: UIElement)",
            "private func collectDialogText(",
        )
        score = section(
            source,
            "private func scoreAcknowledgementButton(",
            "private func buttonTextCandidates(",
        )

        self.assertIn("kAXDefaultButtonAttribute", source)
        self.assertIn("lhsX < rhsX", resolve)
        self.assertIn('"cancel"', score)
        self.assertIn('"취소"', score)
        self.assertIn("return -200", score)
        self.assertIn('"ok"', score)
        self.assertIn('"확인"', score)

    def test_status_command_launches_and_authenticates_kakaotalk(self) -> None:
        source = STATUS_COMMAND.read_text(encoding="utf-8")

        self.assertIn("KakaoTalkApp.launch()", source)
        self.assertIn("AuthBootstrap.requireAuthenticated", source)


if __name__ == "__main__":
    unittest.main()

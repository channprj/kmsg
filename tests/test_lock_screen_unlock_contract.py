import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
AUTHENTICATOR = REPO_ROOT / "Sources" / "kmsg" / "Auth" / "KakaoTalkAuthenticator.swift"
CREDENTIAL_STORE = REPO_ROOT / "Sources" / "kmsg" / "Auth" / "CredentialStore.swift"


def section(source: str, start: str, end: str) -> str:
    begin = source.index(start)
    return source[begin : source.index(end, begin)]


class LockScreenUnlockContractTests(unittest.TestCase):
    def test_unlock_runs_before_the_auth_state_is_evaluated(self) -> None:
        source = AUTHENTICATOR.read_text(encoding="utf-8")

        unlock = source.index("let didUnlock = try unlockLockScreenIfPresent(using: store)")
        first_auth_check = source.index("if isAuthenticated() {")
        self.assertLess(unlock, first_auth_check)

    def test_lock_screen_detection_stays_shallow_and_specific(self) -> None:
        source = AUTHENTICATOR.read_text(encoding="utf-8")
        detection = section(
            source,
            "private func resolveLockScreen(in root: UIElement) -> LockScreen? {",
            "private func shallowDescendants(",
        )

        # A deep traversal, the window title, or a missing scroll-area guard would each
        # let an ordinary chat window pose as the lock screen and receive the password.
        self.assertNotIn("findAll", detection)
        self.assertNotIn("root.title", detection)
        self.assertIn("shallowDescendants(of: root)", detection)
        self.assertIn("kAXScrollAreaRole", detection)
        self.assertIn("fields.count == 1", detection)

    def test_unlock_prefers_stored_secrets_over_prompting(self) -> None:
        source = AUTHENTICATOR.read_text(encoding="utf-8")
        resolve = section(
            source,
            "private func resolveLockPasscode(",
            "private func resolveLockScreen() -> LockScreen? {",
        )

        # An unattended run has to unlock from what is already on disk: the remembered
        # lock passcode first, then the saved account password, and only then a prompt.
        saved = resolve.index("store.loadLockPassword()")
        account = resolve.index("store.loadCredentials()")
        prompt = resolve.index("PasswordPrompt.promptForPassword(")
        self.assertLess(saved, account)
        self.assertLess(account, prompt)

    def test_a_refused_account_password_is_not_replayed(self) -> None:
        source = AUTHENTICATOR.read_text(encoding="utf-8")
        resolve = section(
            source,
            "private func resolveLockPasscode(",
            "private func resolveLockScreen() -> LockScreen? {",
        )
        failure = section(
            source,
            "guard released else {",
            "runner.log(\"auth: lock screen released\")",
        )

        # Replaying a password the lock screen already refused would spend one of
        # KakaoTalk's allowed attempts on every later run and force a logout.
        self.assertIn("store.isAccountPasswordRejectedByLock()", resolve)
        self.assertIn("passcode.isAccountPassword", failure)
        self.assertIn("store.markAccountPasswordRejectedByLock()", failure)

    def test_typed_passcode_is_verified_before_submitting(self) -> None:
        source = AUTHENTICATOR.read_text(encoding="utf-8")
        unlock = section(
            source,
            "private func unlockLockScreenIfPresent(",
            "private func resolveLockPasscode(",
        )

        # A dropped keystroke is indistinguishable from a wrong password once submitted.
        verify = unlock.index("typedValue != passcode.value")
        self.assertLess(unlock.index("runner.typeTextDirect(passcode.value"), verify)
        self.assertLess(verify, unlock.index("runner.pressEnterKey()"))

    def test_unlock_refuses_to_prompt_without_a_terminal(self) -> None:
        source = AUTHENTICATOR.read_text(encoding="utf-8")
        unlock = section(
            source,
            "private func unlockLockScreenIfPresent(",
            "private func resolveLockScreen() -> LockScreen? {",
        )

        # mcp-server, watch, and cron callers have no terminal, so an empty read must
        # not masquerade as a wrong passcode.
        guard = unlock.index("PasswordPrompt.canPrompt")
        prompt = unlock.index("PasswordPrompt.promptForPassword(")
        self.assertLess(guard, prompt)
        self.assertIn("AuthenticationError.lockPasswordUnavailable", unlock)

    def test_unlock_waits_for_the_chat_ui_before_returning(self) -> None:
        source = AUTHENTICATOR.read_text(encoding="utf-8")
        unlock = section(
            source,
            "private func unlockLockScreenIfPresent(",
            "private func resolveLockScreen() -> LockScreen? {",
        )

        # The command that triggered the unlock runs next and needs a settled window.
        settle = unlock.index('label: "auth lock settle"')
        self.assertLess(unlock.index("auth: lock screen released"), settle)
        self.assertIn("kakao.chatListWindow != nil", unlock)

    def test_failed_unlock_discards_the_typed_and_stored_passcode(self) -> None:
        source = AUTHENTICATOR.read_text(encoding="utf-8")
        failure = section(
            source,
            "guard released else {",
            "throw AuthenticationError.lockScreenUnlockFailed",
        )

        self.assertIn("clearFieldBestEffort(lock.passwordField", failure)
        self.assertIn("store.clearLockPassword()", failure)

    def test_store_keeps_the_lock_passcode_as_its_own_secret(self) -> None:
        store = CREDENTIAL_STORE.read_text(encoding="utf-8")

        for member in (
            "var encryptedLockPassword: String?",
            "func loadLockPassword() -> String?",
            "func saveLockPassword(_ password: String) throws",
            "func clearLockPassword() throws",
        ):
            self.assertIn(member, store)

    def test_saving_account_credentials_preserves_the_lock_passcode(self) -> None:
        store = CREDENTIAL_STORE.read_text(encoding="utf-8")
        save = section(
            store,
            "func save(identifier: String, password: String) throws {",
            "func loadLockPassword()",
        )

        # Writing a fresh document here would drop the stored lock passcode on every
        # `kmsg auth login`.
        self.assertIn("try updateDocument { document in", save)
        self.assertNotIn("StoredCredentialsDocument(", save)


if __name__ == "__main__":
    unittest.main()

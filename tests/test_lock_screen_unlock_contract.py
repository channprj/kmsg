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

    def test_unlock_uses_the_lock_passcode_not_the_account_password(self) -> None:
        source = AUTHENTICATOR.read_text(encoding="utf-8")
        unlock = section(
            source,
            "private func unlockLockScreenIfPresent(",
            "private func resolveLockScreen() -> LockScreen? {",
        )

        self.assertIn("store.loadLockPassword()", unlock)
        self.assertNotIn("loadCredentials", unlock)

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

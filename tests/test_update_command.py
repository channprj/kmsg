import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
DEBUG_BINARY = REPO_ROOT / ".build" / "debug" / "kmsg"
UPDATE_SOURCES = REPO_ROOT / "Sources" / "kmsg" / "Update"

FAKE_BREW = """#!/bin/bash
printf '%s\\n' "$*" >> "$BREW_LOG"
case "$1" in
  update-if-needed)
    exit 0
    ;;
  list)
    if [ -n "$FAKE_KMSG_INSTALLED" ]; then
      echo "kmsg 1.260101.0"
      exit 0
    fi
    exit 1
    ;;
  install|upgrade)
    exit "${FAKE_BREW_PACKAGE_STATUS:-0}"
    ;;
  --prefix)
    echo "$FAKE_KMSG_PREFIX"
    exit 0
    ;;
esac
exit 1
"""

FAKE_KMSG = """#!/bin/bash
echo "9.999999.9"
"""


def build_debug_binary() -> Path:
    if not DEBUG_BINARY.exists():
        subprocess.run(["swift", "build"], cwd=REPO_ROOT, check=True)
    return DEBUG_BINARY


def write_executable(path: Path, contents: str) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(contents, encoding="utf-8")
    path.chmod(0o755)
    return path


class UpdateCommandTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.binary = build_debug_binary()

    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.root = Path(os.path.realpath(self._tmp.name))
        self.brew_log = self.root / "brew.log"
        self.brew_prefix = self.root / "homebrew" / "opt" / "kmsg"
        write_executable(self.root / "bin" / "brew", FAKE_BREW)
        write_executable(self.brew_prefix / "bin" / "kmsg", FAKE_KMSG)
        self.addCleanup(self._tmp.cleanup)

    def run_update(self, executable: Path, **extra_env: str) -> subprocess.CompletedProcess:
        env = {
            "PATH": f"{self.root / 'bin'}:/usr/bin:/bin",
            "HOME": str(self.root),
            "BREW_LOG": str(self.brew_log),
            "FAKE_KMSG_PREFIX": str(self.brew_prefix),
        }
        env.update(extra_env)
        return subprocess.run(
            [str(executable), "update"],
            capture_output=True,
            text=True,
            env=env,
            timeout=120,
        )

    def brew_invocations(self) -> list[str]:
        if not self.brew_log.exists():
            return []
        return self.brew_log.read_text(encoding="utf-8").splitlines()

    def install_direct_binary(self) -> Path:
        target = self.root / "local" / "bin" / "kmsg"
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(self.binary, target)
        return target

    def test_missing_formula_is_installed_with_expected_arguments(self) -> None:
        result = self.run_update(self.binary)

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(
            self.brew_invocations(),
            [
                "update-if-needed",
                "list --formula --versions kmsg",
                "install --formula --overwrite --no-ask channprj/tap/kmsg",
                "--prefix kmsg",
            ],
        )
        self.assertIn("9.999999.9", result.stdout)
        self.assertIn(str(self.brew_prefix / "bin" / "kmsg"), result.stdout)

    def test_installed_formula_is_upgraded(self) -> None:
        result = self.run_update(self.binary, FAKE_KMSG_INSTALLED="1")

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn(
            "upgrade --formula --overwrite --no-ask channprj/tap/kmsg",
            self.brew_invocations(),
        )
        self.assertNotIn(
            "install --formula --overwrite --no-ask channprj/tap/kmsg",
            self.brew_invocations(),
        )

    def test_build_product_is_never_replaced(self) -> None:
        result = self.run_update(self.binary)

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertFalse(DEBUG_BINARY.is_symlink())

    def test_direct_binary_is_replaced_with_homebrew_link(self) -> None:
        target = self.install_direct_binary()

        result = self.run_update(target)

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertTrue(target.is_symlink())
        self.assertEqual(
            os.path.realpath(target),
            os.path.realpath(self.brew_prefix / "bin" / "kmsg"),
        )
        self.assertIn(str(target), result.stdout)

    def test_binary_already_managed_by_homebrew_is_left_alone(self) -> None:
        homebrew_binary = self.brew_prefix / "bin" / "kmsg"
        shutil.copy2(self.binary, homebrew_binary)
        target = self.root / "local" / "bin" / "kmsg"
        target.parent.mkdir(parents=True, exist_ok=True)
        target.symlink_to(homebrew_binary)

        result = self.run_update(target)

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(os.readlink(target), str(homebrew_binary))
        self.assertIn(str(homebrew_binary), result.stdout)

    def test_failed_formula_operation_keeps_the_current_binary(self) -> None:
        target = self.install_direct_binary()

        result = self.run_update(target, FAKE_BREW_PACKAGE_STATUS="1")

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("brew install", result.stderr)
        self.assertFalse(target.is_symlink())
        self.assertTrue(target.is_file())

    def test_cancelled_formula_operation_is_reported_as_cancellation(self) -> None:
        target = self.install_direct_binary()

        result = self.run_update(target, FAKE_BREW_PACKAGE_STATUS="130")

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("cancelled", result.stderr)
        self.assertFalse(target.is_symlink())

    def test_root_help_lists_the_update_command(self) -> None:
        result = subprocess.run(
            [str(self.binary), "--help"],
            capture_output=True,
            text=True,
            timeout=60,
        )

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("update", result.stdout)

    def test_update_help_describes_the_homebrew_workflow(self) -> None:
        result = subprocess.run(
            [str(self.binary), "update", "--help"],
            capture_output=True,
            text=True,
            timeout=60,
        )

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("Homebrew", result.stdout)
        self.assertIn("channprj/tap/kmsg", result.stdout)


class UpdateSourceContractTests(unittest.TestCase):
    """Covers paths that must not run for real during tests."""

    def source(self) -> str:
        return "\n".join(
            path.read_text(encoding="utf-8") for path in sorted(UPDATE_SOURCES.glob("*.swift"))
        )

    def test_homebrew_is_located_in_path_and_default_prefixes(self) -> None:
        source = self.source()

        self.assertIn('"/opt/homebrew/bin/brew"', source)
        self.assertIn('"/usr/local/bin/brew"', source)

    def test_homebrew_installer_downloads_and_runs_the_official_script(self) -> None:
        source = self.source()

        self.assertIn(
            "https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh",
            source,
        )
        self.assertIn('"/usr/bin/curl"', source)
        self.assertIn('"--fail"', source)
        self.assertIn('"--location"', source)
        self.assertIn('"/bin/bash"', source)
        self.assertIn("removeItem", source)

    def test_privileged_replacement_backs_up_and_restores(self) -> None:
        source = self.source()

        self.assertIn('"/usr/bin/sudo"', source)
        self.assertIn("backup", source)

    def test_updater_never_uses_a_shell_command_string(self) -> None:
        source = self.source()

        self.assertNotIn('"-c"', source)
        self.assertNotIn("/bin/sh", source)


if __name__ == "__main__":
    unittest.main()

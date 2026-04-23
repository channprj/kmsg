import subprocess
import tempfile
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
VERSION_GEN_BINARY = REPO_ROOT / ".build" / "debug" / "VersionGenTool-tool"


class VersionGenToolTests(unittest.TestCase):
    def run_version_gen(self, version: str) -> tuple[subprocess.CompletedProcess[str], str | None]:
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp = Path(tmpdir)
            version_path = tmp / "VERSION"
            output_path = tmp / "GeneratedVersion.swift"
            version_path.write_text(f"{version}\n", encoding="utf-8")

            result = subprocess.run(
                [
                    str(VERSION_GEN_BINARY),
                    str(version_path),
                    str(output_path),
                ],
                cwd=REPO_ROOT,
                capture_output=True,
                text=True,
            )

            output_text = output_path.read_text(encoding="utf-8") if output_path.exists() else None
            return result, output_text

    def test_accepts_major_date_patch_version(self) -> None:
        self.assertTrue(VERSION_GEN_BINARY.exists(), f"missing test binary: {VERSION_GEN_BINARY}")
        result, output_text = self.run_version_gen("1.260424.0")

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIsNotNone(output_text)
        self.assertIn('static let current = "1.260424.0"', output_text)

    def test_rejects_legacy_calendar_version(self) -> None:
        self.assertTrue(VERSION_GEN_BINARY.exists(), f"missing test binary: {VERSION_GEN_BINARY}")
        result, _ = self.run_version_gen("2026.0422.22")

        self.assertNotEqual(result.returncode, 0)
        self.assertIn(
            "VERSION must match MAJOR.YYMMDD.PATCH_COUNT",
            f"{result.stdout}\n{result.stderr}",
        )


if __name__ == "__main__":
    unittest.main()

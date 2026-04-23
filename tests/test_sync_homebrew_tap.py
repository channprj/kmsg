import hashlib
import json
import subprocess
import tempfile
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
SCRIPT_PATH = REPO_ROOT / "tools" / "sync_homebrew_tap.py"


class SyncHomebrewTapTests(unittest.TestCase):
    def test_generates_latest_formula_for_major_date_patch_versions_and_preserves_recent_legacy_releases(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp = Path(tmpdir)
            tap_dir = tmp / "homebrew-tap"
            formula_dir = tap_dir / "Formula"
            formula_dir.mkdir(parents=True)

            readme_path = tap_dir / "README.md"
            readme_path.write_text(
                "# homebrew-tap\n\n"
                "Homebrew tap. Written by chann.\n\n"
                "## Install\n\n"
                "```bash\n"
                "brew install channprj/tap/kmsg\n"
                "brew install channprj/tap/pdf-to-typst\n"
                "```\n",
                encoding="utf-8",
            )

            stale_formula = formula_dir / "kmsg@0.1.0.rb"
            stale_formula.write_text("stale", encoding="utf-8")

            asset_path = tmp / "kmsg-macos-universal"
            asset_bytes = b"kmsg-binary"
            asset_path.write_bytes(asset_bytes)
            expected_sha = hashlib.sha256(asset_bytes).hexdigest()

            release_tags = [
                "v0.1.0",
                "v0.1.1",
                "v0.2.0",
                "v0.2.1",
                "v0.3.0",
                "v1.260423.0",
                "v1.260423.1",
                "v1.260424.0",
                "v1.260424.1",
                "v1.260424.9",
                "v1.260425.0",
            ]
            metadata = {}
            for tag in release_tags:
                version = tag.removeprefix("v")
                sha = expected_sha if tag == "v1.260425.0" else hashlib.sha256(version.encode("utf-8")).hexdigest()
                metadata[tag] = {
                    "url": f"https://github.com/channprj/kmsg/releases/download/{tag}/kmsg-macos-universal",
                    "sha256": sha,
                    "version": version,
                }

            metadata_path = tmp / "release-metadata.json"
            metadata_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

            result = subprocess.run(
                [
                    "python3",
                    str(SCRIPT_PATH),
                    "--tap-dir",
                    str(tap_dir),
                    "--asset-path",
                    str(asset_path),
                    "--repository",
                    "channprj/kmsg",
                    "--current-tag",
                    "v1.260425.0",
                    "--release-metadata-file",
                    str(metadata_path),
                    "--keep-versions",
                    "10",
                ],
                cwd=REPO_ROOT,
                capture_output=True,
                text=True,
            )

            self.assertEqual(result.returncode, 0, result.stderr)

            latest_formula = (formula_dir / "kmsg.rb").read_text(encoding="utf-8")
            self.assertIn(
                'url "https://github.com/channprj/kmsg/releases/download/v1.260425.0/kmsg-macos-universal"',
                latest_formula,
            )
            self.assertIn(f'sha256 "{expected_sha}"', latest_formula)
            self.assertIn('version "1.260425.0"', latest_formula)

            expected_versions = [
                "0.1.1",
                "0.2.0",
                "0.2.1",
                "0.3.0",
                "1.260423.0",
                "1.260423.1",
                "1.260424.0",
                "1.260424.1",
                "1.260424.9",
                "1.260425.0",
            ]
            removed_versions = [
                "0.1.0",
            ]

            for version in removed_versions:
                self.assertFalse((formula_dir / f"kmsg@{version}.rb").exists())

            for version in expected_versions:
                formula_path = formula_dir / f"kmsg@{version}.rb"
                self.assertTrue(formula_path.exists(), f"missing formula for {version}")
                formula_body = formula_path.read_text(encoding="utf-8")
                self.assertIn(f'version "{version}"', formula_body)
                class_suffix = version.replace(".", "")
                self.assertIn(f"class KmsgAT{class_suffix} < Formula", formula_body)
                self.assertIn(f'sha256 "{metadata[f"v{version}"]["sha256"]}"', formula_body)

            readme_text = readme_path.read_text(encoding="utf-8")
            self.assertIn("## kmsg Versioned Installs", readme_text)
            self.assertIn("brew install channprj/tap/kmsg@1.260425.0", readme_text)
            self.assertIn("Recent 10 releases are kept", readme_text)

    def test_rejects_invalid_major_date_patch_current_tag(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp = Path(tmpdir)
            tap_dir = tmp / "homebrew-tap"
            asset_path = tmp / "kmsg-macos-universal"
            asset_path.write_bytes(b"kmsg-binary")
            metadata_path = tmp / "release-metadata.json"
            metadata_path.write_text("{}", encoding="utf-8")

            result = subprocess.run(
                [
                    "python3",
                    str(SCRIPT_PATH),
                    "--tap-dir",
                    str(tap_dir),
                    "--asset-path",
                    str(asset_path),
                    "--repository",
                    "channprj/kmsg",
                    "--current-tag",
                    "v1.261399.0",
                    "--release-metadata-file",
                    str(metadata_path),
                ],
                cwd=REPO_ROOT,
                capture_output=True,
                text=True,
            )

            self.assertNotEqual(result.returncode, 0)
            self.assertIn("current tag must match vMAJOR.YYMMDD.PATCH_COUNT", result.stderr)


if __name__ == "__main__":
    unittest.main()

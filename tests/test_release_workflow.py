import re
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
WORKFLOW_PATH = REPO_ROOT / ".github" / "workflows" / "release.yml"


class ReleaseWorkflowTests(unittest.TestCase):
    def test_release_workflow_uses_major_date_patch_tags(self) -> None:
        workflow = WORKFLOW_PATH.read_text(encoding="utf-8")
        self.assertIn("v1.260424.0", workflow)
        self.assertIn("vMAJOR.YYMMDD.PATCH_COUNT", workflow)
        self.assertIn("PATCH_COUNT must be >= 0", workflow)
        self.assertIn("YYMMDD must resolve to a real calendar date", workflow)

    def test_tap_sync_secret_is_required(self) -> None:
        workflow = WORKFLOW_PATH.read_text(encoding="utf-8")
        match = re.search(
            r"- name: Check Homebrew tap sync configuration\n(?P<body>.*?)(?:\n\s*- name:|\Z)",
            workflow,
            re.DOTALL,
        )
        self.assertIsNotNone(match, "tap sync configuration step is missing")
        body = match.group("body")

        self.assertIn("exit 1", body)
        self.assertNotIn("enabled=false", body)
        self.assertNotIn("Skipping Homebrew formula sync", body)

    def test_release_workflow_writes_tap_sync_summary(self) -> None:
        workflow = WORKFLOW_PATH.read_text(encoding="utf-8")
        self.assertIn("GITHUB_STEP_SUMMARY", workflow)
        self.assertIn("Homebrew tap sync", workflow)


if __name__ == "__main__":
    unittest.main()

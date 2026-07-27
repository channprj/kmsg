import json
import re
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
SKILL_DIR = REPO_ROOT / "skills" / "kmsg"
SKILL_PATH = SKILL_DIR / "SKILL.md"
OPENAI_METADATA_PATH = SKILL_DIR / "agents" / "openai.yaml"
EVALS_PATH = SKILL_DIR / "evals" / "evals.json"


class AgentSkillContractTests(unittest.TestCase):
    def test_skill_package_has_cross_agent_metadata(self) -> None:
        skill = SKILL_PATH.read_text(encoding="utf-8")
        metadata = OPENAI_METADATA_PATH.read_text(encoding="utf-8")

        self.assertRegex(skill, r"(?m)^name: kmsg$")
        self.assertRegex(
            skill,
            r"(?m)^description: .*(?:KakaoTalk|카카오톡).*$",
        )
        self.assertRegex(skill, r"(?m)^compatibility: .*(?:macOS|kmsg).*$")
        self.assertIn('display_name: "KMSG"', metadata)
        self.assertIn('brand_color: "#FEE500"', metadata)
        self.assertIn("$kmsg", metadata)

    def test_skill_starts_with_preflight_and_structured_discovery(self) -> None:
        skill = SKILL_PATH.read_text(encoding="utf-8")

        self.assertIn("command -v kmsg", skill)
        self.assertIn("kmsg status", skill)
        self.assertIn("kmsg chats --json", skill)
        self.assertIn('kmsg read --chat-id "<chat_id>" --limit 20 --json', skill)
        self.assertIn("--background-safe", skill)

    def test_text_sending_requires_dry_run_and_explicit_authorization(self) -> None:
        skill = SKILL_PATH.read_text(encoding="utf-8")

        dry_run = 'kmsg send --chat-id "<chat_id>" "<message>" --dry-run'
        actual_send = 'kmsg send --chat-id "<chat_id>" "<message>"'
        self.assertIn(dry_run, skill)
        self.assertIn(actual_send, skill)
        self.assertLess(skill.index(dry_run), skill.rindex(actual_send))
        self.assertRegex(skill, r"(?i)explicit(?:ly)? (?:asked|authorized|requested)")
        self.assertRegex(skill, r"(?i)ambiguous")
        self.assertRegex(skill, r"(?i)(?:never|do not).*(?:duplicate|twice)")

    def test_image_and_watch_workflows_name_their_safety_boundaries(self) -> None:
        skill = SKILL_PATH.read_text(encoding="utf-8")

        self.assertIn('kmsg send-image "<recipient>" "/absolute/path/to/image.png"', skill)
        self.assertRegex(skill, r"(?i)send-image.*(?:no|does not have).*(?:dry-run|preview)")
        self.assertIn('kmsg watch "<chat>" --json', skill)
        self.assertRegex(skill, r"(?i)(?:stop|terminate).*(?:watch|process)")

    def test_eval_set_covers_read_text_send_and_image_intents(self) -> None:
        payload = json.loads(EVALS_PATH.read_text(encoding="utf-8"))

        self.assertEqual(payload["skill_name"], "kmsg")
        self.assertEqual(len(payload["evals"]), 3)
        prompts = "\n".join(item["prompt"] for item in payload["evals"])
        self.assertIn("최근 메시지", prompts)
        self.assertIn("보내줘", prompts)
        self.assertIn("이미지", prompts)
        for item in payload["evals"]:
            self.assertTrue(item["expected_output"])
            self.assertEqual(item["files"], [])
            self.assertGreaterEqual(len(item["expectations"]), 2)


if __name__ == "__main__":
    unittest.main()

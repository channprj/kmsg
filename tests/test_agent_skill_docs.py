import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
README_KO = REPO_ROOT / "README.md"
README_EN = REPO_ROOT / "README.en.md"
INSTALL_COMMAND = (
    "npx skills add channprj/kmsg --skill kmsg "
    "--agent claude-code codex -g -y"
)


class AgentSkillDocumentationTests(unittest.TestCase):
    def test_both_readmes_document_one_cross_agent_install_command(self) -> None:
        for path in (README_KO, README_EN):
            with self.subTest(path=path.name):
                readme = path.read_text(encoding="utf-8")
                self.assertIn(INSTALL_COMMAND, readme)
                self.assertIn("Claude Code", readme)
                self.assertIn("`/kmsg`", readme)
                self.assertIn("Codex", readme)
                self.assertIn("`$kmsg`", readme)

    def test_korean_readme_shows_read_and_send_workflows(self) -> None:
        readme = README_KO.read_text(encoding="utf-8")

        self.assertIn("## 코딩 에이전트 스킬", readme)
        self.assertIn("/kmsg 출시 준비 채팅방의 최근 메시지 10개를 요약해줘", readme)
        self.assertIn("$kmsg 출시 준비 채팅방에 '배포 완료했습니다.'라고 보내줘", readme)
        self.assertIn("dry-run", readme)
        self.assertIn("명시적으로 전송을 요청", readme)

    def test_english_readme_shows_read_and_send_workflows(self) -> None:
        readme = README_EN.read_text(encoding="utf-8")

        self.assertIn("## Coding agent skill", readme)
        self.assertIn("/kmsg Summarize the 10 latest messages in Release Prep", readme)
        self.assertIn("$kmsg Send 'Deployment complete.' to Release Prep", readme)
        self.assertIn("dry-run", readme)
        self.assertIn("explicitly asks to send", readme)


if __name__ == "__main__":
    unittest.main()

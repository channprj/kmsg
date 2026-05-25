import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
MCP_SERVER_COMMAND = REPO_ROOT / "Sources" / "kmsg" / "Commands" / "MCPServerCommand.swift"


class MCPServerContractTests(unittest.TestCase):
    def test_startup_status_check_allows_slow_ax_ready_state(self) -> None:
        source = MCP_SERVER_COMMAND.read_text(encoding="utf-8")
        self.assertIn('run(["status"], timeoutSec: 15.0)', source)

    def test_subprocess_readers_start_after_successful_launch(self) -> None:
        source = MCP_SERVER_COMMAND.read_text(encoding="utf-8")
        run_index = source.index("try process.run()")
        stdout_reader_index = source.index("let stdoutData = MCPDataBuffer()")
        self.assertLess(run_index, stdout_reader_index)

    def test_mcp_server_accepts_content_length_and_ndjson(self) -> None:
        source = MCP_SERVER_COMMAND.read_text(encoding="utf-8")
        self.assertIn("enum MCPStdioTransport", source)
        self.assertIn("case contentLength", source)
        self.assertIn("case newlineDelimitedJSON", source)
        self.assertIn('trimmed.hasPrefix("{")', source)
        self.assertIn("writeContentLengthMessage", source)
        self.assertIn("writeNewlineDelimitedJSONMessage", source)

    def test_focus_fail_has_actionable_mcp_error_code(self) -> None:
        source = MCP_SERVER_COMMAND.read_text(encoding="utf-8")
        self.assertIn('combinedText.contains("FOCUS_FAIL")', source)
        self.assertIn('"KAKAO_SEARCH_FOCUS_FAILED"', source)
        self.assertIn("search input could not be focused", source)


if __name__ == "__main__":
    unittest.main()

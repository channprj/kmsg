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

    def test_ui_commands_use_monotonic_idle_and_hard_timeouts(self) -> None:
        source = MCP_SERVER_COMMAND.read_text(encoding="utf-8")
        self.assertIn("static let uiIdleTimeoutSec: TimeInterval = 12.0", source)
        self.assertIn("static let uiHardTimeoutSec: TimeInterval = 30.0", source)
        self.assertIn("idleTimeoutSec: TimeInterval? = nil", source)
        self.assertIn("ProcessInfo.processInfo.systemUptime", source)
        self.assertIn('run(["--version"], timeoutSec: 2.0)', source)
        self.assertIn('run(["status"], timeoutSec: 15.0)', source)

    def test_internal_trace_stderr_is_stripped_unless_requested(self) -> None:
        source = MCP_SERVER_COMMAND.read_text(encoding="utf-8")
        self.assertIn("private func stripTraceLines(_ stderr: String) -> String", source)
        self.assertIn('!$0.hasPrefix("[trace-ax]")', source)
        self.assertIn("private func responseStderr(_ stderr: String, traceAX: Bool) -> String", source)
        self.assertIn("stripTraceLines(first.stderr)", source)
        self.assertIn("stripTraceLines(retry.stderr)", source)
        self.assertIn("stripTraceLines(run.stderr)", source)
        self.assertIn("responseStderr(first.stderr, traceAX: traceAX)", source)
        self.assertIn("responseStderr(retry.stderr, traceAX: traceAX)", source)
        self.assertIn("responseStderr(run.stderr, traceAX: traceAX)", source)

    def test_read_deep_recovery_retry_reports_process_timeout(self) -> None:
        source = MCP_SERVER_COMMAND.read_text(encoding="utf-8")
        self.assertIn("} else if retry.timedOut {", source)
        self.assertIn('"kmsg read timed out after deep-recovery retry"', source)


if __name__ == "__main__":
    unittest.main()

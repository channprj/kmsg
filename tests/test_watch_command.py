import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
KMSG_ENTRYPOINT = REPO_ROOT / "Sources" / "kmsg" / "kmsg.swift"
WATCH_COMMAND = REPO_ROOT / "Sources" / "kmsg" / "Commands" / "WatchCommand.swift"
TRANSCRIPT_READER = REPO_ROOT / "Sources" / "kmsg" / "KakaoTalk" / "TranscriptReader.swift"
MESSAGE_CONTEXT_RESOLVER = REPO_ROOT / "Sources" / "kmsg" / "KakaoTalk" / "MessageContextResolver.swift"
AX_PATH_CACHE = REPO_ROOT / "Sources" / "kmsg" / "Accessibility" / "AXPathCache.swift"


class WatchCommandContractTests(unittest.TestCase):
    def test_watch_command_is_registered(self) -> None:
        source = KMSG_ENTRYPOINT.read_text(encoding="utf-8")
        self.assertIn("WatchCommand.self", source)

    def test_watch_command_defines_expected_flags(self) -> None:
        source = WATCH_COMMAND.read_text(encoding="utf-8")
        self.assertIn('commandName: "watch"', source)
        self.assertIn("var json: Bool = false", source)
        self.assertIn("var pollInterval: Double = 0.2", source)
        self.assertIn("var includeSystem: Bool = false", source)

    def test_watch_command_uses_stabilized_startup_baseline(self) -> None:
        source = WATCH_COMMAND.read_text(encoding="utf-8")
        self.assertIn("stabilizeBaseline(", source)

    def test_watch_command_re_stabilizes_after_recovery(self) -> None:
        source = WATCH_COMMAND.read_text(encoding="utf-8")
        self.assertIn("replaceBaseline", source)

    def test_watch_command_tracks_watch_started_at_cutoff(self) -> None:
        source = WATCH_COMMAND.read_text(encoding="utf-8")
        self.assertIn("watchStartedAt", source)
        self.assertIn("filterMessagesAfterWatchStart", source)

    def test_transcript_reader_exposes_logical_timestamp_support(self) -> None:
        source = TRANSCRIPT_READER.read_text(encoding="utf-8")
        self.assertIn("logicalTimestamp", source)
        self.assertIn("parseSystemDate", source)

    def test_watch_command_uses_ordered_overlap_dedupe(self) -> None:
        source = WATCH_COMMAND.read_text(encoding="utf-8")
        self.assertIn("findOverlapCount", source)
        self.assertIn("messagesEquivalent", source)

    def test_message_context_resolver_caches_transcript_root(self) -> None:
        source = MESSAGE_CONTEXT_RESOLVER.read_text(encoding="utf-8")
        self.assertIn("resolveCachedElement", source)
        self.assertIn(".transcriptRoot", source)

    def test_ax_path_cache_has_transcript_root_slot(self) -> None:
        source = AX_PATH_CACHE.read_text(encoding="utf-8")
        self.assertIn("case transcriptRoot", source)

    def test_watch_command_reuses_cached_transcript_context(self) -> None:
        source = WATCH_COMMAND.read_text(encoding="utf-8")
        self.assertIn("cachedContext", source)
        self.assertTrue(
            "readSnapshot(from: cachedContext" in source
            or "readSnapshot(from: cachedTranscriptContext" in source
        )


if __name__ == "__main__":
    unittest.main()

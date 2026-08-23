# About kmsg

kmsg is an unofficial open-source KakaoTalk CLI and native MCP server for macOS. It reads, watches, and sends text or images by using the public macOS Accessibility API against the visible KakaoTalk desktop application. It does not implement or bypass KakaoTalk's private LOCO protocol.

## Who it is for

The project is for developers automating work on a Mac they control, local tools that need structured KakaoTalk results, and AI agents that operate under a user's approval. kmsg is not a hosted messaging SaaS or a bulk-send service. Its commands run locally, require KakaoTalk for macOS, and expose observable command, JSON, and MCP contracts.

## Maintainer and provenance

CHANN maintainer Park Hee Chan develops kmsg in the public `channprj/kmsg` GitHub repository. Source, issues, releases, MIT License terms, and CI history are reviewable. The canonical website is `https://channprj.github.io/kmsg/`; installation and release claims link back to the same repository.

## Trust and technical boundaries

KakaoTalk account data and messages are processed on the user's Mac and are not uploaded to this static website. Commands that change external state should be previewed with `--dry-run`, and callers must verify the target and payload. Accessibility permission, desktop login state, background-safe reads, bounded UI search, encrypted local credentials, and explicit MCP tool schemas define what the tool can do.

## Independence

kmsg is independent and is not affiliated with or endorsed by Kakao Corp. Desktop UI changes can affect automation, so users remain responsible for permissions, message results, and applicable policies. The project makes its limitations visible rather than claiming unverified organizational scale or service guarantees.

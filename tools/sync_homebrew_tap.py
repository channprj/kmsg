#!/usr/bin/env python3

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import re
import sys
from pathlib import Path


MAJOR_DATE_PATCH_TAG_RE = re.compile(r"^v(\d+)\.(\d{2})(\d{2})(\d{2})\.(\d+)$")
LEGACY_SEMVER_TAG_RE = re.compile(r"^v(\d+)\.(\d+)\.(\d+)$")
README_START = "<!-- kmsg-versioned:start -->"
README_END = "<!-- kmsg-versioned:end -->"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Sync kmsg Homebrew tap formulas.")
    parser.add_argument("--tap-dir", required=True, type=Path)
    parser.add_argument("--asset-path", required=True, type=Path)
    parser.add_argument("--repository", required=True)
    parser.add_argument("--current-tag", required=True)
    parser.add_argument("--release-metadata-file", required=True, type=Path)
    parser.add_argument("--keep-versions", type=int, default=10)
    return parser.parse_args()


def parse_release_tag(tag: str) -> tuple[int, ...] | None:
    major_date_patch_match = MAJOR_DATE_PATCH_TAG_RE.match(tag)
    if major_date_patch_match is not None:
        major, year_suffix, month, day, patch_count = (int(part) for part in major_date_patch_match.groups())
        try:
            dt.date(2000 + year_suffix, month, day)
        except ValueError:
            return None
        if major < 1 or patch_count < 0:
            return None
        return (2, major, 2000 + year_suffix, month, day, patch_count)

    legacy_match = LEGACY_SEMVER_TAG_RE.match(tag)
    if legacy_match is None:
        return None
    major, minor, patch = (int(part) for part in legacy_match.groups())
    return (1, major, minor, patch, 0)


def compute_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load_release_metadata(path: Path) -> dict[str, dict[str, str]]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise ValueError("release metadata must be a JSON object keyed by tag")

    metadata: dict[str, dict[str, str]] = {}
    for tag, item in payload.items():
        if parse_release_tag(tag) is None:
            continue
        if not isinstance(item, dict):
            raise ValueError(f"release metadata for {tag} must be an object")
        url = item.get("url")
        sha256 = item.get("sha256")
        version = item.get("version")
        if not all(isinstance(value, str) and value for value in (url, sha256, version)):
            raise ValueError(f"release metadata for {tag} must contain non-empty url, sha256, version")
        metadata[tag] = {
            "url": url,
            "sha256": sha256,
            "version": version,
        }
    return metadata


def formula_class_name(version: str) -> str:
    return f"KmsgAT{version.replace('.', '')}"


def render_formula(class_name: str, url: str, sha256: str, version: str) -> str:
    return (
        f"class {class_name} < Formula\n"
        '  desc "CLI tool for KakaoTalk on macOS"\n'
        '  homepage "https://github.com/channprj/kmsg"\n'
        f'  url "{url}"\n'
        f'  sha256 "{sha256}"\n'
        f'  version "{version}"\n'
        '  license "MIT"\n'
        "\n"
        "  def install\n"
        '    bin.install "kmsg-macos-universal" => "kmsg"\n'
        "  end\n"
        "\n"
        "  test do\n"
        '    output = shell_output("#{bin}/kmsg --version")\n'
        f'    assert_match "{version}", output\n'
        "  end\n"
        "end\n"
    )


def ensure_current_release_metadata(
    metadata: dict[str, dict[str, str]],
    repository: str,
    current_tag: str,
    asset_path: Path,
) -> dict[str, dict[str, str]]:
    current_version = current_tag.removeprefix("v")
    current_sha = compute_sha256(asset_path)
    current_url = f"https://github.com/{repository}/releases/download/{current_tag}/{asset_path.name}"
    current_entry = {
        "url": current_url,
        "sha256": current_sha,
        "version": current_version,
    }

    existing_entry = metadata.get(current_tag)
    if existing_entry is not None and existing_entry["sha256"] != current_sha:
        raise ValueError(
            f"current release sha mismatch for {current_tag}: metadata={existing_entry['sha256']} asset={current_sha}"
        )

    result = dict(metadata)
    result[current_tag] = current_entry
    return result


def sorted_recent_tags(metadata: dict[str, dict[str, str]], keep_versions: int) -> list[str]:
    release_tags = [tag for tag in metadata if parse_release_tag(tag) is not None]
    release_tags.sort(key=lambda tag: parse_release_tag(tag), reverse=True)
    return release_tags[:keep_versions]


def write_formula_files(tap_dir: Path, metadata: dict[str, dict[str, str]], recent_tags: list[str]) -> list[str]:
    formula_dir = tap_dir / "Formula"
    formula_dir.mkdir(parents=True, exist_ok=True)

    latest_tag = recent_tags[0]
    latest_entry = metadata[latest_tag]
    (formula_dir / "kmsg.rb").write_text(
        render_formula(
            class_name="Kmsg",
            url=latest_entry["url"],
            sha256=latest_entry["sha256"],
            version=latest_entry["version"],
        ),
        encoding="utf-8",
    )

    expected_paths = {"kmsg.rb"}
    kept_versions: list[str] = []
    for tag in recent_tags:
        entry = metadata[tag]
        version = entry["version"]
        kept_versions.append(version)
        file_name = f"kmsg@{version}.rb"
        expected_paths.add(file_name)
        (formula_dir / file_name).write_text(
            render_formula(
                class_name=formula_class_name(version),
                url=entry["url"],
                sha256=entry["sha256"],
                version=version,
            ),
            encoding="utf-8",
        )

    for path in formula_dir.glob("kmsg@*.rb"):
        if path.name not in expected_paths:
            path.unlink()

    return kept_versions


def render_readme_block(versions: list[str]) -> str:
    latest_version = versions[0]
    version_lines = "\n".join(f"- `kmsg@{version}`" for version in versions)
    return (
        "## kmsg Versioned Installs\n\n"
        f"{README_START}\n"
        "Install the latest release or pin an exact kmsg release from this tap.\n\n"
        "```bash\n"
        "brew install channprj/tap/kmsg\n"
        f"brew install channprj/tap/kmsg@{latest_version}\n"
        "```\n\n"
        "Recent 10 releases are kept in this tap:\n\n"
        f"{version_lines}\n"
        f"{README_END}\n"
    )


def update_readme(tap_dir: Path, versions: list[str]) -> None:
    readme_path = tap_dir / "README.md"
    existing = readme_path.read_text(encoding="utf-8") if readme_path.exists() else "# homebrew-tap\n"
    block = render_readme_block(versions)

    if README_START in existing and README_END in existing:
        start = existing.index(README_START)
        end = existing.index(README_END) + len(README_END)
        section_start = existing.rfind("## ", 0, start)
        if section_start == -1:
            section_start = start
        prefix = existing[:section_start].rstrip()
        suffix = existing[end:].lstrip()
        parts = [prefix, block.rstrip()]
        if suffix:
            parts.append(suffix)
        readme_path.write_text("\n\n".join(part for part in parts if part) + "\n", encoding="utf-8")
        return

    trimmed = existing.rstrip()
    if trimmed:
        trimmed += "\n\n"
    readme_path.write_text(trimmed + block, encoding="utf-8")


def main() -> int:
    args = parse_args()

    if parse_release_tag(args.current_tag) is None:
        raise ValueError(f"current tag must match vMAJOR.YYMMDD.PATCH_COUNT: {args.current_tag}")
    if args.keep_versions < 1:
        raise ValueError("keep-versions must be at least 1")

    metadata = load_release_metadata(args.release_metadata_file)
    metadata = ensure_current_release_metadata(
        metadata=metadata,
        repository=args.repository,
        current_tag=args.current_tag,
        asset_path=args.asset_path,
    )
    recent_tags = sorted_recent_tags(metadata, args.keep_versions)
    kept_versions = write_formula_files(args.tap_dir, metadata, recent_tags)
    update_readme(args.tap_dir, kept_versions)

    print(f"synced {len(kept_versions)} kmsg versioned formulas")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:  # pragma: no cover - command line error path
        print(f"error: {exc}", file=sys.stderr)
        raise SystemExit(1)

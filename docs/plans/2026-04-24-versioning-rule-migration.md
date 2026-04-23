# Versioning Rule Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Switch kmsg releases to `MAJOR.YYMMDD.PATCH_COUNT`, reset `PATCH_COUNT` to `0` each day, and replace the lone old calendar tag with the new-format tag.

**Architecture:** Treat `VERSION` as the source of truth, update every validator/parser that reads release tags, and keep legacy semver tag handling only for historical release metadata. Add regression coverage around the workflow, Homebrew sync script, and generated build version so the new format is enforced end-to-end.

**Tech Stack:** SwiftPM, Swift 6, GitHub Actions, Python `unittest`

---

### Task 1: Lock expected release behavior with failing tests

**Files:**
- Create: `tests/test_version_gen_tool.py`
- Modify: `tests/test_release_workflow.py`
- Modify: `tests/test_sync_homebrew_tap.py`

**Step 1: Write the failing tests**

- Update workflow assertions to require `vMAJOR.YYMMDD.PATCH_COUNT`.
- Update Homebrew sync tests to use new-format release tags.
- Add a `VersionGenTool` integration test that accepts `1.260424.0` and rejects `2026.0422.22`.

**Step 2: Run test to verify it fails**

Run: `python3 -m unittest tests.test_release_workflow tests.test_sync_homebrew_tap tests.test_version_gen_tool -v`
Expected: failures showing the repository still expects `YYYY.MMDD.COUNT`.

### Task 2: Implement the new version parsing rules

**Files:**
- Modify: `Sources/VersionGenTool/main.swift`
- Modify: `.github/workflows/release.yml`
- Modify: `tools/sync_homebrew_tap.py`
- Modify: `VERSION`

**Step 1: Update validators and examples**

- Accept `MAJOR.YYMMDD.PATCH_COUNT`.
- Require `MAJOR >= 1`.
- Require `PATCH_COUNT >= 0`.
- Validate `YYMMDD` as a real date by mapping `YY` to `20YY`.

**Step 2: Set the new release version**

- Change `VERSION` to `1.260424.0`.

**Step 3: Run the focused tests**

Run: `python3 -m unittest tests.test_release_workflow tests.test_sync_homebrew_tap tests.test_version_gen_tool -v`
Expected: all selected tests pass.

### Task 3: Rewrite human-facing versioning documentation

**Files:**
- Modify: `VERSIONING.md`

**Step 1: Update the spec**

- Replace all examples and invalid examples with the new format.
- Document the daily reset behavior for `PATCH_COUNT`.
- Clarify that `YY` is the two-digit year suffix and `v{VERSION}` remains the tag format.

### Task 4: Verify build output and release version wiring

**Files:**
- Verify only

**Step 1: Build the project**

Run: `swift build`
Expected: success.

**Step 2: Verify CLI version output**

Run: `.build/debug/kmsg --version`
Expected: `1.260424.0`

### Task 5: Replace the old calendar tag with the new tag

**Files:**
- Verify only

**Step 1: Commit the migration**

Run:

```bash
git add VERSION VERSIONING.md Sources/VersionGenTool/main.swift .github/workflows/release.yml tools/sync_homebrew_tap.py tests/test_release_workflow.py tests/test_sync_homebrew_tap.py tests/test_version_gen_tool.py docs/plans/2026-04-24-versioning-rule-migration.md
git commit -m "feat(versioning): switch to major-date-patch release tags"
```

**Step 2: Replace the tag**

Run:

```bash
git tag -d v2026.0422.22
git push origin :refs/tags/v2026.0422.22
git tag -a v1.260424.0 -m v1.260424.0
git push origin main v1.260424.0
```

**Step 3: Verify the final state**

Run:

```bash
git ls-remote --tags origin "refs/tags/v1.260424.0*"
git status --short --branch
```

Expected: the new tag exists remotely and the branch is synchronized.

# VERSIONING

`kmsg` uses a major-plus-date release version.

## Source of truth

- The canonical version lives in the repo-root `VERSION` file.
- `VERSION` stores the version **without** the leading `v`.
- Git release tags use `v{VERSION}`.

Example:

```text
VERSION      -> 1.260424.0
Git tag      -> v1.260424.0
CLI version  -> 1.260424.0
```

## Format

Version format:

```text
MAJOR.YYMMDD.PATCH_COUNT
```

Tag format:

```text
vMAJOR.YYMMDD.PATCH_COUNT
```

Field rules:

- `MAJOR`: major release line, incremented manually when you want to signal a breaking or milestone release
- `YYMMDD`: 2-digit year suffix + 2-digit month + 2-digit day
- `PATCH_COUNT`: zero-based daily release counter; starts at `0` for the first release of a given `YYMMDD` and increments by `1` for each additional release that day

Examples:

- `1.260424.0`
- `1.260424.9`
- `2.261231.0`

Invalid examples:

- `1.26042.0`
- `1.261399.0`
- `0.260424.0`
- `v1.260424.0` in `VERSION` file

## Operational rules

- Update `VERSION` before creating a release tag.
- Keep `PATCH_COUNT` at `0` for the first release on a new `YYMMDD`.
- For additional releases on the same day, increment `PATCH_COUNT` by `1`.
- Reset `PATCH_COUNT` back to `0` when `YYMMDD` changes.
- Manual release tags and workflow inputs must match `vMAJOR.YYMMDD.PATCH_COUNT`.
- `YY` is interpreted as the year suffix in the 2000s for validation, so `260424` means `2026-04-24`.

## Compatibility notes

- Build-time version generation validates the `MAJOR.YYMMDD.PATCH_COUNT` format directly from `VERSION`.
- Release automation resolves the Git tag from `VERSION` as `v{VERSION}`.
- Homebrew tap sync supports the current format and still reads legacy semver tags during migration, so older exact-version formulas are not dropped immediately after the format switch.

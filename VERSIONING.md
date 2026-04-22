# VERSIONING

`kmsg` uses a calendar-based release version.

## Source of truth

- The canonical version lives in the repo-root `VERSION` file.
- `VERSION` stores the version **without** the leading `v`.
- Git release tags use `v{VERSION}`.

Example:

```text
VERSION      -> 2026.0422.22
Git tag      -> v2026.0422.22
CLI version  -> 2026.0422.22
```

## Format

Version format:

```text
YYYY.MMDD.COUNT
```

Tag format:

```text
vYYYY.MMDD.COUNT
```

Field rules:

- `YYYY`: 4-digit calendar year
- `MMDD`: 2-digit month + 2-digit day
- `COUNT`: cumulative release counter across all published versions, increasing by `1` for every release regardless of date

Examples:

- `2026.0422.1`
- `2026.0422.22`
- `2026.1231.7`

Invalid examples:

- `2026.422.1`
- `26.0422.1`
- `2026.1399.1`
- `v2026.0422.22` in `VERSION` file

## Operational rules

- Update `VERSION` before creating a release tag.
- Do not reset `COUNT` on a new day.
- For every new release, increment `COUNT` by `1`.
- During migration from legacy semver tags, continue counting from the total number of previously published version tags.
- Manual release tags and workflow inputs must match `vYYYY.MMDD.COUNT`.

## Compatibility notes

- Build-time version generation validates the calendar format directly from `VERSION`.
- Release automation resolves the Git tag from `VERSION` as `v{VERSION}`.
- Homebrew tap sync supports the current calendar format and also reads legacy semver tags during migration, so older exact-version formulas are not dropped immediately after the format switch.

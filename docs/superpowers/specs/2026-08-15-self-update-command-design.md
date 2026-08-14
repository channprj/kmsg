# `kmsg update` Self-Update Design

**Date:** 2026-08-15
**Status:** Approved for implementation planning

## Goal

Add a first-class `kmsg update` command that moves every supported installation
onto the Homebrew-managed release and updates it. The command must also work
when Homebrew is not installed and when the running `kmsg` is a directly
downloaded or copied binary. Document the workflow in CLI help and on the
project website.

## User-facing contract

Running:

```bash
kmsg update
```

performs these steps in order:

1. Locate Homebrew in `PATH` or at a supported default macOS prefix.
2. If Homebrew is missing, download and run Homebrew's official interactive
   installer, then locate the newly installed `brew` executable without
   requiring the user to restart the shell.
3. Refresh Homebrew metadata only when needed.
4. Install `channprj/tap/kmsg` when it is absent, or upgrade it when it is
   already managed by Homebrew.
5. Ask Homebrew to overwrite conflicts in its own prefix while linking `kmsg`.
6. Verify the resulting Homebrew binary by executing `kmsg --version` through
   its absolute path.
7. If the running executable is a different directly installed binary, replace
   that exact executable path with a symbolic link to the verified Homebrew
   binary. This keeps the same command lookup valid even in the current shell.
8. Print the installed version and the path now used by the command.

`kmsg update --help` describes this behavior. The root `kmsg --help` output
lists `update` among the available subcommands and includes it in the examples.

## Architecture

### `UpdateCommand`

`UpdateCommand` is an `AsyncParsableCommand` registered in the root command
configuration. It owns presentation only: concise progress messages, the final
success summary, and conversion of updater errors into actionable validation
messages.

The update path does not initialize `KakaoTalkApp` and does not require
Accessibility permission.

### `HomebrewLocator`

The locator checks the current `PATH` first, then the supported macOS default
locations:

- `/opt/homebrew/bin/brew` for Apple Silicon
- `/usr/local/bin/brew` for Intel macOS

It returns an absolute executable path. Every subsequent Homebrew invocation
uses that absolute path, so a fresh Homebrew installation works before the
parent shell's environment is reloaded.

### `HomebrewInstaller`

When the locator finds no executable, the installer downloads
`https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh` to a
uniquely named temporary file with `/usr/bin/curl --fail --silent --show-error
--location`. It executes the downloaded file with `/bin/bash`, inheriting the
terminal's standard input, output, and error streams so Homebrew can explain its
changes and request confirmation or administrator credentials.

The temporary file is deleted on both success and failure. The updater does not
use an interpolated shell pipeline. After installation, it runs the locator
again and fails with post-install PATH guidance if `brew` still cannot be
found.

### `HomebrewUpdater`

The updater executes:

```text
brew update-if-needed
brew list --formula --versions kmsg
```

It then chooses exactly one package operation:

```text
brew install --formula --overwrite --no-ask channprj/tap/kmsg
brew upgrade --formula --overwrite --no-ask channprj/tap/kmsg
```

The first command is used when `kmsg` is not installed as a formula; the second
is used when it is. An already-current formula is a successful no-op. Explicit
`--formula` avoids cask ambiguity, and `--overwrite` lets Homebrew replace a
manually copied `kmsg` that conflicts inside the Homebrew prefix.

After the package operation, the updater resolves the stable binary through
`brew --prefix kmsg`, appends `bin/kmsg`, confirms that the file is executable,
and runs its absolute path with `--version`.

### Direct-binary migration

The migrator resolves the executable used to start the current process. If it
already resolves to the verified Homebrew binary, no filesystem change is
needed.

Otherwise, it creates a symbolic link in the same directory and atomically
renames that link over the directly installed executable. This preserves the
path already cached by the calling shell. SwiftPM build products below a
`.build` directory are never replaced; a developer invoking
`.build/debug/kmsg update` still receives the Homebrew installation, but the
build artifact remains intact.

If the destination directory is not writable, the migrator asks `sudo` to
perform the replacement. The privileged path uses a sibling backup, creates
the link, verifies it, and restores the backup if linking fails. A successful
migration removes the backup. The updater never removes or replaces the old
binary before the Homebrew binary has passed verification.

## Process execution and output

All subprocesses use `Foundation.Process` with argument arrays instead of a
shell command string. Standard input, output, and error are inherited for
operations that can prompt or take time. Small discovery commands capture
their output for parsing.

Progress and errors go to standard error so scripts do not mistake intermediate
Homebrew output for a structured result. The final human-readable success line
goes to standard output. The command has no JSON mode because it performs an
interactive system mutation rather than returning KakaoTalk data.

## Failure behavior

Each stage fails closed and names both the failed operation and the next useful
action:

- Homebrew download or install failure leaves the current `kmsg` untouched.
- Formula install or upgrade failure leaves the current `kmsg` untouched and
  reports the Homebrew command that failed.
- A missing or non-executable Homebrew result is treated as an installation
  failure.
- Direct-binary migration failure preserves or restores the original binary
  and reports the verified Homebrew binary path for manual recovery.
- Cancellation of Homebrew or `sudo` is reported as cancellation, not success.

The command never edits shell startup files. Repointing the already resolved
executable path avoids taking ownership of unrelated shell configuration.

## Testing

The updater's process runner, filesystem operations, executable path, and
Homebrew locations are injectable. Unit tests use fakes and temporary
directories to cover:

- Homebrew already present versus installed during the run
- formula absent, outdated, and already current
- exact Homebrew arguments, including `--formula` and `--overwrite`
- successful direct-binary replacement and `.build` exclusion
- rollback when link creation or verification fails
- non-zero exit propagation at each external command boundary
- root and subcommand help text

Repository verification includes `swift test`, `swift build`, direct help
smokes against `.build/debug/kmsg`, the existing Python contract suite, and the
website's build, typecheck, and test suite.

No test runs the real Homebrew installer or mutates the developer's installed
`kmsg`.

## Website and documentation

The homepage installation section gains a compact update example:

```bash
kmsg update
```

Its localized explanation states that the command installs Homebrew when
needed, installs or upgrades the formula, and migrates a directly installed
binary to the Homebrew-managed command. The Korean, English, Japanese, and
Simplified Chinese homepage copy remains equivalent. Relevant usage and README
installation sections receive the same short command reference so the website
source documents and repository landing pages do not disagree.

Tests assert that the localized homepage exposes both the installation and
self-update commands.

## Scope boundaries

- No release tag or version bump is part of this change.
- No background or automatic update check is added.
- No alternate package manager is supported.
- No shell startup file is edited.
- No KakaoTalk state, credential, or Accessibility setting is read or changed.

## Delivery checkpoints

1. Commit and push this approved design.
2. Implement and test the CLI updater as one working feature checkpoint.
3. Add and test homepage and repository documentation as a separate
   documentation checkpoint.
4. Run the full completion audit, push any corrective checkpoint, and open the
   pull request.

## References

- [Homebrew installation](https://docs.brew.sh/Installation)
- [Homebrew command manual](https://docs.brew.sh/Manpage)

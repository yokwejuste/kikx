# Releasing

The `kikx` CLI is released from a git tag. Pushing a tag that matches `v*.*.*` runs `.github/workflows/release.yml`.

## What the workflow does

1. Checks that the tag, without its `v`, matches the `version` in `cli/Cargo.toml`. A mismatch stops the release.
2. Runs `cargo test` in `backend/core` and `cli`.
3. Builds the CLI in release mode for every platform and publishes the archives on a GitHub Release.

| Platform | Target | Asset |
|-|-|-|
| macOS, Apple silicon | `aarch64-apple-darwin` | `kikx-<version>-macos-arm64.tar.gz` |
| macOS, Intel | `x86_64-apple-darwin` | `kikx-<version>-macos-x64.tar.gz` |
| Linux, x64 | `x86_64-unknown-linux-gnu` | `kikx-<version>-linux-x64.tar.gz` |
| Linux, arm64 | `aarch64-unknown-linux-gnu` | `kikx-<version>-linux-arm64.tar.gz` |
| Windows, x64 | `x86_64-pc-windows-msvc` | `kikx-<version>-windows-x64.zip` |

Each archive holds the `kikx` binary (`kikx.exe` on Windows) and `README.md`.

## Cut a release

Set the new version in `cli/Cargo.toml`, then commit, tag and push:

```bash
git commit -am "chore: release v0.2.0"
git tag v0.2.0
git push && git push --tags
```

## See also

- [Development](development.md)

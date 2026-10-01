# Development

kikx is three Cargo packages and a Next.js app. Each one builds and tests on its own.

## Before you start

You need:

- a checkout of the kikx repository;
- a Rust toolchain (`cargo`, `clippy`, `rustfmt`);
- Node.js with `npm`;
- Python 3, to build the documentation.

## Check the Rust packages

Run the tests, clippy and rustfmt in each package:

```bash
cd cli && cargo test && RUSTFLAGS="-D warnings" cargo clippy --all-targets && cargo fmt --check
```

```bash
cd backend && cargo test && RUSTFLAGS="-D warnings" cargo clippy --all-targets && cargo fmt --check
```

```bash
cd backend/core && cargo test && RUSTFLAGS="-D warnings" cargo clippy --all-targets && cargo fmt --check
```

Tests live in each package's `tests/` directory, never in the source files.

Each package's `Cargo.toml` turns on the unused-code lints, so clippy with `-D warnings` fails on
unused imports, variables and functions. [cargo-machete](https://github.com/bnjbvr/cargo-machete)
reports dependencies a package no longer uses; run `cargo machete` from the repository root. The
`Rust` workflow runs all of these checks on every pull request that touches `backend/` or `cli/`.

## Check the dashboard

```bash
cd web
npm install
npx tsc --noEmit
npm run lint
npm run build
```

## Build the documentation

The documentation is built with Sphinx from `docs/`. Install the pinned dependencies once:

```bash
pip install -r docs/requirements.txt
```

Then build the English and French sites. Both treat warnings as errors:

```bash
make -C docs html
make -C docs html-fr
```

After changing an English page, refresh the French catalogues in `docs/locales/fr/` and translate the new entries:

```bash
make -C docs update-po
```

To rebuild on every save while you write:

```bash
make -C docs serve
```

## See also

- [Run kikx locally](run-locally.md)
- [Releasing](releasing.md)
- [How the pieces fit together](../explanation/project-layout.md)

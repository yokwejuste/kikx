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

## Update the screenshots

The screenshots of the web app in `docs/source/images/web/` are made by one script,
`docs/screenshots/capture.mjs`. It drives the real app in a headless browser, builds the example
projects through the forms, and saves every picture four times: light and dark theme, English and
French. Pages show the one that matches the reader's theme, and the French site uses the French
files.

| File | Theme | Language |
|-|-|-|
| `<name>.webp` | light | English |
| `<name>-dark.webp` | dark | English |
| `<name>.fr.webp` | light | French |
| `<name>-dark.fr.webp` | dark | French |

You need Node.js and `cwebp` (`brew install webp` on macOS, `apt install webp` on Debian and
Ubuntu).

1. Start the backend and the dashboard, as in [Run kikx locally](run-locally.md).
2. Install the script's dependencies and its browser once:

   ```bash
   cd docs/screenshots
   npm ci
   npx playwright install chromium
   ```

3. Run it against the dashboard:

   ```bash
   npm run capture -- --base http://localhost:3000
   ```

It replaces the files in `docs/source/images/web/`. To redo some of them only, pass their names
with `--only`, for example `--only home,export-menu`. `--themes light` and `--locales en` limit the
variants. Each shot is listed in `docs/screenshots/shots.mjs`, and the example projects it starts
from in `docs/screenshots/scenes.mjs`.

To add a screenshot to a page, add a shot, run the script, and put a light and a dark image on the
page:

````markdown
```{image} ../images/web/<name>.webp
:alt: What the picture shows
:class: only-light
```

```{image} ../images/web/<name>-dark.webp
:alt: What the picture shows
:class: only-dark
```
````

Write the same alt text on both, and translate it in the page's French catalogue.

## See also

- [Run kikx locally](run-locally.md)
- [Releasing](releasing.md)
- [How the pieces fit together](../explanation/project-layout.md)

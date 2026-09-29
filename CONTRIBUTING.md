# Contributing to kikx

People use kikx through the hosted dashboard and the downloadable CLI. This guide is for working on
kikx itself: running the backend and the dashboard locally, their configuration, the checks to run
before a pull request, the documentation build and the release process.

## Run kikx locally

The dashboard (`web/`) renders everything through the backend (`backend/`), so you need both.

```bash
cp backend/.env.example backend/.env
cp web/.env.example web/.env.local
```

In one terminal, from `backend/` so it picks up its `.env`:

```bash
cd backend
cargo run
```

In a second terminal:

```bash
cd web
npm install
npm run dev
```

Open `http://localhost:3000`. `curl http://localhost:4000/api/health` returns `ok` when the backend
is up. The CLI builds and runs on its own:

```bash
cd cli
cargo run -- --help
```

## Configuration

Nothing environment-specific is baked into the code. Each piece reads its settings from flags or
environment variables, and ships an example file to copy.

**Backend.** Copy [`backend/.env.example`](backend/.env.example) to `backend/.env`. Flags and real
environment variables take precedence over the file.

| Variable | Flag | Default | Meaning |
|---|---|---|---|
| `KIKX_PORT` | `--port` | `4000` | Port the API listens on |
| `KIKX_BIND` | `--bind` | `127.0.0.1` | Address to bind |
| `KIKX_ALLOWED_ORIGINS` | `--allow-origin` | *(empty)* | Comma-separated browser origins. Empty allows any loopback origin (`localhost`, `127.0.0.1`, `[::1]`) on any port |

**Dashboard.** Copy [`web/.env.example`](web/.env.example) to `web/.env.local`.

| Variable | Meaning |
|---|---|
| `NEXT_PUBLIC_KIKX_API_URL` | URL of the running backend. Required; the dashboard explains what's missing if it isn't set |

**Project defaults** (default namespace, output directory, fallback project name) are declared once
in `kikx-core` and served at `/api/config`, so the CLI, API and dashboard always agree.

## Backend API

All endpoints are under `/api`. The backend is stateless and only renders; it never writes to
disk.

| Method | Path | What it does |
|---|---|---|
| `GET` | `/api/health` | Liveness check |
| `GET` | `/api/registry` | Every built-in component with its fields (defaults, examples, options) and output paths |
| `GET` | `/api/config` | Project defaults: namespace, output directory, project name |
| `GET` | `/api/components` | Just the built-in references |
| `GET` | `/api/presets` | The built-in preset templates: name, title, description, component count |
| `GET` | `/api/presets/{name}` | One template's full manifest, or `404 not_found` |
| `GET` | `/api/registry/inspect?ref=<reference>` | The field schema for one component (built-in, URL, or local file) |
| `POST` | `/api/render` | Render a component's file(s). Returns the content and writes nothing |

## Checks before a pull request

```bash
cd cli && cargo test && cargo clippy --all-targets -- -D warnings && cargo fmt --check

cd backend && cargo test && cargo clippy --all-targets -- -D warnings && cargo fmt --check
cd backend/core && cargo test && cargo clippy --all-targets -- -D warnings && cargo fmt --check

cd web && npm install && npx tsc --noEmit && npm run lint && npm run build
```

The documentation is built with Sphinx from `docs/`. `html` and `html-fr` treat warnings as errors,
`update-po` refreshes the French catalogues after the English pages change, and `serve` rebuilds on save:

```bash
pip install -r docs/requirements.txt
make -C docs html
make -C docs html-fr
make -C docs update-po
make -C docs serve
```

The same builds without make:

```bash
sphinx-build -W -b html docs/source docs/build/html
sphinx-build -W -b html -D language=fr docs/source docs/build/html/fr
sphinx-autobuild docs/source docs/build/html
```

## Releasing

Pushing a tag matching `v*.*.*` runs [`.github/workflows/release.yml`](.github/workflows/release.yml).
It checks that the tag matches `cli/Cargo.toml`'s version, runs the Rust test suite, then builds
and publishes the `kikx` CLI as a GitHub Release with binaries for macOS (arm64 + x64), Linux (x64
+ arm64) and Windows (x64).

```bash
git commit -am "chore: release v0.2.0"
git tag v0.2.0
git push && git push --tags
```

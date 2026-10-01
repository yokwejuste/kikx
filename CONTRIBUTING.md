# Contributing to kikx

People use kikx through the hosted dashboard and the downloadable CLI. This guide is for working on
kikx itself: running the backend and the dashboard locally, their configuration, the checks to run
before a pull request, the documentation build and the release process.

By taking part you agree to follow the [code of conduct](CODE_OF_CONDUCT.md). Report security
problems privately as described in [SECURITY.md](SECURITY.md), never in a public issue.

## Ways to contribute

- **Report a bug** with the [bug report](https://github.com/yokwejuste/kikx/issues/new?template=bug_report.yml)
  form: what you ran, what you expected and what happened, with the preset or registry item if one
  is involved.
- **Suggest a component, template or feature** with the
  [feature request](https://github.com/yokwejuste/kikx/issues/new?template=feature_request.yml) form.
- **Improve the docs** in `docs/`, in English, and the French catalogues in `docs/locales/fr/` when
  you can.
- **Send a pull request.** For anything larger than a small fix, open an issue first so the approach
  can be agreed before you write the code.

## Workflow

1. Fork the repository and create a branch from `main`, named `<type>/<short-description>`, where
   `<type>` is a conventional-commit type: `feat`, `fix`, `docs`, `refactor`, `perf`, `test`,
   `build`, `ci`, `chore`, `style` or `revert`. For example `fix/inventory-children-order`.
2. Write commit messages as `type(scope): summary`, for example
   `feat(ansible): support handlers in role skeletons`. Keep each commit to one change.
3. Run the [checks](#checks-before-a-pull-request) for every package you touched.
4. Open a pull request against `main` and fill in the template. Open it as a draft while it is still
   in progress.

Conventions the review looks for:

- Defaults, examples and allowed values come from the registry in `backend/core`, never hardcoded
  in the CLI, the backend or the dashboard.
- Tests live in each package's `tests/` folder, not in source files.
- Code explains itself through naming and structure rather than comments.
- Files are grouped into folders by type; reuse an existing module or package before adding one.
- Examples use neutral names and documentation addresses (`192.0.2.0/24`, `example.com`), never a
  real organisation's hosts or data.
- A change to user-facing behaviour updates the docs in the same pull request.

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
cargo run
```

## Configuration

Nothing environment-specific is baked into the code. Each piece reads its settings from flags or
environment variables, and ships an example file to copy.

**Backend.** Copy [`backend/.env.example`](backend/.env.example) to `backend/.env`. Flags and real
environment variables take precedence over the file.

| Variable | Flag | Default | Meaning |
|-|-|-|-|
| `KIKX_PORT` | `--port` | `4000` | Port the API listens on |
| `KIKX_BIND` | `--bind` | `127.0.0.1` | Address to bind |
| `KIKX_ALLOWED_ORIGINS` | `--allow-origin` | *(empty)* | Comma-separated browser origins. Empty allows any loopback origin (`localhost`, `127.0.0.1`, `[::1]`) on any port |

**Dashboard.** Copy [`web/.env.example`](web/.env.example) to `web/.env.local`.

| Variable | Meaning |
|-|-|
| `NEXT_PUBLIC_KIKX_API_URL` | URL of the running backend. Required; the dashboard explains what's missing if it isn't set |

Link previews use the address the dashboard is served from, read from the request, so they need no setting.

**Docs.** The dashboard image builds the docs and serves them at `/docs/` (French at `/docs/fr/`), so
there is no separate docs deployment. The image is built from the repository root: in Coolify, set
the base directory to `/` and the Dockerfile to `/web/Dockerfile`, with watch paths `web/**` and `docs/**`.
Run `npm run docs` in `web/` to build them into `web/public/docs` for local development.

| Build variable | Meaning |
|-|-|
| `KIKX_APP_URL` | Optional. Where the docs' Try kikx button points. Defaults to `/`, the dashboard serving the docs |
| `KIKX_DOCS_URL` | Optional. Public URL of the docs, for example `https://<dashboard-domain>/docs/`, used for absolute link-preview URLs. Unset, the preview tags use relative paths |

**Project defaults** (default namespace, output directory, fallback project name) are declared once
in `kikx-core` and served at `/api/config`, so the CLI, API and dashboard always agree.

## Backend API

All endpoints are under `/api`. The backend is stateless and only renders; it never writes to
disk. Any other path returns `404` with
`{"code": "not_found", "error": "no route for GET /…"}`.

| Method | Path | What it does |
|-|-|-|
| `GET` | `/docs` | Interactive API reference built from the OpenAPI spec; `/` redirects here |
| `GET` | `/api/openapi.json` | OpenAPI 3.1 description of every endpoint |
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
cd cli && cargo test && RUSTFLAGS="-D warnings" cargo clippy --all-targets && cargo fmt --check

cd backend && cargo test && RUSTFLAGS="-D warnings" cargo clippy --all-targets && cargo fmt --check
cd backend/core && cargo test && RUSTFLAGS="-D warnings" cargo clippy --all-targets && cargo fmt --check
cargo machete

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

`install.sh` downloads `kikx-<version>-<os>-<arch>.tar.gz` from the latest release, so keep those archive names when changing the workflow.

```bash
git commit -am "chore: release v0.2.0"
git tag v0.2.0
git push && git push --tags
```

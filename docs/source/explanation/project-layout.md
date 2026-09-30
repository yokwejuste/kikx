# How the pieces fit together

kikx is four pieces in one repository: a command-line tool, an HTTP API, a shared library and a web
dashboard. This page explains how they divide the work and why the boundaries are where they are.
For the commands and endpoints themselves, see the [CLI reference](../reference/cli.md) and the
[HTTP API reference](../reference/http-api.md).

## One library, two front ends

All of kikx's actual behaviour lives in `kikx-core`, in `backend/core/`. It holds the registry of
components and their templates, the built-in preset templates and preset parsing, the `kikx.toml`
config and its defaults, and the operations: rendering a component, adding it to a project,
initialising a project, and setting up or applying a preset. It knows nothing about terminals or HTTP.

The CLI in `cli/` and the backend in `backend/` are thin layers over that library. The CLI turns
arguments into calls to `kikx-core` and prints the result; it reads and writes the filesystem
directly and needs no server. The backend turns HTTP requests into calls to the same functions and
serialises the result as JSON. The dashboard in `web/` talks only to the backend.

The point of this shape is that there is exactly one implementation of "render this component with
these values". The dashboard's live preview, a `kikx add` in a terminal and a `kikx setup` from a
downloaded preset all go through the same `render_component`, with the same defaults from the same
registry. A preset built in the dashboard therefore renders to the same files on the command line,
and a fix to a template or a rendering rule reaches every front end at once. See
[The registry as single source of truth](registry.md) and [How rendering works](rendering.md).

## Separate Cargo packages, shared by path

`cli/` and `backend/` are independent Cargo packages rather than members of one Cargo workspace.
The backend depends on `kikx-core` at `core`, and the CLI reaches the same crate through a relative
path, `../backend/core`. Each package has its own `Cargo.lock`, builds on its own, and runs its own
tests and lints.

This keeps the two deliverables honestly separate. The `kikx` binary is what users install, and it
is released on its own; the release workflow checks the tag against `cli/Cargo.toml` and builds
only the CLI. It has no reason to compile or lock the HTTP stack (axum, tokio, tower-http) the
backend needs, and the backend has no reason to carry the CLI's argument parsing. A workspace
would share a single lock file across both and tie their dependency resolution together. The path
dependency gives the one thing that matters, a single copy of the core code, without coupling the
rest.

The cost is some repetition: three `Cargo.lock` files, and three places to run `cargo test`. The
README's development section lists them.

## A stateless backend that only renders

The backend holds no state between requests and never writes a file. It serves the registry and
the project defaults, inspects registry items, and renders a component into file contents that it
returns in the response. It has no notion of a project, a user or a session.

Several things follow from that. There is nothing to store, migrate or back up. Any number of
dashboard tabs can use the same backend without stepping on each other. And the backend can't
damage anything: the worst a request can do is render something, and the rendered content only
becomes a file when you choose to download it. That also explains why the backend is a small local
tool with no authentication and a CORS policy that, by default, admits only loopback origins.

It also keeps responsibility clear. Writing files, with its questions about existing files,
`--force` and path safety, belongs to the CLI, which runs on the machine that owns the project.
Rendering, which is pure and repeatable, is the only thing that needed to be shared over HTTP.

## The dashboard keeps the project in the browser

The dashboard assembles the whole project client-side. Each component you save is stored as its
recipe (reference, name, field values and labels) together with the files the backend rendered for
it. The project is kept in React state and mirrored to the browser's `localStorage`, so a refresh
or a closed tab doesn't lose work. Conflict detection, the Checks view and the architecture
diagram all run over that in-browser model, without calling the backend.

Nothing reaches disk until you download. You can take the project as a `.zip` containing
`kikx.toml` and the rendered files, or as a preset: the recipes only, for `kikx setup` or
`kikx apply` to render again. The builder header shows where the project stands: saved only in
this browser, downloaded (and how long ago), or changed since the last `.zip` download.

Keeping the project in the browser matches the vendoring model. A project being built is a draft,
and drafts shouldn't be half-written into someone's repository. Deferring every write to one
explicit download means you review a complete, conflict-checked project before any of it becomes
yours, and it lets the backend stay stateless. The trade-off is that the project lives in one
browser profile until you export it; the preset download is how you move it, share it or keep it
under version control. See [Share a project as a preset](../how-to/presets.md).

## Where the tests live

Each Rust package keeps its tests in its own `tests/` directory as integration tests, rather than
in `#[cfg(test)]` modules next to the code. `backend/core/tests/` covers rendering, the registry,
presets, `setup`, `apply` and the built-in preset templates; `backend/tests/` drives the HTTP router,
its preset endpoints and its CORS policy; `cli/tests/` runs the built `kikx` binary against temporary directories and checks
argument parsing.

Testing from the outside means the tests exercise the same public API the other packages use: the
CLI's tests see what a user sees, the backend's see what the dashboard sees, and the core's see
what both front ends call. It keeps the source files focused on behaviour, and it makes each
package's test suite runnable on its own with `cargo test`, consistent with building each package
on its own. The dashboard is checked by type checking, linting and a production build.

## Related

- [Run kikx locally](../contributing/run-locally.md)
- [Configuration reference](../reference/configuration.md)
- [Vendoring real files](vendoring.md)

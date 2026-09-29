# Configuration

Settings read by the backend, the dashboard and the CLI.

The backend and dashboard settings only matter when you run your own instance, for example while contributing to kikx. The hosted dashboard needs none of them. See [Run kikx locally](../contributing/run-locally.md).

## Backend

`kikx-backend` options:

| Flag | Environment variable | Type | Default | Description |
|-|-|-|-|-|
| `--port <PORT>` | `KIKX_PORT` | integer `0` to `65535` | `4000` | Port to listen on |
| `--bind <BIND>` | `KIKX_BIND` | host or IP address | `127.0.0.1` | Address to bind |
| `--allow-origin <ALLOW_ORIGIN>` | `KIKX_ALLOWED_ORIGINS` | comma-separated list of origins | empty | Browser origins allowed by CORS. Empty allows any loopback origin. See [HTTP API](http-api.md#cors) |
| `-h`, `--help` |  |  |  | Print help |

`kikx-backend` has no `--version` option.

`--allow-origin` accepts a comma-separated list and can be repeated. Each origin is trimmed; empty entries are dropped.

On start the backend prints:

```
kikx-backend listening on http://127.0.0.1:4000
```

### Precedence

Highest first:

1. Command-line flag.
2. Environment variable set in the process environment.
3. Environment variable from a `.env` file.
4. Built-in default.

The `.env` file is loaded with `dotenvy` from the working directory, or from the nearest parent directory that has one. It never overrides a variable already set in the environment. A line that `dotenvy` cannot parse, for example an unquoted value containing a space, stops loading at that line without an error; that line and every line after it are ignored.

`backend/.env.example`:

```
KIKX_PORT=4000
KIKX_BIND=127.0.0.1
KIKX_ALLOWED_ORIGINS=
```

A list with spaces must be quoted:

```
KIKX_ALLOWED_ORIGINS="https://a.example.com, https://b.example.com"
```

### Startup errors

Exit status `1`, message on stderr:

| Condition | Message |
|-|-|
| Origin is not a valid header value | ``Error: invalid --allow-origin value `<origin>` `` |
| Address cannot be bound | `Error: failed to bind <bind>:<port>` |

An invalid flag value exits with status `2`.

## Dashboard

| Variable | Required | Description |
|-|-|-|
| `NEXT_PUBLIC_KIKX_API_URL` | yes | Base URL of the backend, without `/api` |

Read by Next.js from `web/.env.local` or the environment. When unset, every API call fails with code `not_configured` and the message ``NEXT_PUBLIC_KIKX_API_URL is not set. Point it at your kikx backend (see web/.env.example).``

`web/.env.example`:

```
NEXT_PUBLIC_KIKX_API_URL=http://localhost:4000
```

## CLI

The CLI reads no environment variables. It reads `kikx.toml` from the current directory for [`kikx add`](cli.md#kikx-add).

## `kikx.toml`

Written by [`kikx init`](cli.md#kikx-init) and [`kikx setup`](cli.md#kikx-setup), read by [`kikx add`](cli.md#kikx-add). TOML, one table.

```toml
[project]
name = "platform"
default_namespace = "platform"
output_dir = "infra"
```

| Key | Type | Required | Default | Description |
|-|-|-|-|-|
| `project.name` | string | yes |  | Project name |
| `project.default_namespace` | string | no | `default` | `namespace` in the template context when no `namespace` field is supplied |
| `project.output_dir` | string | no | `k8s` | Directory, relative to `kikx.toml`, that rendered paths are joined to |

A missing `[project]` table or `name` key fails with `failed to parse <path>/kikx.toml`.

## Project defaults

Compiled into `kikx-core` (`backend/core/src/config.rs`) and served by [`GET /api/config`](http-api.md#get-apiconfig).

| Constant | Value | `/api/config` key | Used for |
|-|-|-|-|
| `DEFAULT_NAMESPACE` | `default` | `defaultNamespace` | `kikx init --namespace`, `kikx.toml`, presets, `/api/render` `defaultNamespace` |
| `DEFAULT_OUTPUT_DIR` | `k8s` | `defaultOutputDir` | `kikx init --dir`, `kikx.toml`, preset `project.outputDir`, `kikx setup` |
| `DEFAULT_PROJECT_NAME` | `kikx-project` | `defaultProjectName` | Project name when the current directory has no name |

## See also

- [Run kikx locally](../contributing/run-locally.md)
- [How the pieces fit together](../explanation/project-layout.md)

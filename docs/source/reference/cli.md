# CLI

The `kikx` binary, built from `cli/`. It reads and writes the filesystem directly and needs no running backend.

```
kikx <COMMAND>
```

| Command | Purpose | Reads `kikx.toml` | Writes `kikx.toml` |
|---|---|---|---|
| [`init`](#kikx-init) | Create a project | no | yes |
| [`add`](#kikx-add) | Render one component into the output directory | yes | no |
| [`list`](#kikx-list) | Print the built-in components | no | no |
| [`presets`](#kikx-presets) | Print the built-in preset templates | no | no |
| [`setup`](#kikx-setup) | Create a project from a preset template, file or URL | no | yes |
| [`apply`](#kikx-apply) | Render a preset template, file or URL into an existing directory | no | no |

Global options:

| Option | Effect |
|---|---|
| `-h`, `--help` | Print help |
| `-V`, `--version` | Print the version, for example `kikx 0.0.1` |

All paths are resolved against the current working directory. The CLI reads no environment variables.

`kikx --help` lists each command with a one-line description:

```
Vendor real, editable infrastructure files into your project

Usage: kikx <COMMAND>

Commands:
  init     Create kikx.toml in the current directory
  add      Render a component and write its files into the project
  list     List the built-in components with their fields
  presets  List the built-in preset templates
  setup    Bootstrap a new project from a preset template, file or URL
  apply    Vendor a preset template, file or URL into an existing project
  help     Print this message or the help of the given subcommand(s)

Options:
  -h, --help     Print help
  -V, --version  Print version
```

`kikx <COMMAND> --help` prints the same description above the command's usage.

## Exit status

| Status | Cause |
|---|---|
| `0` | Success |
| `1` | Operation error. The message is printed to stderr as `Error: <message>`, followed by `Caused by:` lines when present |
| `2` | Argument parsing error, for example a missing required option, a `--label` or `--set` value without `=`, or a number out of range |

## `kikx init`

```
kikx init [OPTIONS]
```

Writes `kikx.toml` in the current directory and creates the output directory.

| Option | Type | Default | Description |
|---|---|---|---|
| `--name <NAME>` | string | name of the current directory, or `kikx-project` when it has none | Project name, stored as `project.name` |
| `--dir <DIR>` | path | `k8s` | Output directory, stored as `project.output_dir` |
| `--namespace <NAMESPACE>` | string | `default` | Default namespace, stored as `project.default_namespace` |
| `--force` | flag | off | Overwrite an existing `kikx.toml` |

| Condition | Result |
|---|---|
| `kikx.toml` exists, no `--force` | Exit `1`: ``kikx.toml already exists in <dir> — pass --force to overwrite`` |
| `kikx.toml` exists, `--force` | `kikx.toml` is replaced. Files already in the output directory are kept |

Output on success:

```
Initialized kikx project `demo` — vendor components with `kikx add <category>/<component>` (see `kikx list`)
```

## `kikx add`

```
kikx add [OPTIONS] --name <NAME> <REFERENCE>
```

Renders one component with the project's `default_namespace` and writes its files under the project's `output_dir`.

| Argument | Description |
|---|---|
| `<REFERENCE>` | Built-in reference (`k8s/deployment`), URL, or local path to a `registry-item.json`. See [Registry item format](registry-item-format.md#reference-resolution) |

| Option | Type | Default | Sets field |
|---|---|---|---|
| `--name <NAME>` | string | required | `name` in the template context |
| `--image <IMAGE>` | string | registry default | `image` |
| `--replicas <REPLICAS>` | unsigned 32-bit integer | registry default | `replicas` |
| `--port <PORT>` | integer `0`–`65535` | registry default | `port` |
| `--target-port <TARGET_PORT>` | integer `0`–`65535` | registry default | `target_port` |
| `--namespace <NAMESPACE>` | string | `project.default_namespace` | `namespace` |
| `--host <HOST>` | string | registry default | `host` |
| `--path <PATH>` | string | registry default | `path` |
| `--service <SERVICE>` | string | registry default | `service` |
| `--label <KEY=VALUE>` | key/value, repeatable | `app=<name>` | an entry of `labels` |
| `--set <KEY=VALUE>` | key/value, repeatable | — | field `KEY` |
| `--force` | flag | off | Overwrite existing files |

Field precedence, highest first: `--set`, the dedicated option (`--image`, `--port`, …), the registry default. A later `--set` for the same key wins over an earlier one. `--label app=<value>` replaces the default `app` label.

The dedicated options set their field on any component. A field the component does not declare is still passed to the template.

| Condition | Result |
|---|---|
| No `kikx.toml` in the current directory | Exit `1`: ``no kikx.toml found in <dir> — run `kikx init` first`` |
| Unknown reference | Exit `1`: `` `<reference>` isn't a built-in component, and isn't a URL or existing local file — run `kikx list` to see built-ins, or pass a URL/path to a registry-item.json `` |
| Required field missing with no default | Exit `1`: `--<field> is required for <reference>` |
| Rendered path is absolute | Exit `1`: ``refusing to write `<path>` — absolute paths are not allowed`` |
| Rendered path leaves the output directory | Exit `1`: ``refusing to write `<path>` — it escapes the target directory`` |
| A target file exists, no `--force` | Exit `1`: `<path> already exists — pass --force to overwrite`. No file is written |
| Template error | Exit `1` with the template engine message |

Output on success, one line per file:

```
Vendored /home/user/demo/infra/web-deployment.yaml
```

Example:

```bash
kikx add k8s/deployment --name web --image nginx:1.27 --replicas 3 --label tier=frontend --set port=8080
```

## `kikx list`

```
kikx list
```

Prints every built-in component with its fields. Takes no options besides `--help`. Does not need `kikx.toml`.

Each field line shows, when present: `required`, `default <value>` (omitted for an empty default), `e.g. <example>`, `one of <options>`.

```
Available components:

  k8s/deployment — Pods running one container image.
      --set image=…  (required; e.g. nginx:1.27)
      --set replicas=…  (default 1)
      --set port=…  (default 80)
```

The full list is in [Components](components.md).

## `kikx presets`

```
kikx presets
```

Prints every built-in preset template with its name, title, component count and description. Takes no options besides `--help`. Does not need `kikx.toml`.

```
Preset templates:

  k8s-web-app — Kubernetes web app (7 components)
      A web frontend and an API behind ingresses, plus a background worker.

  single-server — Single server with Ansible (7 components)
      One DigitalOcean droplet, configured by a common role through a site playbook.

  kubeadm-cluster — Kubernetes cluster with kubeadm (11 components)
      Hetzner servers bootstrapped into a three-node control plane and three workers.

  web-and-database — Web servers and a database (13 components)
      Existing servers split into a web tier and a PostgreSQL primary with a replica.

  multi-tier-platform — Multi-tier platform (35 components)
      A storefront platform: edge load balancers, web/app tiers, PostgreSQL primary + replicas, Redis, monitoring and a Kubernetes cluster.

Start one with `kikx setup <name>`, or add it to a project with `kikx apply <name>`.
```

The name in the first column is what [`setup`](#kikx-setup) and [`apply`](#kikx-apply) accept. The templates are described in [Preset format](preset-format.md#built-in-templates).

## `kikx setup`

```
kikx setup [OPTIONS] <REFERENCE>
```

Renders every component of a preset into the preset's output directory, then writes `kikx.toml`.

| Argument | Description |
|---|---|
| `<REFERENCE>` | Template name (see [`kikx presets`](#kikx-presets)), URL (`http://` or `https://`) or local path to a preset file. See [Preset format](preset-format.md#location) |

| Option | Type | Default | Description |
|---|---|---|---|
| `--force` | flag | off | Overwrite an existing `kikx.toml` and existing files |

Values taken from the preset's `project` object:

| `kikx.toml` key | From | When `project` is absent |
|---|---|---|
| `name` | `project.name`, else the current directory name | current directory name |
| `default_namespace` | `project.namespace` (default `default`) | `default` |
| `output_dir` | `project.outputDir` (default `k8s`) | `k8s` |

| Condition | Result |
|---|---|
| `kikx.toml` exists, no `--force` | Exit `1`, nothing written |
| Reference is not a template name, a URL or an existing file | Exit `1`: `` `<reference>` isn't a template name, a URL or an existing local file — run `kikx presets` to see the templates `` |
| Preset does not parse | Exit `1`: `<reference> is not a valid kikx preset manifest` |
| Two components render the same path | Exit `1`: ``two files rendered to the same path: `<path>` `` |
| A target file exists, no `--force` | Exit `1`, no file and no `kikx.toml` written |

Output on success:

```
Initialized kikx project `multi-tier-platform` — wrote 77 file(s) to /home/user/demo/infra
  /home/user/demo/infra/edge-hetzner.tf
  ...
```

Example, starting from a template:

```bash
kikx setup single-server
```

## `kikx apply`

```
kikx apply [OPTIONS] <REFERENCE>
```

Renders every component of a preset into the current directory, or into `--into`. Never reads or writes `kikx.toml`. The namespace is `project.namespace` from the preset, else `default`. The preset's `project.outputDir` is not used.

| Argument | Description |
|---|---|
| `<REFERENCE>` | Template name, URL or local path to a preset file |

| Option | Type | Default | Description |
|---|---|---|---|
| `--into <INTO>` | path | current directory | Directory to write into, joined to the current directory |
| `--force` | flag | off | Overwrite existing files |

Error conditions are those of [`setup`](#kikx-setup), except the `kikx.toml` check.

Output on success:

```
Vendored 77 file(s):
  /home/user/repo/vendor/edge-hetzner.tf
  ...
```

Example, adding a template to an existing repo:

```bash
kikx apply k8s-web-app --into deploy/k8s
```

## Write rules

`add`, `setup` and `apply` validate every rendered path before writing any file:

1. Absolute paths are refused.
2. A path whose `..` components climb above the target directory at any point is refused.
3. Two files with the same path are refused.
4. Without `--force`, any existing target file stops the operation before the first write.

Parent directories are created as needed.

## See also

- [Your first project with the CLI](../tutorials/first-project-cli.md)
- [Share a project as a preset](../how-to/presets.md)
- [Resolve file conflicts and checks](../how-to/resolve-conflicts.md)
- [Vendoring real files](../explanation/vendoring.md)

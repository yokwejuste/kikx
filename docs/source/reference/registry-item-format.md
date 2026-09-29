# Registry item format

A registry item describes one component: its fields and the files it renders. Built-in components are registry items compiled into `kikx-core`. A `registry-item.json` file, local or at a URL, is loaded with the same schema. Schema source: `backend/core/src/registry/item.rs`.

## Reference resolution

A component reference is resolved in this order:

| Step | Condition | Result |
|---|---|---|
| 1 | The part after the last `/` equals a built-in name | That built-in component |
| 2 | Starts with `http://` or `https://` | JSON fetched with HTTP `GET` |
| 3 | Names an existing local file | JSON read from the file |
| 4 | Otherwise | Error: `` `<reference>` isn't a built-in component, and isn't a URL or existing local file — run `kikx list` to see built-ins, or pass a URL/path to a registry-item.json `` |

Step 1 applies to URLs and paths too: `https://example.com/items/role` and `./items/deployment` resolve to the built-ins `ansible/role` and `k8s/deployment`. The category is not compared: `other/deployment` resolves to `k8s/deployment`.

Relative paths are resolved against the working directory of the CLI or backend process.

| Failure | Message |
|---|---|
| URL fetch fails | `failed to fetch registry item from <url>` |
| JSON does not match the schema | `<reference> is not a valid registry item` |

## Item

| Key | Type | Required | Default | Description |
|---|---|---|---|---|
| `name` | string | yes | — | Component name |
| `category` | string | yes | — | Category. The reference is `<category>/<name>` |
| `title` | string | no | `""` | Display title |
| `description` | string | no | `""` | One-line description |
| `fields` | array of [Field](#field) | no | `[]` | Declared fields |
| `files` | array of [File](#file) | yes | — | Files to render, in order |

## Field

| Key | Type | Required | Default | Description |
|---|---|---|---|---|
| `name` | string | yes | — | Field name, and template variable name |
| `required` | boolean | no | `false` | Rendering fails when no value is supplied and `default` is absent |
| `default` | string | no | absent | Value used when none is supplied |
| `description` | string | no | absent | Help text |
| `example` | string | no | absent | Example value |
| `options` | array of [Option](#option) | no | `[]` | Suggested values. Not enforced |

## Option

| Key | Type | Required | Default | Description |
|---|---|---|---|---|
| `value` | string | yes | — | Option value |
| `label` | string | no | `""` | Display label. The HTTP API returns `value` when empty |

## File

| Key | Type | Required | Description |
|---|---|---|---|
| `path` | string | yes | Output path template, relative to the target directory |
| `template` | string | yes | File content template |

`path` and `template` are rendered with [MiniJinja](https://docs.rs/minijinja) using the [template context](#template-context). A trailing newline in `template` is kept. An undefined variable renders as an empty string.

## Template context

| Variable | Type | Value |
|---|---|---|
| `name` | string | Component name: `--name`, the preset component `name`, or the render request `name` |
| `namespace` | string | Supplied `namespace` field, else the default namespace |
| `labels` | map of string to string | Supplied labels, with `app` set to `name` unless supplied |
| each declared field except `namespace` | string, list or map | Supplied value, else `default`, else undefined |
| each supplied field not declared | string, list or map | Supplied value |

The default namespace is:

| Caller | Default namespace |
|---|---|
| `kikx add` | `project.default_namespace` from `kikx.toml` |
| `kikx setup`, `kikx apply` | `project.namespace` from the preset, else `default` |
| `POST /api/render` | `defaultNamespace` from the request, else `default` |

A declared field named `namespace` has no effect: its `default` is not applied.

A required field with no supplied value and no `default` fails with `--<field> is required for <category>/<name>`.

## JSON-valued fields

Every supplied value and default is a string. A value whose first non-whitespace character is `[` or `{` is parsed as JSON:

| Value | Template receives |
|---|---|
| `[1, 2]` | list |
| `{"a": 1}` | map, keys iterated in alphabetical order |
| `[1, 2` (invalid JSON) | the original string |
| any other value | the original string |

## Path rules

Checked when files are written by `kikx add`, `kikx setup` and `kikx apply`. `POST /api/render` does not write and applies only the duplicate check within one item.

| Rule | Error |
|---|---|
| Two files of one item render to the same path | `` <category>/<name> has two files that both render to `<path>` `` |
| Two files of one run render to the same path (`setup`, `apply`) | `` two files rendered to the same path: `<path>` `` |
| Path is absolute | `` refusing to write `<path>` — absolute paths are not allowed `` |
| Path, read left to right, climbs above the target directory at any `..` | `` refusing to write `<path>` — it escapes the target directory `` |
| Target file exists and `--force` is not passed | `<path> already exists — pass --force to overwrite` |

All checks run before the first file is written. Parent directories are created as needed.

## Example

`registry-item.json`:

```json
{
  "name": "configmap",
  "category": "k8s",
  "title": "ConfigMap",
  "description": "Key/value configuration for pods.",
  "fields": [
    {"name": "data", "required": true, "description": "JSON map of keys and values.", "example": "{\"LOG_LEVEL\": \"info\"}"},
    {"name": "immutable", "default": "false", "options": [{"value": "true"}, {"value": "false"}]}
  ],
  "files": [
    {
      "path": "{{ name }}-configmap.yaml",
      "template": "apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: {{ name }}\n  namespace: {{ namespace }}\n  labels:\n    app: {{ labels.app }}\nimmutable: {{ immutable }}\ndata:\n{% for key in data %}  {{ key }}: \"{{ data[key] }}\"\n{% endfor %}"
    }
  ]
}
```

Command:

```bash
kikx add ./registry-item.json --name web --set 'data={"LOG_LEVEL":"info","MODE":"prod"}'
```

Output, `web-configmap.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: web
  namespace: default
  labels:
    app: web
immutable: false
data:
  LOG_LEVEL: "info"
  MODE: "prod"
```

## See also

- [Render your own component from a registry item](../how-to/custom-registry-item.md)
- [How rendering works](../explanation/rendering.md)
- [The registry as single source of truth](../explanation/registry.md)

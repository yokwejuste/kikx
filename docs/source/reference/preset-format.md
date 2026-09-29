# Preset format

A preset is a JSON file listing components and their field values. It is read by [`kikx setup`](cli.md#kikx-setup) and [`kikx apply`](cli.md#kikx-apply), and written and read by the dashboard. kikx also ships [built-in templates](#built-in-templates) in this format. Schema source: `backend/core/src/presets/manifest.rs`.

The dashboard names the file `<project name>.kikx-preset.json`, or `kikx-project.kikx-preset.json` when the project has no name. The CLI accepts any file name.

## Location

A reference is checked in this order:

| Reference | Loaded from |
|-|-|
| Name of a [built-in template](#built-in-templates) | The template embedded in `kikx-core` |
| Starts with `http://` or `https://` | HTTP `GET` |
| Existing local file | The file, relative to the current directory |
| Anything else | Error: `` `<reference>` isn't a template name, a URL or an existing local file. Run `kikx presets` to see the templates `` |

A template name wins over a local file with the same name. Use `./<name>` to load the file instead.

## Manifest

| Key | Type | Required | Default | Description |
|-|-|-|-|-|
| `name` | string | no | `""` | Preset name. For a built-in template, the name that `setup` and `apply` accept. Not used when rendering |
| `title` | string | no | `""` | Display title, shown by `kikx presets` and the dashboard template gallery. Not used when rendering |
| `description` | string | no | `""` | Preset description. Not used when rendering |
| `project` | [Project](#project) | no | absent | Project settings |
| `components` | array of [Component](#component) | yes |  | Components, rendered in order |

Unknown keys are ignored.

## Project

| Key | Type | Required | Default | Used by |
|-|-|-|-|-|
| `name` | string | no | name of the current directory | `setup`: `project.name` in `kikx.toml` |
| `namespace` | string | no | `default` | `setup` and `apply`: default namespace for every component; `setup`: `project.default_namespace` |
| `outputDir` | string | no | `infra` | `setup`: output directory and `project.output_dir`. Ignored by `apply` |

When `project` is absent, `setup` uses the current directory name, `default` and `infra`, and `apply` uses `default`.

## Component

| Key | Type | Required | Default | Description |
|-|-|-|-|-|
| `reference` | string | yes |  | Component reference. See [Registry item format](registry-item-format.md#reference-resolution) |
| `name` | string | yes |  | `name` in the template context |
| `fields` | object of string to string | no | `{}` | Field values. Every value must be a JSON string |
| `labels` | object of string to string | no | `{}` | Labels. `app` defaults to `name` |

A field listed in [Components](components.md) as JSON-valued is stored as a string containing JSON, for example `"hosts": "[{\"group\": \"web\"}]"`. A non-string value fails with `<reference> is not a valid kikx preset manifest` and ``invalid type: integer `8080`, expected a string``.

A `namespace` key in `fields` overrides the project namespace for that component.

## Minimal example

```json
{
  "components": [
    {"reference": "k8s/service", "name": "web"}
  ]
}
```

`kikx setup` writes `infra/web-service.yaml` and:

```toml
[project]
name = "<current directory name>"
default_namespace = "default"
output_dir = "infra"
```

## Full example

```json
{
  "name": "platform",
  "description": "Web tier with an inventory, a playbook and a Kubernetes deployment.",
  "project": {
    "name": "platform",
    "namespace": "platform",
    "outputDir": "infra"
  },
  "components": [
    {
      "reference": "ansible/inventory",
      "name": "platform",
      "fields": {
        "hosts": "[{\"group\": \"web\", \"members\": [{\"name\": \"web-01\", \"ansible_host\": \"192.0.2.10\"}]}]",
        "default_user": "deploy"
      }
    },
    {
      "reference": "ansible/playbook",
      "name": "web",
      "fields": {
        "folder": "playbooks",
        "plays": "[{\"hosts\": \"web\", \"roles\": [\"nginx\"]}]"
      }
    },
    {
      "reference": "ansible/role",
      "name": "nginx"
    },
    {
      "reference": "k8s/deployment",
      "name": "web",
      "fields": {
        "image": "nginx:1.27",
        "replicas": "2"
      },
      "labels": {
        "tier": "frontend"
      }
    }
  ]
}
```

`kikx setup` writes these files under `infra/`:

```
platform-inventory.ini
playbooks/web.yml
roles/nginx/tasks/main.yml
roles/nginx/defaults/main.yml
roles/nginx/handlers/main.yml
roles/nginx/meta/main.yml
web-deployment.yaml
```

A larger preset with 35 components is the [`multi-tier-platform`](#built-in-templates) template.

## Built-in templates

kikx ships five presets, embedded in `kikx-core` at build time. Their source files are in `backend/core/presets/`, one `<name>.kikx-preset.json` per template. They are listed by [`kikx presets`](cli.md#kikx-presets) and [`GET /api/presets`](http-api.md#get-apipresets), and shown on the dashboard home page under **Start from a template**.

| Name | Title | Components | Output directory | Namespace | Contents |
|-|-|-|-|-|-|
| `k8s-web-app` | Kubernetes web app | 7 | `k8s` | `web` | A web frontend and an API behind ingresses, plus a background worker. |
| `single-server` | Single server with Ansible | 7 | `infra` | `default` | One DigitalOcean droplet, configured by a common role through a site playbook. |
| `kubeadm-cluster` | Kubernetes cluster with kubeadm | 11 | `infra` | `default` | Hetzner servers bootstrapped into a three-node control plane and three workers. |
| `web-and-database` | Web servers and a database | 13 | `infra` | `default` | Existing servers split into a web tier and a PostgreSQL primary with a replica. |
| `multi-tier-platform` | Multi-tier platform | 35 | `infra` | `shop` | A storefront platform: edge load balancers, web/app tiers, PostgreSQL primary + replicas, Redis, monitoring and a Kubernetes cluster. |

Every template that contains Ansible components also contains an [`ansible/config`](components.md#ansibleconfig) component, so `ansible-playbook site.yml` finds the inventory and the roles from the output directory.

A template is an ordinary preset: rendering it gives editable files with no link back to the template.

## Rendering rules

All components are rendered before any file is written. The run stops with no file written when:

- a component fails to render;
- two components render the same path;
- a rendered path is absolute or leaves the target directory;
- a target file exists and `--force` is not passed.

## See also

- [Share a project as a preset](../how-to/presets.md)
- [Vendoring real files](../explanation/vendoring.md)

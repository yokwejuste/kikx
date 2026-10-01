# HTTP API

The `kikx-backend` HTTP API, built from `backend/`. It is stateless, renders only, and never writes to disk. Bind address and port are set in [Configuration](configuration.md#backend).

Base URL: `http://127.0.0.1:4000` by default. All paths are under `/api`.

| Method | Path | Request | Response |
|-|-|-|-|
| `GET` | [`/api/health`](#get-apihealth) |  | `text/plain` |
| `GET` | [`/api/components`](#get-apicomponents) |  | `ComponentsResponse` |
| `GET` | [`/api/registry`](#get-apiregistry) |  | `RegistryResponse` |
| `GET` | [`/api/config`](#get-apiconfig) |  | `ConfigResponse` |
| `GET` | [`/api/presets`](#get-apipresets) |  | `PresetsResponse` |
| `GET` | [`/api/presets/{name}`](#get-apipresetsname) | path `name` | Preset manifest |
| `GET` | [`/api/registry/inspect`](#get-apiregistryinspect) | query `ref` | `RegistryItem` |
| `POST` | [`/api/render`](#post-apirender) | `RenderRequest` JSON | `RenderResponse` |

`GET` routes also answer `HEAD`. Any other method on a known path returns `405 Method Not Allowed` with an `allow` header. An unknown path returns `404 Not Found` with an empty body.

## `GET /api/health`

Response `200`, `content-type: text/plain; charset=utf-8`:

```
ok
```

## `GET /api/components`

References of the built-in components, in registry order.

Response `200`:

```json
{"components":["k8s/deployment","k8s/service","k8s/ingress","terraform/digitalocean","terraform/hetzner","terraform/aws","terraform/google","terraform/scaleway","terraform/linode","ansible/k8s-bootstrap","ansible/inventory","ansible/group-vars","ansible/common-role","ansible/role","ansible/playbook","ansible/site","ansible/config"]}
```

| Key | Type |
|-|-|
| `components` | array of strings |

## `GET /api/registry`

Every built-in component.

Response `200`:

```json
{"items":[{"name":"deployment","category":"k8s","title":"Deployment","description":"Pods running one container image.","reference":"k8s/deployment","fields":[{"name":"image","required":true,"default":null,"description":null,"example":"nginx:1.27","options":[],"format":null},{"name":"replicas","required":false,"default":"1","description":null,"example":null,"options":[],"format":null},{"name":"port","required":false,"default":"80","description":null,"example":null,"options":[],"format":null}],"files":["{{ name }}-deployment.yaml"]}]}
```

The example shows the first item only. The full content is listed in [Components](components.md).

| Key | Type |
|-|-|
| `items` | array of [`RegistryItem`](#registryitem) |

### `RegistryItem`

| Key | Type | Description |
|-|-|-|
| `name` | string | Component name |
| `category` | string | Component category |
| `title` | string | Display title, `""` when unset |
| `description` | string | One-line description, `""` when unset |
| `reference` | string | `<category>/<name>` |
| `fields` | array of [`Field`](#field) | Declared fields, in order |
| `files` | array of strings | Output path templates, unrendered. Template bodies are not included |

### `Field`

| Key | Type | Description |
|-|-|-|
| `name` | string | Field name |
| `required` | boolean | Rendering fails when no value and no default |
| `default` | string or `null` | Value used when none is supplied |
| `description` | string or `null` | Help text |
| `example` | string or `null` | Example value |
| `options` | array of `{value, label}` | Suggested values. `label` equals `value` when the registry item leaves it empty |
| `format` | `"ip"`, `"cidr"` or `null` | Value format checked before rendering. See [Registry item format](registry-item-format.md#field) |

## `GET /api/config`

Project defaults compiled into `kikx-core`.

Response `200`:

```json
{"defaultNamespace":"default","defaultOutputDir":"infra","defaultProjectName":"kikx-project"}
```

| Key | Type |
|-|-|
| `defaultNamespace` | string |
| `defaultOutputDir` | string |
| `defaultProjectName` | string |

## `GET /api/presets`

Summaries of the [built-in preset templates](preset-format.md#built-in-templates), in the order `kikx presets` prints them.

Response `200`:

```json
{"presets":[{"name":"k8s-web-app","title":"Kubernetes web app","description":"A web frontend and an API behind ingresses, plus a background worker.","componentCount":7,"references":["k8s/deployment","k8s/service","k8s/ingress"]},{"name":"single-server","title":"Single server with Ansible","description":"One DigitalOcean droplet, configured by a common role through a site playbook.","componentCount":7,"references":["terraform/digitalocean","ansible/inventory","ansible/config","ansible/group-vars","ansible/common-role","ansible/playbook","ansible/site"]},{"name":"kubeadm-cluster","title":"Kubernetes cluster with kubeadm","description":"Hetzner servers bootstrapped into a three-node control plane and three workers.","componentCount":11,"references":["terraform/hetzner","ansible/inventory","ansible/config","ansible/group-vars","ansible/k8s-bootstrap","ansible/role","ansible/playbook","ansible/site"]},{"name":"web-and-database","title":"Web servers and a database","description":"Existing servers split into a web tier and a PostgreSQL primary with a replica.","componentCount":13,"references":["ansible/inventory","ansible/config","ansible/group-vars","ansible/common-role","ansible/role","ansible/playbook","ansible/site"]},{"name":"multi-tier-platform","title":"Multi-tier platform","description":"A storefront platform: edge load balancers, web/app tiers, PostgreSQL primary + replicas, Redis, monitoring and a Kubernetes cluster.","componentCount":35,"references":["terraform/hetzner","ansible/inventory","ansible/config","ansible/group-vars","ansible/playbook","ansible/site","ansible/common-role","ansible/role","k8s/deployment","k8s/service","k8s/ingress"]}]}
```

| Key | Type |
|-|-|
| `presets` | array of [`PresetSummary`](#presetsummary) |

### `PresetSummary`

| Key | Type | Description |
|-|-|-|
| `name` | string | Template name, accepted by `GET /api/presets/{name}`, `kikx setup` and `kikx apply` |
| `title` | string | Display title, `""` when unset |
| `description` | string | One-line description, `""` when unset |
| `componentCount` | integer | Number of components in the template |
| `references` | array of string | Each distinct component reference in the template, in first-use order |

## `GET /api/presets/{name}`

Returns one built-in template as a preset manifest, in the [Preset format](preset-format.md#manifest). Every key is present: `fields` and `labels` are `{}` when the template leaves them out, and `project.name` is `null` when unset. The dashboard renders each component through [`POST /api/render`](#post-apirender) to open it.

| Path parameter | Description |
|-|-|
| `name` | Template name, as listed by [`GET /api/presets`](#get-apipresets) |

Request:

```
GET /api/presets/k8s-web-app
```

Response `200`, shortened to the first component:

```json
{"name":"k8s-web-app","title":"Kubernetes web app","description":"A web frontend and an API behind ingresses, plus a background worker.","project":{"name":"web-app","namespace":"web","outputDir":"k8s"},"components":[{"reference":"k8s/deployment","name":"frontend","fields":{"image":"ghcr.io/example/frontend:1.0.0","replicas":"2","port":"3000"},"labels":{}}]}
```

| Condition | Status | Body |
|-|-|-|
| No template with that name | `404` | ``{"code":"not_found","error":"no preset template named `nope`"}`` |

## `GET /api/registry/inspect`

Resolves one reference and returns its [`RegistryItem`](#registryitem).

| Query parameter | Required | Description |
|-|-|-|
| `ref` | yes | Built-in reference, URL, or path to a `registry-item.json`. A relative path is resolved against the backend's working directory. See [Registry item format](registry-item-format.md#reference-resolution) |

Request:

```
GET /api/registry/inspect?ref=k8s/service
```

Response `200`:

```json
{"name":"service","category":"k8s","title":"Service","description":"A stable address for pods.","reference":"k8s/service","fields":[{"name":"port","required":false,"default":"80","description":null,"example":null,"options":[],"format":null},{"name":"target_port","required":false,"default":null,"description":"Container port; defaults to the service port.","example":null,"options":[],"format":null}],"files":["{{ name }}-service.yaml"]}
```

| Condition | Status | Body |
|-|-|-|
| Unknown reference | `400` | `` {"code":"invalid_request","error":"`nope/thing` isn't a built-in component, and isn't a URL or existing local file. Run `kikx list` to see built-ins, or pass a URL/path to a registry-item.json"} `` |
| URL fetch fails | `400` | `{"code":"invalid_request","error":"failed to fetch registry item from <url>"}` |
| File or response is not a registry item | `400` | `{"code":"invalid_request","error":"<ref> is not a valid registry item"}` |
| `ref` missing | `400` | `text/plain`: ``Failed to deserialize query string: missing field `ref` `` |

## `POST /api/render`

Renders one component and returns the file contents. Writes nothing. Path safety checks applied by the CLI when writing are not applied.

Request headers: `Content-Type: application/json`.

### `RenderRequest`

| Key | Type | Required | Default | Description |
|-|-|-|-|-|
| `reference` | string | yes |  | Component reference |
| `name` | string | yes |  | `name` in the template context |
| `fields` | object of string to string | no | `{}` | Field values |
| `labels` | array of `{key, value}` | no | `[]` | Labels. `app` defaults to `name` |
| `defaultNamespace` | string | no | `default` | Namespace used when no `namespace` field is supplied |
| `image` | string | no |  | Sets field `image` |
| `replicas` | unsigned 32-bit integer | no |  | Sets field `replicas` |
| `port` | integer `0` to `65535` | no |  | Sets field `port` |
| `targetPort` | integer `0` to `65535` | no |  | Sets field `target_port` |
| `namespace` | string | no |  | Sets field `namespace` |
| `host` | string | no |  | Sets field `host` |
| `path` | string | no |  | Sets field `path` |
| `service` | string | no |  | Sets field `service` |

A key in `fields` wins over the top-level key that sets the same field. Unknown top-level keys are ignored.

Request:

```json
{"reference":"k8s/service","name":"web","port":8080,"labels":[{"key":"tier","value":"frontend"}]}
```

Response `200`:

```json
{"component":"service","files":[{"path":"web-service.yaml","content":"apiVersion: v1\nkind: Service\nmetadata:\n  name: web\n  namespace: default\nspec:\n  selector:\n\n    app: web\n\n    tier: frontend\n\n  ports:\n    - port: 8080\n      targetPort: 8080\n      protocol: TCP\n"}]}
```

### `RenderResponse`

| Key | Type | Description |
|-|-|-|
| `component` | string | Component name, without category |
| `files` | array of `{path, content}` | Rendered path, relative, and file content |

### Errors

| Condition | Status | Content type | Body |
|-|-|-|-|
| Unknown or invalid reference | `400` | JSON | `{"code":"invalid_request","error":"..."}` |
| Required field missing | `400` | JSON | `{"code":"invalid_request","error":"--image is required for k8s/deployment"}` |
| A field with a format has an invalid value | `400` | JSON | ``{"code":"invalid_request","error":"field `private_network` of terraform/aws: `10.0.0.5/16` is not the start of its range; use `10.0.0.0/16`"}`` |
| Two files render to the same path | `400` | JSON | ``{"code":"invalid_request","error":"custom/dup has two files that both render to `a.txt`"}`` |
| Template syntax or render error | `500` | JSON | `{"code":"internal","error":"syntax error: unexpected end of block (in <string>:1)"}` |
| Missing `Content-Type: application/json` | `415` | text | ``Expected request with `Content-Type: application/json` `` |
| Body is not valid JSON | `400` | text | `Failed to parse the request body as JSON: ...` |
| Missing key or wrong type | `422` | text | ``Failed to deserialize the JSON body into the target type: missing field `reference` at line 1 column 14`` |

## Error shape

Errors raised by kikx use this JSON body, with `content-type: application/json`:

```json
{"code":"invalid_request","error":"--image is required for k8s/deployment"}
```

| `code` | Status |
|-|-|
| `invalid_request` | `400` |
| `not_found` | `404` |
| `not_initialized` | `404` |
| `already_exists` | `409` |
| `internal` | `500` |

`not_initialized` and `already_exists` are defined but not returned by any current endpoint. Request parsing errors are returned by the framework as `text/plain`, as listed per endpoint.

## CORS

| Setting | Value |
|-|-|
| Allowed methods | `GET`, `POST` |
| Allowed request headers | `content-type` |
| Allowed origins, `KIKX_ALLOWED_ORIGINS` empty | Any origin whose host is `localhost`, `127.0.0.1` or `[::1]`, any scheme and port |
| Allowed origins, `KIKX_ALLOWED_ORIGINS` set | Exactly the listed origins. Loopback origins are no longer allowed unless listed |

An allowed origin is echoed in `access-control-allow-origin`. A disallowed origin gets no `access-control-allow-origin` header; the request itself is still processed. Every response carries `vary: origin`. Preflight `OPTIONS` requests return `200` with `access-control-allow-methods: GET,POST` and `access-control-allow-headers: content-type`.

Preflight for `http://localhost:3000`:

```
HTTP/1.1 200 OK
vary: origin
access-control-allow-methods: GET,POST
access-control-allow-headers: content-type
access-control-allow-origin: http://localhost:3000
allow: POST
content-length: 0
```

## See also

- [Run kikx locally](../contributing/run-locally.md)
- [Render your own component from a registry item](../how-to/custom-registry-item.md)
- [How the pieces fit together](../explanation/project-layout.md)

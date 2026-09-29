# API HTTP

L'API HTTP de `kikx-backend`, compilée depuis `backend/`. Elle est sans état, se contente d'effectuer des rendus et n'écrit jamais sur le disque. L'adresse d'écoute et le port se règlent dans [Configuration](configuration.md#backend).

URL de base : `http://127.0.0.1:4000` par défaut. Tous les chemins sont sous `/api`.

| Méthode | Chemin | Requête | Réponse |
|---|---|---|---|
| `GET` | [`/api/health`](#get-apihealth) | — | `text/plain` |
| `GET` | [`/api/components`](#get-apicomponents) | — | `ComponentsResponse` |
| `GET` | [`/api/registry`](#get-apiregistry) | — | `RegistryResponse` |
| `GET` | [`/api/config`](#get-apiconfig) | — | `ConfigResponse` |
| `GET` | [`/api/presets`](#get-apipresets) | — | `PresetsResponse` |
| `GET` | [`/api/presets/{name}`](#get-apipresetsname) | chemin `name` | Manifeste de preset |
| `GET` | [`/api/registry/inspect`](#get-apiregistryinspect) | requête `ref` | `RegistryItem` |
| `POST` | [`/api/render`](#post-apirender) | JSON `RenderRequest` | `RenderResponse` |

Les routes `GET` répondent aussi à `HEAD`. Toute autre méthode sur un chemin connu renvoie `405 Method Not Allowed` avec un en-tête `allow`. Un chemin inconnu renvoie `404 Not Found` avec un corps vide.

## `GET /api/health`

Réponse `200`, `content-type: text/plain; charset=utf-8` :

```
ok
```

## `GET /api/components`

Références des composants intégrés, dans l'ordre du registre.

Réponse `200` :

```json
{"components":["k8s/deployment","k8s/service","k8s/ingress","terraform/digitalocean","terraform/hetzner","ansible/k8s-bootstrap","ansible/inventory","ansible/group-vars","ansible/common-role","ansible/role","ansible/playbook","ansible/site","ansible/config"]}
```

| Clé | Type |
|---|---|
| `components` | tableau de chaînes |

## `GET /api/registry`

Tous les composants intégrés.

Réponse `200` :

```json
{"items":[{"name":"deployment","category":"k8s","title":"Deployment","description":"Pods running one container image.","reference":"k8s/deployment","fields":[{"name":"image","required":true,"default":null,"description":null,"example":"nginx:1.27","options":[]},{"name":"replicas","required":false,"default":"1","description":null,"example":null,"options":[]},{"name":"port","required":false,"default":"80","description":null,"example":null,"options":[]}],"files":["{{ name }}-deployment.yaml"]}]}
```

L'exemple ne montre que le premier élément. Le contenu complet est listé dans [Composants](components.md).

| Clé | Type |
|---|---|
| `items` | tableau de [`RegistryItem`](#registryitem) |

### `RegistryItem`

| Clé | Type | Description |
|---|---|---|
| `name` | chaîne | Nom du composant |
| `category` | chaîne | Catégorie du composant |
| `title` | chaîne | Titre affiché, `""` s'il n'est pas défini |
| `description` | chaîne | Description sur une ligne, `""` si elle n'est pas définie |
| `reference` | chaîne | `<category>/<name>` |
| `fields` | tableau de [`Field`](#field) | Champs déclarés, dans l'ordre |
| `files` | tableau de chaînes | Templates des chemins de sortie, non rendus. Le corps des templates n'est pas inclus |

### `Field`

| Clé | Type | Description |
|---|---|---|
| `name` | chaîne | Nom du champ |
| `required` | booléen | Le rendu échoue en l'absence de valeur et de valeur par défaut |
| `default` | chaîne ou `null` | Valeur utilisée lorsqu'aucune n'est fournie |
| `description` | chaîne ou `null` | Texte d'aide |
| `example` | chaîne ou `null` | Valeur d'exemple |
| `options` | tableau de `{value, label}` | Valeurs suggérées. `label` est égal à `value` lorsque l'élément de registre le laisse vide |

## `GET /api/config`

Valeurs par défaut du projet compilées dans `kikx-core`.

Réponse `200` :

```json
{"defaultNamespace":"default","defaultOutputDir":"k8s","defaultProjectName":"kikx-project"}
```

| Clé | Type |
|---|---|
| `defaultNamespace` | chaîne |
| `defaultOutputDir` | chaîne |
| `defaultProjectName` | chaîne |

## `GET /api/presets`

Résumés des [templates de preset intégrés](preset-format.md#templates-intégrés), dans l'ordre où `kikx presets` les affiche.

Réponse `200` :

```json
{"presets":[{"name":"k8s-web-app","title":"Kubernetes web app","description":"A web frontend and an API behind ingresses, plus a background worker.","componentCount":7},{"name":"single-server","title":"Single server with Ansible","description":"One DigitalOcean droplet, configured by a common role through a site playbook.","componentCount":7},{"name":"kubeadm-cluster","title":"Kubernetes cluster with kubeadm","description":"Hetzner servers bootstrapped into a three-node control plane and three workers.","componentCount":11},{"name":"web-and-database","title":"Web servers and a database","description":"Existing servers split into a web tier and a PostgreSQL primary with a replica.","componentCount":13},{"name":"multi-tier-platform","title":"Multi-tier platform","description":"A storefront platform: edge load balancers, web/app tiers, PostgreSQL primary + replicas, Redis, monitoring and a Kubernetes cluster.","componentCount":35}]}
```

| Clé | Type |
|---|---|
| `presets` | tableau de [`PresetSummary`](#presetsummary) |

### `PresetSummary`

| Clé | Type | Description |
|---|---|---|
| `name` | chaîne | Nom du template, accepté par `GET /api/presets/{name}`, `kikx setup` et `kikx apply` |
| `title` | chaîne | Titre affiché, `""` s'il n'est pas défini |
| `description` | chaîne | Description sur une ligne, `""` si elle n'est pas définie |
| `componentCount` | entier | Nombre de composants du template |

## `GET /api/presets/{name}`

Renvoie un template intégré sous forme de manifeste de preset, au [Format des presets](preset-format.md#manifeste). Toutes les clés sont présentes : `fields` et `labels` valent `{}` lorsque le template les omet, et `project.name` vaut `null` s'il n'est pas défini. Pour l'ouvrir, le tableau de bord effectue le rendu de chaque composant via [`POST /api/render`](#post-apirender).

| Paramètre de chemin | Description |
|---|---|
| `name` | Nom du template, tel que listé par [`GET /api/presets`](#get-apipresets) |

Requête :

```
GET /api/presets/k8s-web-app
```

Réponse `200`, raccourcie au premier composant :

```json
{"name":"k8s-web-app","title":"Kubernetes web app","description":"A web frontend and an API behind ingresses, plus a background worker.","project":{"name":"web-app","namespace":"web","outputDir":"k8s"},"components":[{"reference":"k8s/deployment","name":"frontend","fields":{"image":"ghcr.io/example/frontend:1.0.0","replicas":"2","port":"3000"},"labels":{}}]}
```

| Condition | Statut | Corps |
|---|---|---|
| Aucun template ne porte ce nom | `404` | ``{"code":"not_found","error":"no preset template named `nope`"}`` |

## `GET /api/registry/inspect`

Résout une référence et renvoie son [`RegistryItem`](#registryitem).

| Paramètre de requête | Obligatoire | Description |
|---|---|---|
| `ref` | oui | Référence intégrée, URL, ou chemin vers un `registry-item.json`. Un chemin relatif est résolu par rapport au répertoire de travail du backend. Voir [Format des éléments de registre](registry-item-format.md#résolution-des-références) |

Requête :

```
GET /api/registry/inspect?ref=k8s/service
```

Réponse `200` :

```json
{"name":"service","category":"k8s","title":"Service","description":"A stable address for pods.","reference":"k8s/service","fields":[{"name":"port","required":false,"default":"80","description":null,"example":null,"options":[]},{"name":"target_port","required":false,"default":null,"description":"Container port; defaults to the service port.","example":null,"options":[]}],"files":["{{ name }}-service.yaml"]}
```

| Condition | Statut | Corps |
|---|---|---|
| Référence inconnue | `400` | `` {"code":"invalid_request","error":"`nope/thing` isn't a built-in component, and isn't a URL or existing local file — run `kikx list` to see built-ins, or pass a URL/path to a registry-item.json"} `` |
| La récupération de l'URL échoue | `400` | `{"code":"invalid_request","error":"failed to fetch registry item from <url>"}` |
| Le fichier ou la réponse n'est pas un élément de registre | `400` | `{"code":"invalid_request","error":"<ref> is not a valid registry item"}` |
| `ref` absent | `400` | `text/plain` : ``Failed to deserialize query string: missing field `ref` `` |

## `POST /api/render`

Effectue le rendu d'un composant et renvoie le contenu des fichiers. N'écrit rien. Les vérifications de sécurité des chemins appliquées par la CLI à l'écriture ne sont pas appliquées.

En-têtes de la requête : `Content-Type: application/json`.

### `RenderRequest`

| Clé | Type | Obligatoire | Valeur par défaut | Description |
|---|---|---|---|---|
| `reference` | chaîne | oui | — | Référence du composant |
| `name` | chaîne | oui | — | `name` dans le contexte du template |
| `fields` | objet de chaîne vers chaîne | non | `{}` | Valeurs des champs |
| `labels` | tableau de `{key, value}` | non | `[]` | Labels. `app` vaut `name` par défaut |
| `defaultNamespace` | chaîne | non | `default` | Namespace utilisé lorsqu'aucun champ `namespace` n'est fourni |
| `image` | chaîne | non | — | Définit le champ `image` |
| `replicas` | entier non signé sur 32 bits | non | — | Définit le champ `replicas` |
| `port` | entier `0`–`65535` | non | — | Définit le champ `port` |
| `targetPort` | entier `0`–`65535` | non | — | Définit le champ `target_port` |
| `namespace` | chaîne | non | — | Définit le champ `namespace` |
| `host` | chaîne | non | — | Définit le champ `host` |
| `path` | chaîne | non | — | Définit le champ `path` |
| `service` | chaîne | non | — | Définit le champ `service` |

Une clé de `fields` l'emporte sur la clé de premier niveau qui définit le même champ. Les clés de premier niveau inconnues sont ignorées.

Requête :

```json
{"reference":"k8s/service","name":"web","port":8080,"labels":[{"key":"tier","value":"frontend"}]}
```

Réponse `200` :

```json
{"component":"service","files":[{"path":"web-service.yaml","content":"apiVersion: v1\nkind: Service\nmetadata:\n  name: web\n  namespace: default\nspec:\n  selector:\n\n    app: web\n\n    tier: frontend\n\n  ports:\n    - port: 8080\n      targetPort: 8080\n      protocol: TCP\n"}]}
```

### `RenderResponse`

| Clé | Type | Description |
|---|---|---|
| `component` | chaîne | Nom du composant, sans la catégorie |
| `files` | tableau de `{path, content}` | Chemin rendu, relatif, et contenu du fichier |

### Erreurs

| Condition | Statut | Type de contenu | Corps |
|---|---|---|---|
| Référence inconnue ou invalide | `400` | JSON | `{"code":"invalid_request","error":"..."}` |
| Champ obligatoire manquant | `400` | JSON | `{"code":"invalid_request","error":"--image is required for k8s/deployment"}` |
| Deux fichiers sont rendus vers le même chemin | `400` | JSON | ``{"code":"invalid_request","error":"custom/dup has two files that both render to `a.txt`"}`` |
| Erreur de syntaxe ou de rendu du template | `500` | JSON | `{"code":"internal","error":"syntax error: unexpected end of block (in <string>:1)"}` |
| `Content-Type: application/json` absent | `415` | texte | ``Expected request with `Content-Type: application/json` `` |
| Le corps n'est pas du JSON valide | `400` | texte | `Failed to parse the request body as JSON: ...` |
| Clé manquante ou type incorrect | `422` | texte | ``Failed to deserialize the JSON body into the target type: missing field `reference` at line 1 column 14`` |

## Forme des erreurs

Les erreurs levées par kikx utilisent ce corps JSON, avec `content-type: application/json` :

```json
{"code":"invalid_request","error":"--image is required for k8s/deployment"}
```

| `code` | Statut |
|---|---|
| `invalid_request` | `400` |
| `not_found` | `404` |
| `not_initialized` | `404` |
| `already_exists` | `409` |
| `internal` | `500` |

`not_initialized` et `already_exists` sont définis mais ne sont renvoyés par aucun point d'accès actuel. Les erreurs d'analyse de la requête sont renvoyées par le framework en `text/plain`, comme indiqué pour chaque point d'accès.

## CORS

| Réglage | Valeur |
|---|---|
| Méthodes autorisées | `GET`, `POST` |
| En-têtes de requête autorisés | `content-type` |
| Origines autorisées, `KIKX_ALLOWED_ORIGINS` vide | Toute origine dont l'hôte est `localhost`, `127.0.0.1` ou `[::1]`, quels que soient le schéma et le port |
| Origines autorisées, `KIKX_ALLOWED_ORIGINS` défini | Exactement les origines listées. Les origines de bouclage ne sont plus autorisées si elles ne sont pas listées |

Une origine autorisée est renvoyée dans `access-control-allow-origin`. Une origine refusée ne reçoit aucun en-tête `access-control-allow-origin` ; la requête elle-même est tout de même traitée. Chaque réponse porte `vary: origin`. Les requêtes préalables `OPTIONS` renvoient `200` avec `access-control-allow-methods: GET,POST` et `access-control-allow-headers: content-type`.

Requête préalable pour `http://localhost:3000` :

```
HTTP/1.1 200 OK
vary: origin
access-control-allow-methods: GET,POST
access-control-allow-headers: content-type
access-control-allow-origin: http://localhost:3000
allow: POST
content-length: 0
```

## Voir aussi

- [Lancer le tableau de bord et le backend](../how-to/run-the-dashboard.md)
- [Générer votre propre composant depuis un élément de registre](../how-to/custom-registry-item.md)
- [Comment les éléments s'articulent](../explanation/project-layout.md)

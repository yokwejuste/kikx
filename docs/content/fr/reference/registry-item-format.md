# Format des éléments de registre

Un élément de registre décrit un composant : ses champs et les fichiers dont il effectue le rendu. Les composants intégrés sont des éléments de registre compilés dans `kikx-core`. Un fichier `registry-item.json`, local ou accessible par une URL, est chargé avec le même schéma. Source du schéma : `backend/core/src/registry/item.rs`.

## Résolution des références

Une référence de composant est résolue dans cet ordre :

| Étape | Condition | Résultat |
|---|---|---|
| 1 | La partie après le dernier `/` est égale au nom d'un composant intégré | Ce composant intégré |
| 2 | Commence par `http://` ou `https://` | JSON récupéré par HTTP `GET` |
| 3 | Désigne un fichier local existant | JSON lu depuis le fichier |
| 4 | Sinon | Erreur : `` `<reference>` isn't a built-in component, and isn't a URL or existing local file — run `kikx list` to see built-ins, or pass a URL/path to a registry-item.json `` |

L'étape 1 s'applique aussi aux URL et aux chemins : `https://example.com/items/role` et `./items/deployment` sont résolus vers les composants intégrés `ansible/role` et `k8s/deployment`. La catégorie n'est pas comparée : `other/deployment` est résolu vers `k8s/deployment`.

Les chemins relatifs sont résolus par rapport au répertoire de travail du processus de la CLI ou du backend.

| Échec | Message |
|---|---|
| La récupération de l'URL échoue | `failed to fetch registry item from <url>` |
| Le JSON ne correspond pas au schéma | `<reference> is not a valid registry item` |

## Élément

| Clé | Type | Obligatoire | Valeur par défaut | Description |
|---|---|---|---|---|
| `name` | chaîne | oui | — | Nom du composant |
| `category` | chaîne | oui | — | Catégorie. La référence est `<category>/<name>` |
| `title` | chaîne | non | `""` | Titre affiché |
| `description` | chaîne | non | `""` | Description sur une ligne |
| `fields` | tableau de [Champ](#champ) | non | `[]` | Champs déclarés |
| `files` | tableau de [Fichier](#fichier) | oui | — | Fichiers à rendre, dans l'ordre |

## Champ

| Clé | Type | Obligatoire | Valeur par défaut | Description |
|---|---|---|---|---|
| `name` | chaîne | oui | — | Nom du champ, et nom de la variable de template |
| `required` | booléen | non | `false` | Le rendu échoue lorsqu'aucune valeur n'est fournie et que `default` est absent |
| `default` | chaîne | non | absent | Valeur utilisée lorsqu'aucune n'est fournie |
| `description` | chaîne | non | absent | Texte d'aide |
| `example` | chaîne | non | absent | Valeur d'exemple |
| `options` | tableau d'[Option](#option) | non | `[]` | Valeurs suggérées. Non imposées |

## Option

| Clé | Type | Obligatoire | Valeur par défaut | Description |
|---|---|---|---|---|
| `value` | chaîne | oui | — | Valeur de l'option |
| `label` | chaîne | non | `""` | Libellé affiché. L'API HTTP renvoie `value` lorsqu'il est vide |

## Fichier

| Clé | Type | Obligatoire | Description |
|---|---|---|---|
| `path` | chaîne | oui | Template du chemin de sortie, relatif au répertoire cible |
| `template` | chaîne | oui | Template du contenu du fichier |

Le rendu de `path` et de `template` est effectué avec [MiniJinja](https://docs.rs/minijinja) à l'aide du [contexte du template](#contexte-du-template). Un retour à la ligne final dans `template` est conservé. Une variable non définie est rendue comme une chaîne vide.

## Contexte du template

| Variable | Type | Valeur |
|---|---|---|
| `name` | chaîne | Nom du composant : `--name`, le `name` du composant dans le preset, ou le `name` de la requête de rendu |
| `namespace` | chaîne | Champ `namespace` fourni, sinon le namespace par défaut |
| `labels` | map de chaîne vers chaîne | Labels fournis, avec `app` égal à `name` sauf s'il est fourni |
| chaque champ déclaré sauf `namespace` | chaîne, liste ou map | Valeur fournie, sinon `default`, sinon non défini |
| chaque champ fourni non déclaré | chaîne, liste ou map | Valeur fournie |

Le namespace par défaut est :

| Appelant | Namespace par défaut |
|---|---|
| `kikx add` | `project.default_namespace` de `kikx.toml` |
| `kikx setup`, `kikx apply` | `project.namespace` du preset, sinon `default` |
| `POST /api/render` | `defaultNamespace` de la requête, sinon `default` |

Un champ déclaré nommé `namespace` n'a aucun effet : son `default` n'est pas appliqué.

Un champ obligatoire sans valeur fournie et sans `default` échoue avec `--<field> is required for <category>/<name>`.

## Champs à valeur JSON

Toute valeur fournie et toute valeur par défaut est une chaîne. Une valeur dont le premier caractère autre qu'un espace est `[` ou `{` est analysée comme du JSON :

| Valeur | Le template reçoit |
|---|---|
| `[1, 2]` | une liste |
| `{"a": 1}` | une map, dont les clés sont parcourues dans l'ordre alphabétique |
| `[1, 2` (JSON invalide) | la chaîne d'origine |
| toute autre valeur | la chaîne d'origine |

## Règles de chemin

Vérifiées lorsque les fichiers sont écrits par `kikx add`, `kikx setup` et `kikx apply`. `POST /api/render` n'écrit rien et n'applique que la vérification des doublons au sein d'un même élément.

| Règle | Erreur |
|---|---|
| Deux fichiers d'un même élément sont rendus vers le même chemin | `` <category>/<name> has two files that both render to `<path>` `` |
| Deux fichiers d'une même exécution sont rendus vers le même chemin (`setup`, `apply`) | `` two files rendered to the same path: `<path>` `` |
| Le chemin est absolu | `` refusing to write `<path>` — absolute paths are not allowed `` |
| Le chemin, lu de gauche à droite, remonte au-dessus du répertoire cible à un `..` quelconque | `` refusing to write `<path>` — it escapes the target directory `` |
| Le fichier cible existe et `--force` n'est pas passé | `<path> already exists — pass --force to overwrite` |

Toutes les vérifications ont lieu avant l'écriture du premier fichier. Les répertoires parents sont créés au besoin.

## Exemple

`registry-item.json` :

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

Commande :

```bash
kikx add ./registry-item.json --name web --set 'data={"LOG_LEVEL":"info","MODE":"prod"}'
```

Sortie, `web-configmap.yaml` :

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

## Voir aussi

- [Générer votre propre composant depuis un élément de registre](../how-to/custom-registry-item.md)
- [Comment fonctionne le rendu](../explanation/rendering.md)
- [Le registre, source unique de vérité](../explanation/registry.md)

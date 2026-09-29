# Générer votre propre composant depuis un élément de registre

Suivez ce guide lorsque kikx ne propose aucun élément intégré pour un fichier dont vous avez besoin. Vous décrivez le composant dans un `registry-item.json` et vous le chargez depuis un chemin local ou une URL, sans mettre kikx à jour.

## 1. Écrire l'élément de registre

```json
{
  "name": "configmap",
  "category": "k8s",
  "title": "ConfigMap",
  "description": "Plain key/value configuration for pods.",
  "fields": [
    {
      "name": "data",
      "required": true,
      "description": "JSON map of keys to values.",
      "example": "{\"LOG_LEVEL\":\"info\"}"
    },
    {
      "name": "immutable",
      "default": "false",
      "options": [
        { "value": "false", "label": "Editable" },
        { "value": "true", "label": "Immutable" }
      ]
    }
  ],
  "files": [
    {
      "path": "{{ name }}-configmap.yaml",
      "template": "apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: {{ name }}\n  namespace: {{ namespace }}\n  labels:\n{% for key, value in labels|items %}    {{ key }}: {{ value }}\n{% endfor %}immutable: {{ immutable }}\ndata:\n{% for key in data %}  {{ key }}: \"{{ data[key] }}\"\n{% endfor %}"
    }
  ]
}
```

Ce qui compte lorsque vous en écrivez un :

- `name`, `category` et `files` sont obligatoires. Toutes les autres clés sont facultatives.
- Le `path` et le `template` de chaque fichier sont des templates Jinja rendus avec MiniJinja. Les chemins doivent être relatifs et ne peuvent pas sortir du répertoire de sortie avec `..`.
- Les templates peuvent utiliser `name`, `namespace`, `labels` (qui contient toujours `app: <name>`) et chaque champ par son `name`.
- Une valeur de champ qui commence par `[` ou `{` et qui s'analyse comme du JSON arrive sous forme de liste ou de map. Tout le reste arrive sous forme de chaîne.
- Un champ `required` sans `default` doit être fourni, sinon le rendu échoue.

Pour le détail de chaque clé, consultez la référence [Format des éléments de registre](../reference/registry-item-format.md).

## 2. Effectuer le rendu avec la CLI

Dans un projet kikx, passez le chemin ou l'URL à l'endroit où vous passeriez normalement la référence d'un élément intégré :

```bash
kikx add ./registry-item.json --name web \
  --set 'data={"LOG_LEVEL": "info", "WORKERS": "4"}' \
  --label tier=frontend
```

Cette commande écrit `web-configmap.yaml` :

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: web
  namespace: default
  labels:
    app: web
    tier: frontend
immutable: false
data:
  LOG_LEVEL: "info"
  WORKERS: "4"
```

Depuis une URL :

```bash
kikx add https://example.com/kikx/configmap/registry-item.json --name web --set 'data={"LOG_LEVEL": "info"}'
```

S'il manque un champ obligatoire, vous obtenez `--data is required for k8s/configmap`. Fournissez-le avec `--set data=...`.

Pointez vers le fichier `.json` lui-même. kikx vérifie d'abord les éléments intégrés à partir du dernier segment de la référence : une référence qui se termine par le nom d'un élément intégré, comme `.../deployment`, rend donc le Deployment intégré à la place.

## 3. Ou effectuer le rendu dans le tableau de bord

1. Dans « Build », choisissez « From registry URL » sous l'étape Custom.
2. Collez une URL ou un chemin dans « URL or path to a registry-item.json », puis cliquez sur « Load ».
3. Renseignez « Name » et les champs de l'élément. Les champs obligatoires sont marqués d'un `*`. Saisissez du JSON pour les champs de type liste ou map.
4. Cliquez sur « Preview » pour vérifier le résultat, puis sur « Add to project ».

C'est le backend qui charge l'élément, pas le navigateur. Cela signifie que :

- un chemin local doit exister sur la machine qui exécute le backend. Un chemin relatif est résolu depuis le répertoire dans lequel le backend a été démarré ; préférez donc un chemin absolu ;
- une URL doit être accessible depuis le backend.

Pour modifier plus tard un composant personnalisé, ouvrez-le, chargez à nouveau le même élément et ajoutez-le avec le même « Name ». Les valeurs des champs ne sont pas pré-remplies : saisissez-les de nouveau. La boîte de dialogue de conflit propose alors de remplacer l'ancien.

## Le partager

Un preset enregistre la référence exactement telle que vous l'avez saisie. `kikx setup`, `kikx apply` et « Open a preset » rechargent tous l'élément depuis cet emplacement. Pour un preset que d'autres personnes utiliseront, hébergez l'élément à une URL plutôt qu'à un chemin local.

## Voir aussi

- [Format des éléments de registre](../reference/registry-item-format.md)
- [Le registre, source unique de vérité](../explanation/registry.md)
- [Comment fonctionne le rendu](../explanation/rendering.md)

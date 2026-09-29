# Format des presets

Un preset est un fichier JSON qui liste des composants et les valeurs de leurs champs. Il est lu par [`kikx setup`](cli.md#kikx-setup) et [`kikx apply`](cli.md#kikx-apply), et écrit et lu par le tableau de bord. kikx fournit aussi des [templates intégrés](#templates-intégrés) dans ce format. Source du schéma : `backend/core/src/presets/manifest.rs`.

Le tableau de bord nomme le fichier `<project name>.kikx-preset.json`, ou `kikx-project.kikx-preset.json` lorsque le projet n'a pas de nom. La CLI accepte n'importe quel nom de fichier.

## Emplacement

Une référence est vérifiée dans cet ordre :

| Référence | Chargée depuis |
|---|---|
| Nom d'un [template intégré](#templates-intégrés) | Le template embarqué dans `kikx-core` |
| Commence par `http://` ou `https://` | HTTP `GET` |
| Fichier local existant | Le fichier, relativement au répertoire courant |
| Tout le reste | Erreur : `` `<reference>` isn't a template name, a URL or an existing local file — run `kikx presets` to see the templates `` |

Un nom de template l'emporte sur un fichier local du même nom. Utilisez `./<name>` pour charger le fichier à la place.

## Manifeste

| Clé | Type | Obligatoire | Valeur par défaut | Description |
|---|---|---|---|---|
| `name` | chaîne | non | `""` | Nom du preset. Pour un template intégré, le nom qu'acceptent `setup` et `apply`. Non utilisé lors du rendu |
| `title` | chaîne | non | `""` | Titre affiché par `kikx presets` et par la galerie de templates du tableau de bord. Non utilisé lors du rendu |
| `description` | chaîne | non | `""` | Description du preset. Non utilisée lors du rendu |
| `project` | [Projet](#projet) | non | absent | Réglages du projet |
| `components` | tableau de [Composant](#composant) | oui | — | Composants, rendus dans l'ordre |

Les clés inconnues sont ignorées.

## Projet

| Clé | Type | Obligatoire | Valeur par défaut | Utilisée par |
|---|---|---|---|---|
| `name` | chaîne | non | nom du répertoire courant | `setup` : `project.name` dans `kikx.toml` |
| `namespace` | chaîne | non | `default` | `setup` et `apply` : namespace par défaut de chaque composant ; `setup` : `project.default_namespace` |
| `outputDir` | chaîne | non | `k8s` | `setup` : répertoire de sortie et `project.output_dir`. Ignorée par `apply` |

Lorsque `project` est absent, `setup` utilise le nom du répertoire courant, `default` et `k8s`, et `apply` utilise `default`.

## Composant

| Clé | Type | Obligatoire | Valeur par défaut | Description |
|---|---|---|---|---|
| `reference` | chaîne | oui | — | Référence du composant. Voir [Format des éléments de registre](registry-item-format.md#résolution-des-références) |
| `name` | chaîne | oui | — | `name` dans le contexte du template |
| `fields` | objet de chaîne vers chaîne | non | `{}` | Valeurs des champs. Chaque valeur doit être une chaîne JSON |
| `labels` | objet de chaîne vers chaîne | non | `{}` | Labels. `app` vaut `name` par défaut |

Un champ indiqué comme à valeur JSON dans [Composants](components.md) est stocké sous forme de chaîne contenant du JSON, par exemple `"hosts": "[{\"group\": \"web\"}]"`. Une valeur qui n'est pas une chaîne échoue avec `<reference> is not a valid kikx preset manifest` et ``invalid type: integer `8080`, expected a string``.

Une clé `namespace` dans `fields` remplace le namespace du projet pour ce composant.

## Exemple minimal

```json
{
  "components": [
    {"reference": "k8s/service", "name": "web"}
  ]
}
```

`kikx setup` écrit `k8s/web-service.yaml` et :

```toml
[project]
name = "<current directory name>"
default_namespace = "default"
output_dir = "k8s"
```

## Exemple complet

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

`kikx setup` écrit ces fichiers sous `infra/` :

```
platform-inventory.ini
playbooks/web.yml
roles/nginx/tasks/main.yml
roles/nginx/defaults/main.yml
roles/nginx/handlers/main.yml
roles/nginx/meta/main.yml
web-deployment.yaml
```

Un preset plus grand, de 35 composants, est le template [`multi-tier-platform`](#templates-intégrés).

## Templates intégrés

kikx fournit cinq presets, embarqués dans `kikx-core` à la compilation. Leurs fichiers sources se trouvent dans `backend/core/presets/`, un `<name>.kikx-preset.json` par template. Ils sont listés par [`kikx presets`](cli.md#kikx-presets) et [`GET /api/presets`](http-api.md#get-apipresets), et affichés sur la page d'accueil du tableau de bord sous « Start from a template ».

| Nom | Titre | Composants | Répertoire de sortie | Namespace | Contenu |
|---|---|---|---|---|---|
| `k8s-web-app` | Kubernetes web app | 7 | `k8s` | `web` | A web frontend and an API behind ingresses, plus a background worker. |
| `single-server` | Single server with Ansible | 7 | `infra` | `default` | One DigitalOcean droplet, configured by a common role through a site playbook. |
| `kubeadm-cluster` | Kubernetes cluster with kubeadm | 11 | `infra` | `default` | Hetzner servers bootstrapped into a three-node control plane and three workers. |
| `web-and-database` | Web servers and a database | 13 | `infra` | `default` | Existing servers split into a web tier and a PostgreSQL primary with a replica. |
| `multi-tier-platform` | Multi-tier platform | 35 | `infra` | `shop` | A storefront platform: edge load balancers, web/app tiers, PostgreSQL primary + replicas, Redis, monitoring and a Kubernetes cluster. |

Chaque template qui contient des composants Ansible contient aussi un composant [`ansible/config`](components.md#ansibleconfig) : `ansible-playbook site.yml` trouve ainsi l'inventaire et les rôles depuis le répertoire de sortie.

Un template est un preset ordinaire : son rendu donne des fichiers modifiables, sans aucun lien vers le template.

## Règles de rendu

Le rendu de tous les composants est effectué avant l'écriture du moindre fichier. L'exécution s'arrête sans écrire aucun fichier lorsque :

- le rendu d'un composant échoue ;
- deux composants sont rendus vers le même chemin ;
- un chemin rendu est absolu ou sort du répertoire cible ;
- un fichier cible existe et `--force` n'est pas passé.

## Voir aussi

- [Partager un projet sous forme de preset](../how-to/presets.md)
- [Vendoriser de vrais fichiers](../explanation/vendoring.md)

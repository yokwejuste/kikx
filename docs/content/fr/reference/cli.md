# CLI

Le binaire `kikx`, compilé depuis `cli/`. Il lit et écrit directement sur le système de fichiers et n'a besoin d'aucun backend en cours d'exécution.

```
kikx <COMMAND>
```

| Commande | Rôle | Lit `kikx.toml` | Écrit `kikx.toml` |
|---|---|---|---|
| [`init`](#kikx-init) | Créer un projet | non | oui |
| [`add`](#kikx-add) | Effectuer le rendu d'un composant dans le répertoire de sortie | oui | non |
| [`list`](#kikx-list) | Afficher les composants intégrés | non | non |
| [`presets`](#kikx-presets) | Afficher les templates de preset intégrés | non | non |
| [`setup`](#kikx-setup) | Créer un projet depuis un template de preset, un fichier ou une URL | non | oui |
| [`apply`](#kikx-apply) | Effectuer le rendu d'un template de preset, d'un fichier ou d'une URL dans un répertoire existant | non | non |

Options globales :

| Option | Effet |
|---|---|
| `-h`, `--help` | Affiche l'aide |
| `-V`, `--version` | Affiche la version, par exemple `kikx 0.0.1` |

Tous les chemins sont résolus par rapport au répertoire de travail courant. La CLI ne lit aucune variable d'environnement.

`kikx --help` liste chaque commande avec une description d'une ligne :

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

`kikx <COMMAND> --help` affiche la même description au-dessus de l'usage de la commande.

## Code de sortie

| Code | Cause |
|---|---|
| `0` | Succès |
| `1` | Erreur d'opération. Le message est affiché sur stderr sous la forme `Error: <message>`, suivi de lignes `Caused by:` le cas échéant |
| `2` | Erreur d'analyse des arguments, par exemple une option obligatoire absente, une valeur de `--label` ou `--set` sans `=`, ou un nombre hors limites |

## `kikx init`

```
kikx init [OPTIONS]
```

Écrit `kikx.toml` dans le répertoire courant et crée le répertoire de sortie.

| Option | Type | Valeur par défaut | Description |
|---|---|---|---|
| `--name <NAME>` | chaîne | nom du répertoire courant, ou `kikx-project` s'il n'en a pas | Nom du projet, enregistré dans `project.name` |
| `--dir <DIR>` | chemin | `k8s` | Répertoire de sortie, enregistré dans `project.output_dir` |
| `--namespace <NAMESPACE>` | chaîne | `default` | Namespace par défaut, enregistré dans `project.default_namespace` |
| `--force` | option sans valeur | désactivée | Écrase un `kikx.toml` existant |

| Condition | Résultat |
|---|---|
| `kikx.toml` existe, sans `--force` | Sortie `1` : ``kikx.toml already exists in <dir> — pass --force to overwrite`` |
| `kikx.toml` existe, avec `--force` | `kikx.toml` est remplacé. Les fichiers déjà présents dans le répertoire de sortie sont conservés |

Sortie en cas de succès :

```
Initialized kikx project `demo` — vendor components with `kikx add <category>/<component>` (see `kikx list`)
```

## `kikx add`

```
kikx add [OPTIONS] --name <NAME> <REFERENCE>
```

Effectue le rendu d'un composant avec le `default_namespace` du projet et écrit ses fichiers sous le `output_dir` du projet.

| Argument | Description |
|---|---|
| `<REFERENCE>` | Référence intégrée (`k8s/deployment`), URL, ou chemin local vers un `registry-item.json`. Voir [Format des éléments de registre](registry-item-format.md#résolution-des-références) |

| Option | Type | Valeur par défaut | Définit le champ |
|---|---|---|---|
| `--name <NAME>` | chaîne | obligatoire | `name` dans le contexte du template |
| `--image <IMAGE>` | chaîne | valeur par défaut du registre | `image` |
| `--replicas <REPLICAS>` | entier non signé 32 bits | valeur par défaut du registre | `replicas` |
| `--port <PORT>` | entier `0`–`65535` | valeur par défaut du registre | `port` |
| `--target-port <TARGET_PORT>` | entier `0`–`65535` | valeur par défaut du registre | `target_port` |
| `--namespace <NAMESPACE>` | chaîne | `project.default_namespace` | `namespace` |
| `--host <HOST>` | chaîne | valeur par défaut du registre | `host` |
| `--path <PATH>` | chaîne | valeur par défaut du registre | `path` |
| `--service <SERVICE>` | chaîne | valeur par défaut du registre | `service` |
| `--label <KEY=VALUE>` | clé/valeur, répétable | `app=<name>` | une entrée de `labels` |
| `--set <KEY=VALUE>` | clé/valeur, répétable | — | champ `KEY` |
| `--force` | option sans valeur | désactivée | Écrase les fichiers existants |

Priorité des champs, de la plus haute à la plus basse : `--set`, l'option dédiée (`--image`, `--port`, …), la valeur par défaut du registre. Un `--set` ultérieur pour la même clé l'emporte sur un précédent. `--label app=<value>` remplace le label `app` par défaut.

Les options dédiées définissent leur champ sur n'importe quel composant. Un champ que le composant ne déclare pas est tout de même transmis au template.

| Condition | Résultat |
|---|---|
| Aucun `kikx.toml` dans le répertoire courant | Sortie `1` : ``no kikx.toml found in <dir> — run `kikx init` first`` |
| Référence inconnue | Sortie `1` : `` `<reference>` isn't a built-in component, and isn't a URL or existing local file — run `kikx list` to see built-ins, or pass a URL/path to a registry-item.json `` |
| Champ obligatoire absent sans valeur par défaut | Sortie `1` : `--<field> is required for <reference>` |
| Le chemin rendu est absolu | Sortie `1` : ``refusing to write `<path>` — absolute paths are not allowed`` |
| Le chemin rendu sort du répertoire de sortie | Sortie `1` : ``refusing to write `<path>` — it escapes the target directory`` |
| Un fichier cible existe, sans `--force` | Sortie `1` : `<path> already exists — pass --force to overwrite`. Aucun fichier n'est écrit |
| Erreur de template | Sortie `1` avec le message du moteur de templates |

Sortie en cas de succès, une ligne par fichier :

```
Vendored /home/user/demo/infra/web-deployment.yaml
```

Exemple :

```bash
kikx add k8s/deployment --name web --image nginx:1.27 --replicas 3 --label tier=frontend --set port=8080
```

## `kikx list`

```
kikx list
```

Affiche chaque composant intégré avec ses champs. N'accepte aucune option en dehors de `--help`. N'a pas besoin de `kikx.toml`.

Chaque ligne de champ indique, le cas échéant : `required`, `default <value>` (omis pour une valeur par défaut vide), `e.g. <example>`, `one of <options>`.

```
Available components:

  k8s/deployment — Pods running one container image.
      --set image=…  (required; e.g. nginx:1.27)
      --set replicas=…  (default 1)
      --set port=…  (default 80)
```

La liste complète se trouve dans [Composants](components.md).

## `kikx presets`

```
kikx presets
```

Affiche chaque template de preset intégré avec son nom, son titre, son nombre de composants et sa description. N'accepte aucune option en dehors de `--help`. N'a pas besoin de `kikx.toml`.

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

Le nom de la première colonne est celui qu'acceptent [`setup`](#kikx-setup) et [`apply`](#kikx-apply). Les templates sont décrits dans [Format des presets](preset-format.md#templates-intégrés).

## `kikx setup`

```
kikx setup [OPTIONS] <REFERENCE>
```

Effectue le rendu de chaque composant d'un preset dans le répertoire de sortie du preset, puis écrit `kikx.toml`.

| Argument | Description |
|---|---|
| `<REFERENCE>` | Nom de template (voir [`kikx presets`](#kikx-presets)), URL (`http://` ou `https://`) ou chemin local vers un fichier de preset. Voir [Format des presets](preset-format.md#emplacement) |

| Option | Type | Valeur par défaut | Description |
|---|---|---|---|
| `--force` | option sans valeur | désactivée | Écrase un `kikx.toml` existant et les fichiers existants |

Valeurs tirées de l'objet `project` du preset :

| Clé de `kikx.toml` | Source | Lorsque `project` est absent |
|---|---|---|
| `name` | `project.name`, sinon le nom du répertoire courant | nom du répertoire courant |
| `default_namespace` | `project.namespace` (par défaut `default`) | `default` |
| `output_dir` | `project.outputDir` (par défaut `k8s`) | `k8s` |

| Condition | Résultat |
|---|---|
| `kikx.toml` existe, sans `--force` | Sortie `1`, rien n'est écrit |
| La référence n'est ni un nom de template, ni une URL, ni un fichier existant | Sortie `1` : `` `<reference>` isn't a template name, a URL or an existing local file — run `kikx presets` to see the templates `` |
| Le preset ne peut pas être analysé | Sortie `1` : `<reference> is not a valid kikx preset manifest` |
| Deux composants rendent le même chemin | Sortie `1` : ``two files rendered to the same path: `<path>` `` |
| Un fichier cible existe, sans `--force` | Sortie `1`, aucun fichier ni `kikx.toml` n'est écrit |

Sortie en cas de succès :

```
Initialized kikx project `multi-tier-platform` — wrote 77 file(s) to /home/user/demo/infra
  /home/user/demo/infra/edge-hetzner.tf
  ...
```

Exemple, en partant d'un template :

```bash
kikx setup single-server
```

## `kikx apply`

```
kikx apply [OPTIONS] <REFERENCE>
```

Effectue le rendu de chaque composant d'un preset dans le répertoire courant, ou dans `--into`. Ne lit ni n'écrit jamais `kikx.toml`. Le namespace est `project.namespace` du preset, sinon `default`. Le `project.outputDir` du preset n'est pas utilisé.

| Argument | Description |
|---|---|
| `<REFERENCE>` | Nom de template, URL ou chemin local vers un fichier de preset |

| Option | Type | Valeur par défaut | Description |
|---|---|---|---|
| `--into <INTO>` | chemin | répertoire courant | Répertoire dans lequel écrire, joint au répertoire courant |
| `--force` | option sans valeur | désactivée | Écrase les fichiers existants |

Les conditions d'erreur sont celles de [`setup`](#kikx-setup), sauf la vérification de `kikx.toml`.

Sortie en cas de succès :

```
Vendored 77 file(s):
  /home/user/repo/vendor/edge-hetzner.tf
  ...
```

Exemple, en ajoutant un template à un dépôt existant :

```bash
kikx apply k8s-web-app --into deploy/k8s
```

## Règles d'écriture

`add`, `setup` et `apply` valident chaque chemin rendu avant d'écrire le moindre fichier :

1. Les chemins absolus sont refusés.
2. Un chemin dont les composants `..` remontent, à un moment quelconque, au-dessus du répertoire cible est refusé.
3. Deux fichiers ayant le même chemin sont refusés.
4. Sans `--force`, tout fichier cible existant arrête l'opération avant la première écriture.

Les répertoires parents sont créés au besoin.

## Voir aussi

- [Votre premier projet avec la CLI](../tutorials/first-project-cli.md)
- [Partager un projet sous forme de preset](../how-to/presets.md)
- [Résoudre les conflits de fichiers et les vérifications](../how-to/resolve-conflicts.md)
- [Vendoriser de vrais fichiers](../explanation/vendoring.md)

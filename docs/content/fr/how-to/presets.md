# Partager un projet sous forme de preset

Un preset est un fichier `.kikx-preset.json` qui liste vos composants et les valeurs de leurs champs. N'importe qui peut en effectuer le rendu en vrais fichiers avec la CLI, ou le rouvrir dans le tableau de bord. kikx fournit aussi quelques presets prêts à l'emploi, appelés templates, pour démarrer.

## Démarrer depuis un template

Listez les templates :

```bash
kikx presets
```

Chaque entrée commence par le nom du template, par exemple `single-server` ou `k8s-web-app`. Passez ce nom partout où cette page utilise un fichier de preset :

```bash
kikx setup single-server
kikx apply k8s-web-app --into deploy/k8s
```

Dans le tableau de bord, allez sur la page d'accueil et cliquez sur une carte sous « Start from a template ». Le constructeur s'ouvre avec tous les composants du template chargés, prêts à être modifiés.

Les fichiers vous appartiennent dès lors. Rien ne les relie au template.

## Télécharger un preset depuis le tableau de bord

1. Construisez votre projet.
2. En bas du panneau « Project », cliquez sur « Download preset ».

Le navigateur enregistre `<project-name>.kikx-preset.json`. Le panneau affiche ensuite les deux commandes permettant de l'exécuter, avec des boutons de copie.

« Download .zip » dans l'en-tête est différent. Il vous donne les fichiers rendus eux-mêmes, pas une recette.

## Démarrer un nouveau projet depuis un preset

Dans un répertoire vide :

```bash
kikx setup ./platform.kikx-preset.json
```

`setup` écrit `kikx.toml` à partir du nom de projet, du namespace et du répertoire de sortie du preset, puis effectue le rendu de chaque composant dans ce répertoire de sortie. Ensuite, `kikx add` fonctionne normalement dans ce répertoire.

`setup` s'arrête si `kikx.toml` existe déjà. Passez `--force` pour écraser à la fois la configuration et les fichiers existants.

## Ajouter un preset à un dépôt existant

```bash
kikx apply ./platform.kikx-preset.json --into ops/ansible
```

`apply` ne crée ni ne lit jamais `kikx.toml`. Il écrit les fichiers sous `--into`, relativement au répertoire courant. Sans `--into`, les fichiers sont écrits directement dans le répertoire courant. Le répertoire de sortie du preset est ignoré.

Si un fichier cible existe déjà, `apply` n'écrit rien et indique le nom du fichier. Relancez avec `--force` pour écraser.

## Choisir entre setup et apply

| Vous voulez… | Utilisez |
|---|---|
| Démarrer un nouveau projet kikx, puis continuer à utiliser `kikx add` | `kikx setup` |
| Déposer les fichiers dans un dépôt existant, à l'emplacement de votre choix | `kikx apply --into <dir>` |

Les deux commandes effectuent à chaque fois un nouveau rendu de chaque composant à partir du registre : un preset bénéficie donc des corrections apportées aux templates. Les fichiers ne sont pas un instantané figé.

## Charger un preset depuis une URL

Les deux commandes acceptent aussi une URL :

```bash
kikx apply https://example.com/platform.kikx-preset.json --into infra
```

## Ouvrir un preset dans le tableau de bord

1. Allez sur la page d'accueil. Si vous êtes dans le constructeur, cliquez sur « Start over » dans l'en-tête.
2. Cliquez sur « Open a preset » et sélectionnez le fichier `.kikx-preset.json`.

Le tableau de bord effectue un nouveau rendu de chaque composant via le backend, puis ouvre le constructeur avec le projet chargé. Si le rendu d'un composant échoue, par exemple pour un élément de registre personnalisé que le backend ne peut pas atteindre, le preset ne s'ouvre pas et une erreur indique le problème.

Ouvrir un preset remplace le projet actuellement chargé dans le navigateur. Téléchargez d'abord ce que vous avez si vous voulez le conserver.

## Voir aussi

- [Format des presets](../reference/preset-format.md)
- [CLI](../reference/cli.md)
- [Templates intégrés](../reference/preset-format.md#templates-intégrés)

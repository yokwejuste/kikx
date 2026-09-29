# Configuration

Réglages lus par le backend, le tableau de bord et la CLI.

## Backend

Options de `kikx-backend` :

| Option | Variable d'environnement | Type | Valeur par défaut | Description |
|---|---|---|---|---|
| `--port <PORT>` | `KIKX_PORT` | entier `0`–`65535` | `4000` | Port d'écoute |
| `--bind <BIND>` | `KIKX_BIND` | hôte ou adresse IP | `127.0.0.1` | Adresse de liaison |
| `--allow-origin <ALLOW_ORIGIN>` | `KIKX_ALLOWED_ORIGINS` | liste d'origines séparées par des virgules | vide | Origines de navigateur autorisées par CORS. Vide autorise toute origine de boucle locale. Voir [API HTTP](http-api.md#cors) |
| `-h`, `--help` | — | — | — | Affiche l'aide |

`kikx-backend` n'a pas d'option `--version`.

`--allow-origin` accepte une liste séparée par des virgules et peut être répétée. Les espaces autour de chaque origine sont supprimés ; les entrées vides sont ignorées.

Au démarrage, le backend affiche :

```
kikx-backend listening on http://127.0.0.1:4000
```

### Priorité

De la plus haute à la plus basse :

1. Option de ligne de commande.
2. Variable d'environnement définie dans l'environnement du processus.
3. Variable d'environnement issue d'un fichier `.env`.
4. Valeur par défaut intégrée.

Le fichier `.env` est chargé avec `dotenvy` depuis le répertoire de travail, ou depuis le répertoire parent le plus proche qui en contient un. Il n'écrase jamais une variable déjà définie dans l'environnement. Une ligne que `dotenvy` ne sait pas analyser, par exemple une valeur sans guillemets contenant une espace, arrête le chargement à cette ligne sans erreur ; cette ligne et toutes les suivantes sont ignorées.

`backend/.env.example` :

```
KIKX_PORT=4000
KIKX_BIND=127.0.0.1
KIKX_ALLOWED_ORIGINS=
```

Une liste contenant des espaces doit être entre guillemets :

```
KIKX_ALLOWED_ORIGINS="https://a.example.com, https://b.example.com"
```

### Erreurs au démarrage

Code de sortie `1`, message sur stderr :

| Condition | Message |
|---|---|
| L'origine n'est pas une valeur d'en-tête valide | ``Error: invalid --allow-origin value `<origin>` `` |
| L'adresse ne peut pas être liée | `Error: failed to bind <bind>:<port>` |

Une valeur d'option invalide se termine avec le code `2`.

## Tableau de bord

| Variable | Obligatoire | Description |
|---|---|---|
| `NEXT_PUBLIC_KIKX_API_URL` | oui | URL de base du backend, sans `/api` |

Lue par Next.js depuis `web/.env.local` ou l'environnement. Lorsqu'elle n'est pas définie, chaque appel à l'API échoue avec le code `not_configured` et le message ``NEXT_PUBLIC_KIKX_API_URL is not set — point it at your kikx backend (see web/.env.example).``

`web/.env.example` :

```
NEXT_PUBLIC_KIKX_API_URL=http://localhost:4000
```

## CLI

La CLI ne lit aucune variable d'environnement. Elle lit `kikx.toml` depuis le répertoire courant pour [`kikx add`](cli.md#kikx-add).

## `kikx.toml`

Écrit par [`kikx init`](cli.md#kikx-init) et [`kikx setup`](cli.md#kikx-setup), lu par [`kikx add`](cli.md#kikx-add). Format TOML, une seule table.

```toml
[project]
name = "platform"
default_namespace = "platform"
output_dir = "infra"
```

| Clé | Type | Obligatoire | Valeur par défaut | Description |
|---|---|---|---|---|
| `project.name` | chaîne | oui | — | Nom du projet |
| `project.default_namespace` | chaîne | non | `default` | `namespace` dans le contexte du template lorsqu'aucun champ `namespace` n'est fourni |
| `project.output_dir` | chaîne | non | `k8s` | Répertoire, relatif à `kikx.toml`, auquel les chemins rendus sont joints |

Une table `[project]` ou une clé `name` absente échoue avec `failed to parse <path>/kikx.toml`.

## Valeurs par défaut du projet

Compilées dans `kikx-core` (`backend/core/src/config.rs`) et servies par [`GET /api/config`](http-api.md#get-apiconfig).

| Constante | Valeur | Clé de `/api/config` | Utilisée pour |
|---|---|---|---|
| `DEFAULT_NAMESPACE` | `default` | `defaultNamespace` | `kikx init --namespace`, `kikx.toml`, presets, `defaultNamespace` de `/api/render` |
| `DEFAULT_OUTPUT_DIR` | `k8s` | `defaultOutputDir` | `kikx init --dir`, `kikx.toml`, `project.outputDir` d'un preset, `kikx setup` |
| `DEFAULT_PROJECT_NAME` | `kikx-project` | `defaultProjectName` | Nom du projet lorsque le répertoire courant n'a pas de nom |

## Voir aussi

- [Lancer le tableau de bord et le backend](../how-to/run-the-dashboard.md)
- [Comment les éléments s'articulent](../explanation/project-layout.md)

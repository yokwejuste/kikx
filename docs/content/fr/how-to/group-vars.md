# Gérer les group vars en YAML ou en dossier

Suivez ce guide pour attribuer ses variables à un groupe d'inventaire, soit sous forme de simples paires clé/valeur, soit en YAML brut. Vous pouvez les écrire dans `group_vars/<group>.yml` ou dans `group_vars/<group>/main.yml`.

## Dans le tableau de bord

1. Dans « Build », choisissez « Group vars » sous l'étape Inventory.
2. Dans « Group », saisissez le nom du groupe ou choisissez-en un parmi les groupes de votre inventaire. `all` est toujours proposé.
3. Choisissez comment saisir les variables avec le sélecteur situé à côté de « Variables » :
   - « Key / value » : une ligne par variable. Cliquez sur « Add variable » pour en ajouter.
   - « YAML » : collez n'importe quel YAML, y compris des listes et des maps imbriquées. Il est écrit tel quel, ce qui en fait le moyen le plus simple de reprendre un fichier `group_vars` existant.
4. Pour la disposition en dossier, cochez « Folder layout (`group_vars/<group>/main.yml`) ». La ligne sous « Group » indique le chemin qui sera écrit.
5. Cliquez sur « Add to project ».

Lorsque vous passez de « Key / value » à « YAML », vos lignes sont copiées dans la zone YAML. Le retour en arrière ne fonctionne que si chaque ligne est un simple `key: value`. Si le YAML contient des valeurs imbriquées, le tableau de bord vous maintient en mode YAML pour que rien ne soit perdu.

## Avec la CLI

Passez les paires clé/valeur sous forme de map JSON dans `vars` :

```bash
kikx add ansible/group-vars --name web --set group=web \
  --set 'vars={"http_port": "8080", "app_env": "production"}'
```

Cette commande écrit `group_vars/web.yml` :

```yaml
---
app_env: production
http_port: 8080
```

Pour des données imbriquées, passez du YAML brut dans `yaml`, et ajoutez `layout=dir` pour la disposition en dossier :

```bash
kikx add ansible/group-vars --name db --set group=db --set layout=dir --set 'yaml=postgres_version: 16
postgres_databases:
  - name: app
    owner: app'
```

Cette commande écrit `group_vars/db/main.yml`. `--name` est obligatoire mais n'a aucun effet sur le chemin, qui dépend de `group` et de `layout`.

## Passer un groupe à la disposition en dossier

Si vous souhaitez ajouter plus tard d'autres fichiers à côté de `main.yml`, comme un `vault.yml`, passez le groupe à la disposition en dossier :

1. Ouvrez le composant group vars existant, cochez « Folder layout » et cliquez sur « Save changes ».
2. Avec la CLI, relancez `kikx add` avec `--set layout=dir`, puis supprimez vous-même l'ancien `group_vars/<group>.yml`. La CLI ne supprime jamais de fichiers.

## Quand les deux dispositions coexistent

Si un projet contient à la fois `group_vars/web.yml` et `group_vars/web/main.yml`, « Checks » affiche :

> Group "web" has both group_vars/web.yml and group_vars/web/main.yml

Ansible charge et fusionne les deux fichiers : la valeur d'une clé définie dans les deux dépend donc de l'ordre de chargement. Corrigez le problème en ne gardant qu'une disposition : ouvrez l'un des composants depuis la vérification, déplacez ses variables dans l'autre, puis supprimez-le.

« Checks » vous avertit également lorsque :

- un fichier de group vars vise un groupe qu'aucun inventaire ne définit, ce qui est généralement une faute de frappe ;
- une clé est définie à la fois dans les group vars et dans la section `[group:vars]` de l'inventaire, auquel cas la valeur des group vars l'emporte.

Consultez [Résoudre les conflits de fichiers et les vérifications](resolve-conflicts.md).

## Voir aussi

- [Composants](../reference/components.md)
- [Importer un inventaire Ansible existant](import-an-inventory.md)

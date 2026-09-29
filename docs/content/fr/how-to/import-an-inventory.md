# Importer un inventaire Ansible existant

Suivez ce guide lorsque vous disposez déjà d'un `inventory.ini` et que vous voulez que kikx le gère.

## Dans le tableau de bord

1. Dans « Build », choisissez « Inventory » sous l'étape Inventory. Pour remplacer un inventaire déjà ajouté, ouvrez plutôt celui-ci.
2. À côté de « Hosts », cliquez sur « Import inventory.ini ».
3. Collez le fichier dans la zone de texte, ou cliquez sur « Choose a file… » et sélectionnez-le.
4. Vérifiez le décompte affiché sous la zone de texte (par exemple `3 hosts · 3 groups`) et lisez les éventuels avertissements.
5. Cliquez sur « Replace hosts & groups ».
6. Donnez un « Name » à l'inventaire et cliquez sur « Add to project » (ou « Save changes »).

« Replace hosts & groups » écrase toutes les lignes d'hôtes et de groupes du formulaire. Il ne les fusionne pas avec ce qui s'y trouve déjà.

### Fusion des hôtes présents dans plusieurs groupes

Un hôte qui apparaît dans plusieurs sections devient une seule ligne d'hôte associée à plusieurs groupes :

```ini
[web]
web1 ansible_host=192.0.2.10 ansible_user=deploy

[monitored]
web1
```

On obtient une seule ligne `web1` dans les groupes `web` et `monitored`, avec l'adresse et l'utilisateur conservés. Lorsque kikx réécrit le fichier, les informations de connexion ne figurent que dans le premier groupe de l'hôte. Les groupes suivants ne listent que son nom.

Les sections `[group:children]` deviennent des groupes imbriqués, et les sections `[group:vars]` deviennent les variables de ce groupe.

### Avertissements possibles

| Avertissement | Que faire |
|---|---|
| `Line N: "…" is outside any [group] section — skipped.` | Placez l'hôte sous un en-tête `[group]`, ou ignorez l'avertissement si vous n'en aviez pas besoin. |
| `web1: ansible_host is "192.0.2.10" in one group but "192.0.2.11" in [db] — kept the first.` | Le même nom désigne deux machines. Renommez l'un des hôtes, ou corrigez l'adresse après l'import. |
| `web1 has no ansible_host — Ansible will try to resolve the name itself.` | Aucun problème si le nom se résout via le DNS. Sinon, ajoutez une adresse dans la ligne de l'hôte. |

Les lignes de commentaire commençant par `#` ou `;` sont ignorées et ne sont pas conservées.

Après l'import, ouvrez « Checks » pour repérer les problèmes entre composants. Consultez [Résoudre les conflits de fichiers et les vérifications](resolve-conflicts.md).

## Avec la CLI

La CLI reçoit l'inventaire en JSON dans le champ `hosts` : une liste de groupes, chacun avec `members`, `children` et `vars`.

```bash
kikx add ansible/inventory --name platform --set 'hosts=[
  {"group": "web", "members": [
    {"name": "web1", "ansible_host": "192.0.2.10"},
    {"name": "web2", "ansible_host": "192.0.2.11"}
  ]},
  {"group": "db", "members": [
    {"name": "db1", "ansible_host": "192.0.2.20", "ansible_user": "postgres"}
  ], "vars": {"ansible_python_interpreter": "/usr/bin/python3"}},
  {"group": "monitored", "members": [
    {"name": "web1", "ansible_host": null, "ansible_user": null, "ansible_port": null}
  ]},
  {"group": "platform", "children": ["web", "db"]}
]'
```

Cette commande écrit `platform-inventory.ini` :

```ini
[web]
web1 ansible_host=192.0.2.10 ansible_user=root ansible_port=22
web2 ansible_host=192.0.2.11 ansible_user=root ansible_port=22

[db]
db1 ansible_host=192.0.2.20 ansible_user=postgres ansible_port=22

[db:vars]
ansible_python_interpreter=/usr/bin/python3

[monitored]
web1

[platform:children]
web
db
```

Pour placer un hôte dans un second groupe, listez-le de nouveau avec `ansible_host`, `ansible_user` et `ansible_port` à `null`. Un `ansible_user` ou un `ansible_port` absent prend la valeur par défaut (`root` et `22`). Définissez une autre valeur par défaut avec `--set default_user=deploy` ou `--set default_port=2222`.

Ajoutez `--force` pour écraser un inventaire déjà ajouté.

## Voir aussi

- [Composants](../reference/components.md), pour tous les champs de l'inventaire
- [Gérer les group vars en YAML ou en dossier](group-vars.md)

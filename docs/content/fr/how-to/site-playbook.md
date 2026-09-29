# Relier les playbooks avec un playbook site

Suivez ce guide lorsque vous voulez un point d'entrée unique, `ansible-playbook site.yml`, qui exécute vos playbooks dans un ordre fixe.

## Dans le tableau de bord

1. Ajoutez d'abord vos playbooks. Consultez [Écrire un playbook à plusieurs plays avec des conditions de rôle](multi-play-playbooks.md).
2. Dans « Build », choisissez « Site playbook » sous l'étape Configure.
3. Réglez « Name » sur `site`. Le fichier est écrit sous la forme `<name>.yml`.
4. Sous « Imports, in run order », cliquez sur chaque playbook listé après « from this project: », ou cliquez sur « Add all » pour tous les importer.
5. Pour importer un playbook qui se trouve déjà dans votre dépôt et que kikx ne produit pas, cliquez sur « Add path ». Saisissez ensuite un nom d'étape et le chemin du playbook relativement à `site.yml`, par exemple `playbooks/legacy.yml`.
6. Réordonnez les lignes avec les flèches. `ansible-playbook` les exécute de haut en bas.
7. Cliquez sur « Add to project ».

« Checks » vous signale alors deux choses :

- un import qui pointe vers un playbook que ce projet ne produit pas. Ce n'est pas un problème si le fichier existe déjà dans votre dépôt.
- un playbook qu'aucun playbook site n'importe. Il ne s'exécute que si vous l'appelez directement.

## Avec la CLI

```bash
kikx add ansible/site --name site --set 'playbooks=[
  {"name": "Web tier", "path": "playbooks/web.yml"},
  {"name": "Database", "path": "playbooks/db.yml"}
]'
```

Cette commande écrit `site.yml` :

```yaml
---
- name: Web tier
  import_playbook: playbooks/web.yml
- name: Database
  import_playbook: playbooks/db.yml
```

Les chemins sont relatifs à `site.yml`, que kikx écrit à la racine du répertoire de sortie.

## Indiquer à Ansible l'inventaire et les rôles

Si vos playbooks se trouvent dans un sous-dossier comme `playbooks/`, Ansible cherche les rôles à côté de chaque playbook, et non dans le dossier `roles/` de la racine. Ajoutez à côté de `site.yml` un `ansible.cfg` qui pointe vers les rôles vendorisés et vers votre inventaire.

Dans le tableau de bord, choisissez « Ansible config » sous l'étape Configure, renseignez « Inventory file » avec votre inventaire, par exemple `platform-inventory.ini`, laissez « Roles path » à `roles`, puis cliquez sur « Add to project ».

Avec la CLI :

```bash
kikx add ansible/config --name ansible --set inventory=platform-inventory.ini
```

Cela écrit `ansible.cfg` :

```ini
[defaults]
inventory = platform-inventory.ini
roles_path = roles
```

Les [templates](presets.md#démarrer-depuis-un-template) intégrés qui contiennent de l'Ansible l'incluent déjà.

## L'exécuter

```bash
cd infra
ansible-playbook site.yml --syntax-check
ansible-playbook site.yml
```

Lancez ces commandes depuis le répertoire qui contient `ansible.cfg`. Ansible le cherche dans le répertoire courant, et non à côté du playbook.

## Voir aussi

- [Composants](../reference/components.md)
- [Résoudre les conflits de fichiers et les vérifications](resolve-conflicts.md)

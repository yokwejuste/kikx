# Générer les rôles utilisés par vos playbooks

Suivez ce guide lorsqu'un playbook référence des rôles qui n'existent pas encore et que vous voulez, pour chacun, un rôle vide et valide à compléter.

Un rôle généré comporte quatre fichiers :

```
roles/<name>/tasks/main.yml
roles/<name>/defaults/main.yml
roles/<name>/handlers/main.yml
roles/<name>/meta/main.yml
```

Le fichier de tâches contient une seule tâche `debug` provisoire, si bien que le rôle s'exécute immédiatement. Remplacez-la par vos vraies tâches.

## Générer tous les rôles manquants d'un coup (tableau de bord)

1. Ajoutez vos playbooks.
2. Ouvrez « Checks ». Pour chaque playbook qui utilise des rôles que kikx ne vendorise pas, une note s'affiche, par exemple :

   > web uses 3 roles kikx doesn't vendor

3. Cliquez sur « Scaffold 3 roles » dans cette note.

Un « Role skeleton » est ajouté pour chaque rôle manquant. La note disparaît, et les rôles apparaissent dans le projet et dans les suggestions de rôles.

Passez cette étape pour les rôles qui existent déjà sous `roles/` dans votre dépôt, ou qui proviennent d'Ansible Galaxy. La note est purement informative, et le téléchargement fonctionne sans elle.

## Générer un seul rôle (tableau de bord)

1. Dans « Build », choisissez « Role skeleton » sous l'étape Configure.
2. Renseignez « Name », qui doit correspondre au nom utilisé dans le playbook. Il peut contenir des lettres, des chiffres, `_`, `.` et `-`.
3. Si besoin, renseignez « Description », qui est écrite dans `meta/main.yml`.
4. Cliquez sur « Add to project ».

Pour un rôle avec de vraies tâches de départ (paquets de base, fuseau horaire, swap, motd), choisissez plutôt « Common role ».

## Générer un rôle avec la CLI

```bash
kikx add ansible/role --name nginx --set 'description=Serves the storefront'
```

Cette commande écrit les quatre fichiers sous `roles/nginx/`. `meta/main.yml` reçoit la description :

```yaml
---
galaxy_info:
  role_name: nginx
  description: Serves the storefront
dependencies: []
```

`defaults/main.yml` commence avec un unique `nginx_enabled: true`. Les tirets du nom du rôle deviennent des tirets bas dans la variable et dans `role_name`.

`kikx add` n'écrase pas un rôle que vous avez déjà commencé à remplir. Il s'arrête avec `already exists — pass --force to overwrite` ; ne passez donc `--force` que si vous voulez retrouver le squelette vide.

## Voir aussi

- [Écrire un playbook à plusieurs plays avec des conditions de rôle](multi-play-playbooks.md)
- [Composants](../reference/components.md)

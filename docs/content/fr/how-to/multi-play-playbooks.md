# Écrire un playbook à plusieurs plays avec des conditions de rôle

Suivez ce guide lorsqu'un même fichier de playbook doit exécuter des rôles différents sur des groupes différents, ou lorsqu'un rôle ne doit s'exécuter que sous une condition.

## Dans le tableau de bord

1. Dans « Build », choisissez « Playbook » sous l'étape Configure.
2. Renseignez « Name ». Réglez « Folder » sur `playbooks` si vous rangez vos playbooks dans un sous-dossier. Laissez-le vide pour écrire le fichier à la racine du projet.
3. Pour le premier play, renseignez :
   - « Name » : ce que fait le play, par exemple `Prepare every host`.
   - « Runs on (hosts) » : un groupe d'inventaire, `all`, ou un motif comme `web:db`. Les suggestions proviennent des groupes de votre inventaire.
   - « Roles, in the order they run » : saisissez le nom de chaque rôle et appuyez sur Entrée. Les rôles déjà présents dans le projet, ou utilisés par d'autres playbooks, sont suggérés.
4. Pour rendre un rôle conditionnel, dépliez « Role conditions (`when:`) » et saisissez une expression Jinja à côté de ce rôle, par exemple `enable_tls | default(false)`. Laissez le champ vide pour toujours exécuter le rôle.
5. Pour exécuter des tâches autour des rôles, dépliez « Pre-tasks & post-tasks ». Collez une liste YAML de tâches sous « Before the roles » ou « After the roles ». Elle est écrite telle quelle.
6. Si besoin, ajoutez des « Tags (optional) » et décochez « Run as root (become) » si le play ne doit pas élever ses privilèges.
7. Cliquez sur « Add play » pour le play suivant. Utilisez les flèches d'un play pour le réordonner.
8. Cliquez sur « Add to project ».

L'aperçu affiche le YAML rendu au fil de la saisie. Si un play vise un groupe absent de l'inventaire, « Checks » vous avertit.

## Avec la CLI

Passez les plays sous forme de liste JSON dans le champ `plays` :

```bash
kikx add ansible/playbook --name web --set folder=playbooks --set 'plays=[
  {
    "name": "Prepare every host",
    "hosts": "platform",
    "tags": ["base"],
    "pre_tasks": "- name: Refresh apt cache\n  ansible.builtin.apt:\n    update_cache: true\n",
    "roles": ["common"]
  },
  {
    "name": "Web tier",
    "hosts": "web",
    "become": false,
    "tags": ["web", "nginx"],
    "roles": ["nginx", {"role": "certbot", "when": "enable_tls | default(false)"}],
    "post_tasks": "- name: Check the site answers\n  ansible.builtin.uri:\n    url: http://localhost\n"
  }
]'
```

Cette commande écrit `playbooks/web.yml` :

```yaml
---
- name: Prepare every host
  hosts: platform
  become: true
  tags: [base]
  pre_tasks:
    - name: Refresh apt cache
      ansible.builtin.apt:
        update_cache: true
  roles:
    - common

- name: Web tier
  hosts: web
  tags: [web, nginx]
  roles:
    - nginx
    - role: certbot
      when: enable_tls | default(false)
  post_tasks:
    - name: Check the site answers
      ansible.builtin.uri:
        url: http://localhost
```

Quelques règles pour le JSON :

- Un rôle est soit un simple nom (`"nginx"`), soit un objet (`{"role": "certbot", "when": "..."}`) lorsqu'il a besoin d'une condition.
- `become` vaut `true` par défaut. Avec `"become": false`, le play n'a aucune ligne `become:`.
- `pre_tasks` et `post_tasks` sont des chaînes YAML. Gardez-les sans indentation : kikx les indente sous le play.

Utilisez `plays`, même pour un seul play. L'ancienne forme `--set hosts=... --set roles=[...]` fonctionne toujours, mais elle n'écrit qu'un seul play nommé d'après le composant, sans tags ni conditions sur les rôles.

## Dans un preset

Dans un preset, le même JSON est placé comme valeur de type chaîne de `fields.plays`. C'est exactement ce qu'écrit le tableau de bord lorsque vous cliquez sur « Download preset » :

```json
{
  "reference": "ansible/playbook",
  "name": "web",
  "fields": {
    "folder": "playbooks",
    "plays": "[{\"name\":\"Web tier\",\"hosts\":\"web\",\"become\":true,\"tags\":[],\"roles\":[\"nginx\",{\"role\":\"certbot\",\"when\":\"enable_tls | default(false)\"}]}]"
  },
  "labels": {}
}
```

## Étapes suivantes

- [Générer les rôles utilisés par vos playbooks](scaffold-roles.md)
- [Relier les playbooks avec un playbook site](site-playbook.md)
- [Composants](../reference/components.md)
- [Format des presets](../reference/preset-format.md)

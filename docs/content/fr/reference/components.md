# Composants

Les treize composants intégrés du registre kikx, générés à partir de `GET /api/registry`. Les composants et leurs champs sont aussi affichés par [`kikx list`](cli.md#kikx-list).

Chaque valeur de champ est une chaîne. Chaque template reçoit aussi `name`, `namespace` et `labels`, décrits dans [Format des éléments de registre](registry-item-format.md#contexte-du-template). Les chemins de sortie sont relatifs au répertoire cible et sont rendus avec le même contexte que le contenu des fichiers.

Une référence correspond à un composant intégré lorsque la partie qui suit son dernier `/` est égale au nom d'un composant intégré. Voir [Format des éléments de registre](registry-item-format.md#résolution-des-références).

## Résumé

| Référence | Titre | Description | Chemins de sortie |
|---|---|---|---|
| [`k8s/deployment`](#k8sdeployment) | Deployment | Pods running one container image. | `{{ name }}-deployment.yaml` |
| [`k8s/service`](#k8sservice) | Service | A stable address for pods. | `{{ name }}-service.yaml` |
| [`k8s/ingress`](#k8singress) | Ingress | Routes HTTP traffic to a service. | `{{ name }}-ingress.yaml` |
| [`terraform/digitalocean`](#terraformdigitalocean) | DigitalOcean Droplet | Terraform for one or more DigitalOcean droplets. | `{{ name }}-digitalocean.tf` |
| [`terraform/hetzner`](#terraformhetzner) | Hetzner Cloud Server | Terraform for one or more Hetzner Cloud servers. | `{{ name }}-hetzner.tf` |
| [`ansible/k8s-bootstrap`](#ansiblek8s-bootstrap) | Kubernetes Bootstrap | Installs containerd, kubelet, kubeadm and kubectl on target hosts. | `{{ name }}-k8s-bootstrap.yml` |
| [`ansible/inventory`](#ansibleinventory) | Inventory | Hosts, groups, nesting and shared vars for servers you already have. | `{{ name }}-inventory.ini` |
| [`ansible/group-vars`](#ansiblegroup-vars) | Group vars | Variables for one inventory group. | `group_vars/{{ group }}{% if layout == "dir" %}/main{% endif %}.yml` |
| [`ansible/common-role`](#ansiblecommon-role) | Common role | A starter host-hygiene role: base packages, timezone, swap, a templated motd. | `roles/{{ name }}/tasks/main.yml`<br>`roles/{{ name }}/defaults/main.yml`<br>`roles/{{ name }}/handlers/main.yml`<br>`roles/{{ name }}/templates/motd.j2` |
| [`ansible/role`](#ansiblerole) | Role skeleton | An empty role (tasks, defaults, handlers, meta) to fill in. | `roles/{{ name }}/tasks/main.yml`<br>`roles/{{ name }}/defaults/main.yml`<br>`roles/{{ name }}/handlers/main.yml`<br>`roles/{{ name }}/meta/main.yml` |
| [`ansible/playbook`](#ansibleplaybook) | Playbook | One or more plays, each running roles on an inventory group. | `{% if folder %}{{ folder }}/{% endif %}{{ name }}.yml` |
| [`ansible/site`](#ansiblesite) | Site playbook | The entry point that imports your playbooks in order. | `{{ name }}.yml` |
| [`ansible/config`](#ansibleconfig) | Ansible config | ansible.cfg pointing Ansible at your inventory and roles, so playbooks in subfolders find them. | `ansible.cfg` |

## `k8s/deployment`

| Propriété | Valeur |
|---|---|
| Titre | Deployment |
| Description | Pods running one container image. |
| Chemins de sortie | `{{ name }}-deployment.yaml` |
| Valeurs de repli du template | `labels` sont écrits dans `metadata.labels` ; `spec.selector.matchLabels` et le label du template de pod valent toujours `app: <name>` |

| Champ | Requis | Valeur par défaut | Exemple | Options | Description |
|---|---|---|---|---|---|
| `image` | oui | — | `nginx:1.27` | — | — |
| `replicas` | non | `1` | — | — | — |
| `port` | non | `80` | — | — | — |

## `k8s/service`

| Propriété | Valeur |
|---|---|
| Titre | Service |
| Description | A stable address for pods. |
| Chemins de sortie | `{{ name }}-service.yaml` |
| Valeurs de repli du template | `target_port` non défini : `targetPort` vaut `port` ; `spec.selector` vaut `labels`, qui inclut `app: <name>` sauf s'il est remplacé |

| Champ | Requis | Valeur par défaut | Exemple | Options | Description |
|---|---|---|---|---|---|
| `port` | non | `80` | — | — | — |
| `target_port` | non | — | — | — | Container port; defaults to the service port. |

## `k8s/ingress`

| Propriété | Valeur |
|---|---|
| Titre | Ingress |
| Description | Routes HTTP traffic to a service. |
| Chemins de sortie | `{{ name }}-ingress.yaml` |
| Valeurs de repli du template | `host` non défini : `<name>.example.com` ; `service` non défini : `<name>` ; `pathType` vaut toujours `Prefix` |

| Champ | Requis | Valeur par défaut | Exemple | Options | Description |
|---|---|---|---|---|---|
| `host` | non | — | `app.example.com` | — | — |
| `path` | non | `/` | — | — | — |
| `service` | non | — | — | — | Backend service; defaults to the ingress name. |
| `port` | non | `80` | — | — | — |

## `terraform/digitalocean`

| Propriété | Valeur |
|---|---|
| Titre | DigitalOcean Droplet |
| Description | Terraform for one or more DigitalOcean droplets. |
| Chemins de sortie | `{{ name }}-digitalocean.tf` |
| Valeurs de repli du template | Déclare la variable `do_token` (sensible) et un provider `digitalocean` ; ressource `digitalocean_droplet.<name>` nommée `<name>-${count.index}` |

| Champ | Requis | Valeur par défaut | Exemple | Options | Description |
|---|---|---|---|---|---|
| `region` | oui | — | `nyc3` | — | — |
| `size` | oui | — | `s-2vcpu-4gb` | — | — |
| `os_image` | oui | `ubuntu-24-04-x64` | — | `ubuntu-24-04-x64` (Ubuntu 24.04)<br>`ubuntu-22-04-x64` (Ubuntu 22.04)<br>`debian-13-x64` (Debian 13)<br>`fedora-44-x64` (Fedora 44)<br>`rockylinux-9-x64` (Rocky Linux 9)<br>`almalinux-9-x64` (AlmaLinux 9) | Any image slug the provider accepts; the list is a shortcut. |
| `count` | non | `1` | — | — | — |

## `terraform/hetzner`

| Propriété | Valeur |
|---|---|
| Titre | Hetzner Cloud Server |
| Description | Terraform for one or more Hetzner Cloud servers. |
| Chemins de sortie | `{{ name }}-hetzner.tf` |
| Valeurs de repli du template | Déclare la variable `hcloud_token` (sensible) et un provider `hcloud` ; ressource `hcloud_server.<name>` nommée `<name>-${count.index}` |

| Champ | Requis | Valeur par défaut | Exemple | Options | Description |
|---|---|---|---|---|---|
| `region` | oui | — | `fsn1` | — | — |
| `size` | oui | — | `cx22` | — | — |
| `os_image` | oui | `ubuntu-24.04` | — | `ubuntu-24.04` (Ubuntu 24.04)<br>`ubuntu-22.04` (Ubuntu 22.04)<br>`debian-12` (Debian 12)<br>`fedora-44` (Fedora 44)<br>`rocky-9` (Rocky Linux 9)<br>`alma-9` (AlmaLinux 9) | Any image slug the provider accepts; the list is a shortcut. |
| `count` | non | `1` | — | — | — |

## `ansible/k8s-bootstrap`

| Propriété | Valeur |
|---|---|
| Titre | Kubernetes Bootstrap |
| Description | Installs containerd, kubelet, kubeadm and kubectl on target hosts. |
| Chemins de sortie | `{{ name }}-k8s-bootstrap.yml` |
| Valeurs de repli du template | Installe `containerd`, puis `kubelet`, `kubeadm` et `kubectl` épinglés à `<k8s_version>*` avec `apt`, `become: true` |

| Champ | Requis | Valeur par défaut | Exemple | Options | Description |
|---|---|---|---|---|---|
| `hosts` | oui | — | — | — | An inventory group, or all. |
| `k8s_version` | oui | — | `1.31` | — | — |

## `ansible/inventory`

| Propriété | Valeur |
|---|---|
| Titre | Inventory |
| Description | Hosts, groups, nesting and shared vars for servers you already have. |
| Chemins de sortie | `{{ name }}-inventory.ini` |
| Champs à valeur JSON | [`hosts`](#hosts) |

| Champ | Requis | Valeur par défaut | Exemple | Options | Description |
|---|---|---|---|---|---|
| `hosts` | oui | — | — | — | — |
| `default_user` | non | `root` | — | — | SSH user written for hosts that don't set one (null on a host omits it). |
| `default_port` | non | `22` | — | — | SSH port written for hosts that don't set one (null on a host omits it). |

## `ansible/group-vars`

| Propriété | Valeur |
|---|---|
| Titre | Group vars |
| Description | Variables for one inventory group. |
| Chemins de sortie | `group_vars/{{ group }}{% if layout == "dir" %}/main{% endif %}.yml` |
| Valeurs de repli du template | `yaml` non vide : `vars` est ignoré |
| Champs à valeur JSON | [`vars`](#vars-yaml-et-layout) |

| Champ | Requis | Valeur par défaut | Exemple | Options | Description |
|---|---|---|---|---|---|
| `group` | oui | — | — | — | — |
| `vars` | non | — | — | — | JSON map of simple key/value pairs. |
| `yaml` | non | — | — | — | Raw YAML body, written as-is. |
| `layout` | non | `file` | — | `file` (group_vars/<group>.yml)<br>`dir` (group_vars/<group>/main.yml) | — |

## `ansible/common-role`

| Propriété | Valeur |
|---|---|
| Titre | Common role |
| Description | A starter host-hygiene role: base packages, timezone, swap, a templated motd. |
| Chemins de sortie | `roles/{{ name }}/tasks/main.yml`<br>`roles/{{ name }}/defaults/main.yml`<br>`roles/{{ name }}/handlers/main.yml`<br>`roles/{{ name }}/templates/motd.j2` |
| Valeurs de repli du template | `defaults/main.yml` définit `motd_message: "Managed by kikx"` ; la tâche de fuseau horaire utilise `community.general.timezone` |

| Champ | Requis | Valeur par défaut | Exemple | Options | Description |
|---|---|---|---|---|---|
| `timezone` | non | `UTC` | — | — | — |

## `ansible/role`

| Propriété | Valeur |
|---|---|
| Titre | Role skeleton |
| Description | An empty role (tasks, defaults, handlers, meta) to fill in. |
| Chemins de sortie | `roles/{{ name }}/tasks/main.yml`<br>`roles/{{ name }}/defaults/main.yml`<br>`roles/{{ name }}/handlers/main.yml`<br>`roles/{{ name }}/meta/main.yml` |
| Valeurs de repli du template | `description` vide : `meta/main.yml` utilise `The <name> role` ; `defaults/main.yml` définit `<name>_enabled: true`, avec `-` remplacé par `_` |

| Champ | Requis | Valeur par défaut | Exemple | Options | Description |
|---|---|---|---|---|---|
| `description` | non | `""` | — | — | — |

## `ansible/playbook`

| Propriété | Valeur |
|---|---|
| Titre | Playbook |
| Description | One or more plays, each running roles on an inventory group. |
| Chemins de sortie | `{% if folder %}{{ folder }}/{% endif %}{{ name }}.yml` |
| Valeurs de repli du template | `plays` non vide : `hosts` et `roles` sont ignorés ; voir [`plays`](#plays) |
| Champs à valeur JSON | [`plays`](#plays), [`roles`](#hosts-et-roles-hérités) |

| Champ | Requis | Valeur par défaut | Exemple | Options | Description |
|---|---|---|---|---|---|
| `hosts` | non | — | — | — | — |
| `roles` | non | — | — | — | — |
| `plays` | non | — | — | — | JSON list of plays: name, hosts, become, tags, roles, pre_tasks, post_tasks. |
| `folder` | non | — | `playbooks` | — | Where the file goes. Leave empty for the project root. |

## `ansible/site`

| Propriété | Valeur |
|---|---|
| Titre | Site playbook |
| Description | The entry point that imports your playbooks in order. |
| Chemins de sortie | `{{ name }}.yml` |
| Champs à valeur JSON | [`playbooks`](#playbooks) |

| Champ | Requis | Valeur par défaut | Exemple | Options | Description |
|---|---|---|---|---|---|
| `playbooks` | oui | — | — | — | — |

## `ansible/config`

| Propriété | Valeur |
|---|---|
| Titre | Ansible config |
| Description | ansible.cfg pointing Ansible at your inventory and roles, so playbooks in subfolders find them. |
| Chemins de sortie | `ansible.cfg` |
| Valeurs de repli du template | `inventory` vide : aucune ligne `inventory`. Le nom du composant n'est pas utilisé dans la sortie |

| Champ | Requis | Valeur par défaut | Exemple | Options | Description |
|---|---|---|---|---|---|
| `inventory` | non | — | `platform-inventory.ini` | — | — |
| `roles_path` | non | `roles` | — | — | — |

Exemple : `inventory=platform-inventory.ini` écrit `ansible.cfg` :

```ini
[defaults]
inventory = platform-inventory.ini
roles_path = roles
```

Ansible lit `ansible.cfg` dans le répertoire depuis lequel il est lancé. Depuis le répertoire de sortie, `ansible-playbook site.yml` utilise alors cet inventaire sans `-i`, et trouve les rôles dans `roles/`, même pour des playbooks situés dans un sous-dossier comme `playbooks/`.

## Formes des champs JSON

Une valeur de champ dont le premier caractère autre qu'une espace est `[` ou `{` et qui s'analyse comme du JSON est transmise au template sous forme de liste ou de map. Toute autre valeur, y compris du JSON invalide, est transmise sous forme de chaîne. Les clés des objets sont parcourues dans l'ordre alphabétique.

### `hosts`

Champ de [`ansible/inventory`](#ansibleinventory). Un tableau JSON d'objets groupe, écrits dans l'ordre du tableau.

| Clé | Type | Écrit sous la forme |
|---|---|---|
| `group` | chaîne | Nom de section `[<group>]`, `[<group>:children]`, `[<group>:vars]` |
| `members` | tableau d'objets hôte | Section `[<group>]`, une ligne par hôte. Omise si absente ou vide |
| `children` | tableau de chaînes | Section `[<group>:children]`, un nom de groupe par ligne. Omise si absente ou vide |
| `vars` | objet | Section `[<group>:vars]`, une ligne `key=value` par clé. Omise si absente ou vide |

Objet hôte :

| Clé | Type | Écrit sous la forme |
|---|---|---|
| `name` | chaîne | Premier élément de la ligne de l'hôte |
| `ansible_host` | chaîne | ` ansible_host=<value>` si non vide |
| `ansible_user` | chaîne ou `null` | Voir [Absent, null et vide](#absent-null-et-vide) |
| `ansible_port` | nombre, chaîne ou `null` | Voir [Absent, null et vide](#absent-null-et-vide) |
| `ssh_key_file` | chaîne | ` ansible_ssh_private_key_file=<value>` si non vide |
| `vars` | objet | ` key=value` par clé, après tous les autres éléments |

Un hôte listé dans plusieurs groupes est écrit dans chacun de ces groupes.

#### Absent, null et vide

| `ansible_user` sur l'hôte | Écrit |
|---|---|
| clé absente | ` ansible_user=<default_user>`, ou rien si `default_user` est vide |
| `null`, `""` ou `false` | rien |
| valeur non vide | ` ansible_user=<value>` |

`ansible_port` suit les mêmes règles avec `default_port`.

Exemple de valeur :

```json
[
  {"group": "web", "members": [
    {"name": "web-01", "ansible_host": "192.0.2.10"},
    {"name": "web-02", "ansible_host": "192.0.2.11", "ansible_user": null, "ansible_port": null},
    {"name": "web-03", "ansible_host": "192.0.2.12", "ansible_user": "deploy", "ansible_port": 2222,
     "ssh_key_file": "~/.ssh/id_ed25519", "vars": {"http_port": 8080}}
  ], "vars": {"ntp": "pool.ntp.org"}},
  {"group": "db", "members": [{"name": "db-01", "ansible_host": "198.51.100.5", "ansible_user": ""}]},
  {"group": "platform", "children": ["web", "db"], "vars": {"env": "prod"}}
]
```

Sortie avec les valeurs par défaut de `default_user` et `default_port` :

```ini
[web]
web-01 ansible_host=192.0.2.10 ansible_user=root ansible_port=22
web-02 ansible_host=192.0.2.11
web-03 ansible_host=192.0.2.12 ansible_user=deploy ansible_port=2222 ansible_ssh_private_key_file=~/.ssh/id_ed25519 http_port=8080

[web:vars]
ntp=pool.ntp.org

[db]
db-01 ansible_host=198.51.100.5 ansible_port=22

[platform:children]
web
db

[platform:vars]
env=prod
```

### `vars`, `yaml` et `layout`

Champs de [`ansible/group-vars`](#ansiblegroup-vars).

| Champ | Forme | Écrit sous la forme |
|---|---|---|
| `vars` | objet JSON | Une ligne `key: value` par clé, après `---` |
| `yaml` | chaîne | Écrit après `---`, sans les espaces de début et de fin. S'il n'est pas vide, `vars` est ignoré |
| `layout` | `file` ou `dir` | `dir` : `group_vars/<group>/main.yml`. Toute autre valeur : `group_vars/<group>.yml` |

Le chemin utilise le champ `group`, et non le nom du composant.

Exemple : `group=db`, `vars={"pg_version":16,"pg_port":5432}` écrit `group_vars/db.yml` :

```yaml
---
pg_port: 5432
pg_version: 16
```

### `plays`

Champ de [`ansible/playbook`](#ansibleplaybook). Un tableau JSON d'objets play, écrits dans l'ordre et séparés par une ligne vide.

| Clé | Type | Valeur par défaut | Écrit sous la forme |
|---|---|---|---|
| `name` | chaîne | nom du composant | `- name: <value>` |
| `hosts` | chaîne | — | `hosts: <value>`, tel quel |
| `become` | booléen | `true` | `become: true` si absent ou vrai. Aucune ligne si `false` |
| `tags` | tableau de chaînes | — | `tags: [a, b]`. Aucune ligne si absent ou vide |
| `pre_tasks` | chaîne de tâches YAML | — | Bloc `pre_tasks:`, sans espaces de début et de fin, indenté de 4 espaces. Aucun bloc si absent ou vide |
| `roles` | tableau d'entrées de rôle | — | Liste `roles:` |
| `post_tasks` | chaîne de tâches YAML | — | Bloc `post_tasks:` après `roles`, sans espaces de début et de fin, indenté de 4 espaces |

Entrée de rôle :

| Forme | Écrit sous la forme |
|---|---|
| `"common"` | `- common` |
| `{"role": "postgres"}` | `- role: postgres` |
| `{"role": "postgres", "when": "<expr>"}` | `- role: postgres` suivi de `when: <expr>` |

Exemple de valeur, avec le nom de composant `data` et `folder=playbooks` :

```json
[
  {"name": "Data tier", "hosts": "db", "become": false, "tags": ["data", "db"],
   "roles": ["common", {"role": "postgres", "when": "inventory_hostname == groups[\"db\"][0]"}],
   "pre_tasks": "- name: Wait\n  ansible.builtin.wait_for_connection:\n",
   "post_tasks": "- name: Done\n  ansible.builtin.debug:\n    msg: ok\n"},
  {"hosts": "web", "roles": ["nginx"]}
]
```

Sortie, `playbooks/data.yml` :

```yaml
---
- name: Data tier
  hosts: db
  tags: [data, db]
  pre_tasks:
    - name: Wait
      ansible.builtin.wait_for_connection:
  roles:
    - common
    - role: postgres
      when: inventory_hostname == groups["db"][0]
  post_tasks:
    - name: Done
      ansible.builtin.debug:
        msg: ok

- name: data
  hosts: web
  become: true
  roles:
    - nginx
```

### `hosts` et `roles` hérités

Champs de [`ansible/playbook`](#ansibleplaybook), utilisés lorsque `plays` est absent ou vide. Ils produisent un seul play nommé d'après le composant, avec `become: true`.

| Champ | Forme |
|---|---|
| `hosts` | chaîne |
| `roles` | tableau JSON de noms de rôles |

Exemple : le nom de composant `legacy`, `hosts=web`, `roles=["common","nginx"]` écrit `legacy.yml` :

```yaml
---
- name: legacy
  hosts: web
  become: true
  roles:
    - common
    - nginx
```

`plays` couvre tout ce que fait cette forme, avec en plus les noms, les tags, les conditions de rôle et plusieurs plays par fichier. Préférez-le pour les nouveaux playbooks.

### `playbooks`

Champ de [`ansible/site`](#ansiblesite). Un tableau JSON d'objets, écrits dans l'ordre.

| Clé | Type | Écrit sous la forme |
|---|---|---|
| `name` | chaîne | `- name: <value>` |
| `path` | chaîne | `import_playbook: <value>` |

Exemple : `[{"name":"Data","path":"playbooks/data.yml"},{"name":"Legacy","path":"legacy.yml"}]` écrit :

```yaml
---
- name: Data
  import_playbook: playbooks/data.yml
- name: Legacy
  import_playbook: legacy.yml
```

## Voir aussi

- [Écrire un playbook à plusieurs plays avec des conditions de rôle](../how-to/multi-play-playbooks.md)
- [Gérer les group vars en YAML ou en dossier](../how-to/group-vars.md)
- [Importer un inventaire Ansible existant](../how-to/import-an-inventory.md)
- [Relier les playbooks avec un playbook site](../how-to/site-playbook.md)
- [Le registre, source unique de vérité](../explanation/registry.md)

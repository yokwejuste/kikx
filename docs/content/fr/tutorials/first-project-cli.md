# Votre premier projet avec la CLI

Dans ce tutoriel, vous allez construire un petit projet d'infrastructure à partir d'un répertoire vide, en utilisant uniquement la ligne de commande `kikx`. À la fin, vous aurez :

- un inventaire Ansible avec deux groupes de serveurs et un groupe parent ;
- des group vars pour les deux groupes ;
- un playbook avec deux plays, dont l'un n'exécute un rôle que si une condition est remplie ;
- un point d'entrée `site.yml` et les trois rôles dont le playbook a besoin ;
- un `ansible.cfg` qui indique à Ansible où se trouvent l'inventaire et les rôles ;
- un Deployment Kubernetes et un Service qui le sélectionne ;

et vous aurez vérifié avec Ansible lui-même que l'inventaire se charge et que les playbooks sont analysés sans erreur.

Comptez environ quinze minutes.

## Avant de commencer

Il vous faut :

- une copie locale du dépôt kikx ;
- une chaîne d'outils Rust (`cargo`) ;
- [uv](https://docs.astral.sh/uv/), que vous utiliserez à la fin pour exécuter Ansible sans l'installer.

## Installer kikx

Depuis la racine de votre copie de kikx, compilez et installez la CLI :

```bash
cargo install --path cli
```

Vous devriez voir la sortie se terminer par ces lignes :

```text
  Installing …/.cargo/bin/kikx
   Installed package `kikx v0.0.1 (…/kikx/cli)` (executable `kikx`)
```

Vérifiez qu'elle fonctionne :

```bash
kikx --version
```

```text
kikx 0.0.1
```

## Créer le projet

Créez un nouveau répertoire vide pour le projet et placez-vous dedans. Tout le reste de ce tutoriel se passe à l'intérieur.

```bash
mkdir platform
cd platform
kikx init --name platform --dir infra
```

Vous devriez voir :

```text
Initialized kikx project `platform` — vendor components with `kikx add <category>/<component>` (see `kikx list`)
```

kikx a créé deux choses : un fichier `kikx.toml` et un répertoire `infra/` vide. Regardez le fichier :

```bash
cat kikx.toml
```

```toml
[project]
name = "platform"
default_namespace = "default"
output_dir = "infra"
```

`output_dir` est le répertoire de sortie : chaque fichier que vous ajouterez désormais y sera écrit.

## Voir ce que vous pouvez ajouter

```bash
kikx list
```

La sortie liste tous les composants que kikx connaît, avec les valeurs que chacun accepte. Vous devriez voir la partie que vous utiliserez en premier sous cette forme :

```text
  ansible/inventory — Hosts, groups, nesting and shared vars for servers you already have.
      --set hosts=…  (required)
      --set default_user=…  (default root)
      --set default_port=…  (default 22)
```

Tous les composants s'ajoutent de la même façon : `kikx add <category>/<name> --name <name>`, avec `--set key=value` pour leurs valeurs.

## Ajouter un inventaire

Votre plateforme compte deux serveurs web et un serveur de base de données. Ajoutez un inventaire qui les place dans un groupe `web` et un groupe `db`, imbrique ces deux groupes dans un groupe `platform`, et se connecte avec l'utilisateur `deploy` :

```bash
kikx add ansible/inventory --name platform --set default_user=deploy --set hosts='[
  {"group": "web", "members": [
    {"name": "web-01", "ansible_host": "192.0.2.10"},
    {"name": "web-02", "ansible_host": "192.0.2.11"}
  ]},
  {"group": "db", "members": [
    {"name": "db-01", "ansible_host": "198.51.100.20"}
  ]},
  {"group": "platform", "children": ["web", "db"], "vars": {"ansible_python_interpreter": "/usr/bin/python3"}}
]'
```

kikx vous indique le fichier qu'il a écrit. Il affiche le chemin complet, abrégé ici :

```text
Vendored …/platform/infra/platform-inventory.ini
```

Ouvrez-le :

```bash
cat infra/platform-inventory.ini
```

```ini
[web]
web-01 ansible_host=192.0.2.10 ansible_user=deploy ansible_port=22
web-02 ansible_host=192.0.2.11 ansible_user=deploy ansible_port=22

[db]
db-01 ansible_host=198.51.100.20 ansible_user=deploy ansible_port=22

[platform:children]
web
db

[platform:vars]
ansible_python_interpreter=/usr/bin/python3
```

C'est un inventaire Ansible ordinaire. Rien dedans ne renvoie à kikx : il vous appartient, vous pouvez le modifier, et il reste valide même si vous ne relancez jamais kikx. [Vendoriser de vrais fichiers](../explanation/vendoring.md) explique pourquoi kikx fonctionne ainsi.

## Ajouter des group vars

Donnez deux valeurs simples au groupe `web` :

```bash
kikx add ansible/group-vars --name web --set group=web --set vars='{"http_port": "8080", "server_name": "www.example.com"}'
```

Vous devriez voir :

```text
Vendored …/platform/infra/group_vars/web.yml
```

Les réglages de la base de données sont imbriqués : passez-les plutôt en YAML brut, et placez-les dans un dossier :

```bash
kikx add ansible/group-vars --name db --set group=db --set layout=dir --set yaml='postgres:
  version: 16
  max_connections: 200'
```

```text
Vendored …/platform/infra/group_vars/db/main.yml
```

Regardez les deux fichiers :

```bash
cat infra/group_vars/web.yml infra/group_vars/db/main.yml
```

```yaml
---
http_port: 8080
server_name: www.example.com
---
postgres:
  version: 16
  max_connections: 200
```

Le dossier `group_vars/` se trouve juste à côté de l'inventaire, là où Ansible le cherche.

## Ajouter un playbook avec deux plays

Indiquez maintenant ce qui s'exécute et où. Un seul playbook, `services`, reçoit deux plays : `nginx` sur les serveurs web, puis `postgres` et `backups` sur le serveur de base de données. Le rôle `backups` ne s'exécute que si `backups_enabled` est vrai, ce qui est le cas tant que personne ne le désactive :

```bash
kikx add ansible/playbook --name services --set folder=playbooks --set plays='[
  {"name": "Web tier", "hosts": "web", "tags": ["web"], "roles": ["nginx"]},
  {"name": "Database tier", "hosts": "db", "tags": ["db"], "roles": ["postgres", {"role": "backups", "when": "backups_enabled | default(true)"}]}
]'
```

```text
Vendored …/platform/infra/playbooks/services.yml
```

```bash
cat infra/playbooks/services.yml
```

Vous devriez voir :

```yaml
---
- name: Web tier
  hosts: web
  become: true
  tags: [web]
  roles:
    - nginx

- name: Database tier
  hosts: db
  become: true
  tags: [db]
  roles:
    - postgres
    - role: backups
      when: backups_enabled | default(true)
```

Chaque play cible un groupe de votre inventaire. `become: true` est écrit parce que vous ne l'avez pas désactivé.

## Ajouter le playbook site

`site.yml` est le point d'entrée unique qui importe vos playbooks dans l'ordre :

```bash
kikx add ansible/site --name site --set playbooks='[
  {"name": "Services", "path": "playbooks/services.yml"}
]'
```

```text
Vendored …/platform/infra/site.yml
```

```bash
cat infra/site.yml
```

```yaml
---
- name: Services
  import_playbook: playbooks/services.yml
```

## Ajouter les rôles

Le playbook exécute trois rôles qui n'existent pas encore. Ajoutez un squelette vide pour chacun :

```bash
kikx add ansible/role --name nginx
kikx add ansible/role --name postgres
kikx add ansible/role --name backups
```

Chaque commande écrit quatre fichiers. Pour `nginx`, vous devriez voir :

```text
Vendored …/platform/infra/roles/nginx/tasks/main.yml
Vendored …/platform/infra/roles/nginx/defaults/main.yml
Vendored …/platform/infra/roles/nginx/handlers/main.yml
Vendored …/platform/infra/roles/nginx/meta/main.yml
```

Regardez le fichier de tâches :

```bash
cat infra/roles/nginx/tasks/main.yml
```

```yaml
---
- name: Placeholder — replace with the real tasks for nginx
  ansible.builtin.debug:
    msg: "nginx ran on {{ inventory_hostname }}"
```

kikx vous fournit la structure ; c'est à vous d'écrire les tâches. La tâche provisoire fonctionne, si bien que le projet est exécutable tout de suite.

## Ajouter une configuration Ansible

Le playbook se trouve dans `playbooks/`, mais les rôles se trouvent dans `roles/`, à la racine de `infra/`. Ansible cherche les rôles à côté du playbook : il ne les trouverait donc pas tout seul. Un `ansible.cfg` lui indique où ils sont, ainsi que l'inventaire à utiliser :

```bash
kikx add ansible/config --name ansible --set inventory=platform-inventory.ini
```

```text
Vendored …/platform/infra/ansible.cfg
```

```bash
cat infra/ansible.cfg
```

```ini
[defaults]
inventory = platform-inventory.ini
roles_path = roles
```

`roles_path` a conservé sa valeur par défaut, `roles`.

## Ajouter un Deployment et un Service

La plateforme exécute aussi une application web sur Kubernetes. Ajoutez un Deployment avec deux réplicas de `nginx:1.27`, et un Service du même nom :

```bash
kikx add k8s/deployment --name web --image nginx:1.27 --replicas 2
kikx add k8s/service --name web
```

```text
Vendored …/platform/infra/web-deployment.yaml
Vendored …/platform/infra/web-service.yaml
```

Regardez les deux manifestes :

```bash
cat infra/web-deployment.yaml infra/web-service.yaml
```

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
  namespace: default
  labels:

    app: web

spec:
  replicas: 2
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: web
          image: nginx:1.27
          ports:
            - containerPort: 80
apiVersion: v1
kind: Service
metadata:
  name: web
  namespace: default
spec:
  selector:

    app: web

  ports:
    - port: 80
      targetPort: 80
      protocol: TCP
```

Remarquez `app: web` dans les deux : les pods portent ce label et le Service le sélectionne, car les deux prennent par défaut le nom que vous leur avez donné. Le namespace, `default`, vient de `kikx.toml`.

## Examiner le projet complet

```bash
find infra -type f | sort
```

Vous devriez voir :

```text
infra/ansible.cfg
infra/group_vars/db/main.yml
infra/group_vars/web.yml
infra/platform-inventory.ini
infra/playbooks/services.yml
infra/roles/backups/defaults/main.yml
infra/roles/backups/handlers/main.yml
infra/roles/backups/meta/main.yml
infra/roles/backups/tasks/main.yml
infra/roles/nginx/defaults/main.yml
infra/roles/nginx/handlers/main.yml
infra/roles/nginx/meta/main.yml
infra/roles/nginx/tasks/main.yml
infra/roles/postgres/defaults/main.yml
infra/roles/postgres/handlers/main.yml
infra/roles/postgres/meta/main.yml
infra/roles/postgres/tasks/main.yml
infra/site.yml
infra/web-deployment.yaml
infra/web-service.yaml
```

Vingt fichiers ordinaires, et un `kikx.toml` à côté.

## Vérifier avec Ansible

Assurez-vous maintenant qu'Ansible est d'accord. Placez-vous dans le répertoire de sortie :

```bash
cd infra
```

Demandez à Ansible de dessiner l'inventaire. `uvx` récupère `ansible-core` la première fois, ce qui prend un moment :

```bash
uvx --from ansible-core ansible-inventory -i platform-inventory.ini --graph
```

Vous devriez voir :

```text
@all:
  |--@ungrouped:
  |--@platform:
  |  |--@web:
  |  |  |--web-01
  |  |  |--web-02
  |  |--@db:
  |  |  |--db-01
```

Demandez ce qu'Ansible sait de `db-01` :

```bash
uvx --from ansible-core ansible-inventory -i platform-inventory.ini --host db-01
```

```json
{
    "ansible_host": "198.51.100.20",
    "ansible_port": 22,
    "ansible_python_interpreter": "/usr/bin/python3",
    "ansible_user": "deploy",
    "postgres": {
        "max_connections": 200,
        "version": 16
    }
}
```

L'hôte a récupéré son adresse depuis l'inventaire, l'interpréteur depuis `[platform:vars]`, et les réglages `postgres` depuis `group_vars/db/main.yml`.

Enfin, vérifiez que les playbooks sont analysés sans erreur et trouvent leurs rôles. Vous êtes dans le répertoire qui contient `ansible.cfg` : Ansible connaît donc déjà l'inventaire et le chemin des rôles :

```bash
uvx --from ansible-core ansible-playbook site.yml --syntax-check
```

```text

playbook: site.yml
```

Listez les tâches que chaque play exécuterait :

```bash
uvx --from ansible-core ansible-playbook site.yml --list-tasks
```

```text

playbook: site.yml

  play #1 (web): Web tier	TAGS: [web]
    tasks:
      nginx : Placeholder — replace with the real tasks for nginx	TAGS: [web]

  play #2 (db): Database tier	TAGS: [db]
    tasks:
      postgres : Placeholder — replace with the real tasks for postgres	TAGS: [db]
      backups : Placeholder — replace with the real tasks for backups	TAGS: [db]
```

Vous devriez voir les deux plays, dans l'ordre, chacun sur son groupe, avec le rôle conditionnel `backups` à sa place.

## Modifier quelque chose

Revenez à la racine du projet et passez l'application web à trois réplicas en ajoutant de nouveau le Deployment :

```bash
cd ..
kikx add k8s/deployment --name web --image nginx:1.27 --replicas 3
```

```text
Error: …/platform/infra/web-deployment.yaml already exists — pass --force to overwrite
```

kikx n'écrase jamais, sans qu'on le lui demande, un fichier que vous avez pu modifier. Demandez-le-lui :

```bash
kikx add k8s/deployment --name web --image nginx:1.27 --replicas 3 --force
grep replicas infra/web-deployment.yaml
```

Vous devriez voir :

```text
Vendored …/platform/infra/web-deployment.yaml
  replicas: 3
```

## Ce que vous avez fait

Vous avez créé un projet kikx, ajouté un inventaire, des group vars, un playbook à deux plays avec une condition de rôle, un playbook site, trois squelettes de rôles, une configuration Ansible ainsi qu'un Deployment et un Service Kubernetes, puis vous avez confirmé avec Ansible que l'inventaire se résout et que les playbooks sont analysés sans erreur. Chaque fichier est ordinaire et modifiable, et aucun ne dépend de kikx.

Essayez ensuite [Construire une plateforme Ansible dans le tableau de bord](platform-in-the-dashboard.md) pour construire le même genre de projet visuellement, avec des vérifications qui repèrent les erreurs au fur et à mesure.

Pour aller plus loin :

- démarrer le prochain projet depuis un template prêt à l'emploi : [Démarrer depuis un template](../how-to/presets.md#démarrer-depuis-un-template) ;
- toutes les commandes et options : [CLI](../reference/cli.md) ;
- tous les composants et les valeurs qu'ils acceptent : [Composants](../reference/components.md) ;
- pourquoi kikx écrit des fichiers au lieu d'installer un paquet : [Vendoriser de vrais fichiers](../explanation/vendoring.md) ;
- comment un composant devient un fichier : [Comment fonctionne le rendu](../explanation/rendering.md).

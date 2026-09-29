# Your first project with the CLI

In this tutorial you'll build a small infrastructure project from an empty directory, using only the
`kikx` command line. By the end you'll have:

- an Ansible inventory with two groups of servers and a parent group;
- group vars for both groups;
- a playbook with two plays, one of them running a role only when a condition holds;
- a `site.yml` entry point and the three roles the playbook needs;
- an `ansible.cfg` that tells Ansible where the inventory and roles are;
- a Kubernetes Deployment and a Service that selects it;

and you'll have checked with Ansible itself that the inventory loads and the playbooks parse.

It takes about fifteen minutes.

## Before you start

You need:

- a terminal on macOS, Linux or Windows;
- [uv](https://docs.astral.sh/uv/), which you'll use at the end to run Ansible without installing it.

## Install kikx

Download the archive for your platform from the [kikx releases page](https://github.com/yokwejuste/kikx/releases):

| Platform | Archive |
|-|-|
| macOS, Apple silicon | `kikx-<version>-macos-arm64.tar.gz` |
| macOS, Intel | `kikx-<version>-macos-x64.tar.gz` |
| Linux, x64 | `kikx-<version>-linux-x64.tar.gz` |
| Linux, arm64 | `kikx-<version>-linux-arm64.tar.gz` |
| Windows, x64 | `kikx-<version>-windows-x64.zip` |

Unpack it and put the `kikx` binary (`kikx.exe` on Windows) in a directory on your `PATH`.

If you have a Rust toolchain, you can build and install it from source instead:

```bash
cargo install --git https://github.com/yokwejuste/kikx kikx
```

Check that it runs:

```bash
kikx --version
```

```text
kikx 0.0.1
```

## Create the project

Make a new, empty directory for the project and move into it. Everything else in this tutorial
happens inside it.

```bash
mkdir platform
cd platform
kikx init --name platform --dir infra
```

You should see:

```text
Initialized kikx project `platform`. Vendor components with `kikx add <category>/<component>` (see `kikx list`)
```

kikx created two things: a `kikx.toml` file and an empty `infra/` directory. Look at the file:

```bash
cat kikx.toml
```

```toml
[project]
name = "platform"
default_namespace = "default"
output_dir = "infra"
```

`output_dir` is where every file you add from now on will be written.

## See what you can add

```bash
kikx list
```

The output lists every component kikx knows, with the values each one accepts. The part you'll use
first looks like this:

```text
  ansible/inventory: Hosts, groups, nesting and shared vars for servers you already have.
      --set hosts=…  (required)
      --set default_user=…  (default root)
      --set default_port=…  (default 22)
```

Every component is added the same way: `kikx add <category>/<name> --name <name>`, with
`--set key=value` for its values.

## Add an inventory

Your platform has two web servers and one database server. Add an inventory that puts them in a
`web` group and a `db` group, nests both under a `platform` group, and connects as the `deploy`
user:

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

kikx tells you which file it wrote. It prints the full path; it's shortened here:

```text
Vendored …/platform/infra/platform-inventory.ini
```

Open it:

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

This is a plain Ansible inventory. Nothing in it points back to kikx: it's yours to edit, and it
stays valid if you never run kikx again. [Vendoring real files](../explanation/vendoring.md)
explains why kikx works this way.

## Add group vars

Give the `web` group two simple values:

```bash
kikx add ansible/group-vars --name web --set group=web --set vars='{"http_port": "8080", "server_name": "www.example.com"}'
```

```text
Vendored …/platform/infra/group_vars/web.yml
```

The database settings are nested, so pass them as raw YAML instead, and put them in a folder:

```bash
kikx add ansible/group-vars --name db --set group=db --set layout=dir --set yaml='postgres:
  version: 16
  max_connections: 200'
```

```text
Vendored …/platform/infra/group_vars/db/main.yml
```

Look at both files:

```bash
cat infra/group_vars/web.yml infra/group_vars/db/main.yml
```

```yaml
http_port: 8080
server_name: www.example.com
postgres:
  version: 16
  max_connections: 200
```

The `group_vars/` folder sits right next to the inventory, which is where Ansible looks for it.

## Add a playbook with two plays

Now say what runs where. One playbook, `services`, gets two plays: `nginx` on the web servers, and
`postgres` then `backups` on the database server. The `backups` role only runs when
`backups_enabled` is true, which it is unless someone turns it off:

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

```yaml
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

Each play targets a group from your inventory. `become: true` is written because you didn't turn
it off.

## Add the site playbook

`site.yml` is the single entry point that imports your playbooks in order:

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
- name: Services
  import_playbook: playbooks/services.yml
```

## Add the roles

The playbook runs three roles that don't exist yet. Add an empty skeleton for each:

```bash
kikx add ansible/role --name nginx
kikx add ansible/role --name postgres
kikx add ansible/role --name backups
```

Each command writes four files. For `nginx`:

```text
Vendored …/platform/infra/roles/nginx/tasks/main.yml
Vendored …/platform/infra/roles/nginx/defaults/main.yml
Vendored …/platform/infra/roles/nginx/handlers/main.yml
Vendored …/platform/infra/roles/nginx/meta/main.yml
```

Look at the task file:

```bash
cat infra/roles/nginx/tasks/main.yml
```

```yaml
- name: Placeholder, replace with the real tasks for nginx
  ansible.builtin.debug:
    msg: "nginx ran on {{ inventory_hostname }}"
```

kikx gives you the structure; the tasks are yours to write. The placeholder is a working task, so
the project is runnable straight away.

## Add an Ansible config

The playbook lives in `playbooks/`, but the roles live in `roles/` at the top of `infra/`. Ansible
looks for roles next to the playbook, so it wouldn't find them on its own. An `ansible.cfg` tells it
where they are, and which inventory to use:

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

`roles_path` kept its default, `roles`.

## Add a Deployment and a Service

The platform also runs a web app on Kubernetes. Add a Deployment with two replicas of
`nginx:1.27`, and a Service with the same name:

```bash
kikx add k8s/deployment --name web --image nginx:1.27 --replicas 2
kikx add k8s/service --name web
```

```text
Vendored …/platform/infra/web-deployment.yaml
Vendored …/platform/infra/web-service.yaml
```

Look at the two manifests:

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

Notice `app: web` in both: the pods carry that label and the Service selects it, because both
default to the name you gave them. The namespace, `default`, comes from `kikx.toml`.

## Look at the whole project

```bash
find infra -type f | sort
```

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

Twenty ordinary files, and a `kikx.toml` next to them.

## Check it with Ansible

Now make sure Ansible agrees. Move into the output directory:

```bash
cd infra
```

Ask Ansible which hosts the `platform` group contains. `uvx` fetches `ansible-core` the first time, which takes a
moment:

```bash
uvx --from ansible-core ansible -i platform-inventory.ini platform --list-hosts
```

```text
  hosts (3):
    web-01
    web-02
    db-01
```

Ask what Ansible knows about `db-01`:

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

The host picked up its address from the inventory, the interpreter from `[platform:vars]`, and the
`postgres` settings from `group_vars/db/main.yml`.

Finally, check that the playbooks parse and find their roles. You're in the directory that holds
`ansible.cfg`, so Ansible already knows the inventory and the roles path:

```bash
uvx --from ansible-core ansible-playbook site.yml --syntax-check
```

```text

playbook: site.yml
```

List the tasks each play would run:

```bash
uvx --from ansible-core ansible-playbook site.yml --list-tasks
```

```text

playbook: site.yml

  play #1 (web): Web tier	TAGS: [web]
    tasks:
      nginx : Placeholder, replace with the real tasks for nginx	TAGS: [web]

  play #2 (db): Database tier	TAGS: [db]
    tasks:
      postgres : Placeholder, replace with the real tasks for postgres	TAGS: [db]
      backups : Placeholder, replace with the real tasks for backups	TAGS: [db]
```

Both plays, in order, each on its group, with the conditional `backups` role in place.

## Change something

Go back to the project root and scale the web app to three replicas by adding the Deployment again:

```bash
cd ..
kikx add k8s/deployment --name web --image nginx:1.27 --replicas 3
```

```text
Error: …/platform/infra/web-deployment.yaml already exists. Pass --force to overwrite
```

kikx never overwrites a file you might have edited without being told to. Tell it:

```bash
kikx add k8s/deployment --name web --image nginx:1.27 --replicas 3 --force
grep replicas infra/web-deployment.yaml
```

```text
Vendored …/platform/infra/web-deployment.yaml
  replicas: 3
```

## What you've done

You created a kikx project, added an inventory, group vars, a two-play playbook with a role
condition, a site playbook, three role skeletons, an Ansible config and a Kubernetes Deployment and
Service, then confirmed with Ansible that the inventory resolves and the playbooks parse. Every file
is plain and editable, and none of them depends on kikx.

Next, try [Build an Ansible platform in the dashboard](platform-in-the-dashboard.md) to build the
same kind of project visually, with checks that catch mistakes as you go.

When you want to know more:

- start the next project from a ready-made template: [Start from a template](../how-to/presets.md#start-from-a-template);
- every command and flag: [CLI reference](../reference/cli.md);
- every component and the values it accepts: [Components reference](../reference/components.md);
- why kikx writes files instead of installing a package: [Vendoring real files](../explanation/vendoring.md);
- how a component becomes a file: [How rendering works](../explanation/rendering.md).

# Components

The thirteen built-in components of the kikx registry, generated from `GET /api/registry`. Components and fields are also printed by [`kikx list`](cli.md#kikx-list).

Every field value is a string. Every template also receives `name`, `namespace` and `labels`, described in [Registry item format](registry-item-format.md#template-context). Output paths are relative to the target directory and are rendered with the same context as the file content.

A reference resolves to a built-in when the part after its last `/` equals a built-in name. See [Registry item format](registry-item-format.md#reference-resolution).

## Summary

| Reference | Title | Description | Output paths |
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

| Property | Value |
|---|---|
| Title | Deployment |
| Description | Pods running one container image. |
| Output paths | `{{ name }}-deployment.yaml` |
| Template fallbacks | `labels` are written to `metadata.labels`; `spec.selector.matchLabels` and the pod template label are always `app: <name>` |

| Field | Required | Default | Example | Options | Description |
|---|---|---|---|---|---|
| `image` | yes | — | `nginx:1.27` | — | — |
| `replicas` | no | `1` | — | — | — |
| `port` | no | `80` | — | — | — |

## `k8s/service`

| Property | Value |
|---|---|
| Title | Service |
| Description | A stable address for pods. |
| Output paths | `{{ name }}-service.yaml` |
| Template fallbacks | `target_port` unset: `targetPort` is `port`; `spec.selector` is `labels`, which includes `app: <name>` unless overridden |

| Field | Required | Default | Example | Options | Description |
|---|---|---|---|---|---|
| `port` | no | `80` | — | — | — |
| `target_port` | no | — | — | — | Container port; defaults to the service port. |

## `k8s/ingress`

| Property | Value |
|---|---|
| Title | Ingress |
| Description | Routes HTTP traffic to a service. |
| Output paths | `{{ name }}-ingress.yaml` |
| Template fallbacks | `host` unset: `<name>.example.com`; `service` unset: `<name>`; `pathType` is always `Prefix` |

| Field | Required | Default | Example | Options | Description |
|---|---|---|---|---|---|
| `host` | no | — | `app.example.com` | — | — |
| `path` | no | `/` | — | — | — |
| `service` | no | — | — | — | Backend service; defaults to the ingress name. |
| `port` | no | `80` | — | — | — |

## `terraform/digitalocean`

| Property | Value |
|---|---|
| Title | DigitalOcean Droplet |
| Description | Terraform for one or more DigitalOcean droplets. |
| Output paths | `{{ name }}-digitalocean.tf` |
| Template fallbacks | Declares variable `do_token` (sensitive) and a `digitalocean` provider; resource `digitalocean_droplet.<name>` named `<name>-${count.index}` |

| Field | Required | Default | Example | Options | Description |
|---|---|---|---|---|---|
| `region` | yes | — | `nyc3` | — | — |
| `size` | yes | — | `s-2vcpu-4gb` | — | — |
| `os_image` | yes | `ubuntu-24-04-x64` | — | `ubuntu-24-04-x64` (Ubuntu 24.04)<br>`ubuntu-22-04-x64` (Ubuntu 22.04)<br>`debian-13-x64` (Debian 13)<br>`fedora-44-x64` (Fedora 44)<br>`rockylinux-9-x64` (Rocky Linux 9)<br>`almalinux-9-x64` (AlmaLinux 9) | Any image slug the provider accepts; the list is a shortcut. |
| `count` | no | `1` | — | — | — |

## `terraform/hetzner`

| Property | Value |
|---|---|
| Title | Hetzner Cloud Server |
| Description | Terraform for one or more Hetzner Cloud servers. |
| Output paths | `{{ name }}-hetzner.tf` |
| Template fallbacks | Declares variable `hcloud_token` (sensitive) and an `hcloud` provider; resource `hcloud_server.<name>` named `<name>-${count.index}` |

| Field | Required | Default | Example | Options | Description |
|---|---|---|---|---|---|
| `region` | yes | — | `fsn1` | — | — |
| `size` | yes | — | `cx22` | — | — |
| `os_image` | yes | `ubuntu-24.04` | — | `ubuntu-24.04` (Ubuntu 24.04)<br>`ubuntu-22.04` (Ubuntu 22.04)<br>`debian-12` (Debian 12)<br>`fedora-44` (Fedora 44)<br>`rocky-9` (Rocky Linux 9)<br>`alma-9` (AlmaLinux 9) | Any image slug the provider accepts; the list is a shortcut. |
| `count` | no | `1` | — | — | — |

## `ansible/k8s-bootstrap`

| Property | Value |
|---|---|
| Title | Kubernetes Bootstrap |
| Description | Installs containerd, kubelet, kubeadm and kubectl on target hosts. |
| Output paths | `{{ name }}-k8s-bootstrap.yml` |
| Template fallbacks | Installs `containerd`, then `kubelet`, `kubeadm` and `kubectl` pinned to `<k8s_version>*` with `apt`, `become: true` |

| Field | Required | Default | Example | Options | Description |
|---|---|---|---|---|---|
| `hosts` | yes | — | — | — | An inventory group, or all. |
| `k8s_version` | yes | — | `1.31` | — | — |

## `ansible/inventory`

| Property | Value |
|---|---|
| Title | Inventory |
| Description | Hosts, groups, nesting and shared vars for servers you already have. |
| Output paths | `{{ name }}-inventory.ini` |
| JSON-valued fields | [`hosts`](#hosts) |

| Field | Required | Default | Example | Options | Description |
|---|---|---|---|---|---|
| `hosts` | yes | — | — | — | — |
| `default_user` | no | `root` | — | — | SSH user written for hosts that don't set one (null on a host omits it). |
| `default_port` | no | `22` | — | — | SSH port written for hosts that don't set one (null on a host omits it). |

## `ansible/group-vars`

| Property | Value |
|---|---|
| Title | Group vars |
| Description | Variables for one inventory group. |
| Output paths | `group_vars/{{ group }}{% if layout == "dir" %}/main{% endif %}.yml` |
| Template fallbacks | `yaml` non-empty: `vars` is ignored |
| JSON-valued fields | [`vars`](#vars-yaml-and-layout) |

| Field | Required | Default | Example | Options | Description |
|---|---|---|---|---|---|
| `group` | yes | — | — | — | — |
| `vars` | no | — | — | — | JSON map of simple key/value pairs. |
| `yaml` | no | — | — | — | Raw YAML body, written as-is. |
| `layout` | no | `file` | — | `file` (group_vars/<group>.yml)<br>`dir` (group_vars/<group>/main.yml) | — |

## `ansible/common-role`

| Property | Value |
|---|---|
| Title | Common role |
| Description | A starter host-hygiene role: base packages, timezone, swap, a templated motd. |
| Output paths | `roles/{{ name }}/tasks/main.yml`<br>`roles/{{ name }}/defaults/main.yml`<br>`roles/{{ name }}/handlers/main.yml`<br>`roles/{{ name }}/templates/motd.j2` |
| Template fallbacks | `defaults/main.yml` sets `motd_message: "Managed by kikx"`; the timezone task uses `community.general.timezone` |

| Field | Required | Default | Example | Options | Description |
|---|---|---|---|---|---|
| `timezone` | no | `UTC` | — | — | — |

## `ansible/role`

| Property | Value |
|---|---|
| Title | Role skeleton |
| Description | An empty role (tasks, defaults, handlers, meta) to fill in. |
| Output paths | `roles/{{ name }}/tasks/main.yml`<br>`roles/{{ name }}/defaults/main.yml`<br>`roles/{{ name }}/handlers/main.yml`<br>`roles/{{ name }}/meta/main.yml` |
| Template fallbacks | `description` empty: `meta/main.yml` uses `The <name> role`; `defaults/main.yml` sets `<name>_enabled: true` with `-` replaced by `_` |

| Field | Required | Default | Example | Options | Description |
|---|---|---|---|---|---|
| `description` | no | `""` | — | — | — |

## `ansible/playbook`

| Property | Value |
|---|---|
| Title | Playbook |
| Description | One or more plays, each running roles on an inventory group. |
| Output paths | `{% if folder %}{{ folder }}/{% endif %}{{ name }}.yml` |
| Template fallbacks | `plays` non-empty: `hosts` and `roles` are ignored; see [`plays`](#plays) |
| JSON-valued fields | [`plays`](#plays), [`roles`](#legacy-hosts-and-roles) |

| Field | Required | Default | Example | Options | Description |
|---|---|---|---|---|---|
| `hosts` | no | — | — | — | — |
| `roles` | no | — | — | — | — |
| `plays` | no | — | — | — | JSON list of plays: name, hosts, become, tags, roles, pre_tasks, post_tasks. |
| `folder` | no | — | `playbooks` | — | Where the file goes. Leave empty for the project root. |

## `ansible/site`

| Property | Value |
|---|---|
| Title | Site playbook |
| Description | The entry point that imports your playbooks in order. |
| Output paths | `{{ name }}.yml` |
| JSON-valued fields | [`playbooks`](#playbooks) |

| Field | Required | Default | Example | Options | Description |
|---|---|---|---|---|---|
| `playbooks` | yes | — | — | — | — |

## `ansible/config`

| Property | Value |
|---|---|
| Title | Ansible config |
| Description | ansible.cfg pointing Ansible at your inventory and roles, so playbooks in subfolders find them. |
| Output paths | `ansible.cfg` |
| Template fallbacks | `inventory` empty: no `inventory` line. The component name is not used in the output |

| Field | Required | Default | Example | Options | Description |
|---|---|---|---|---|---|
| `inventory` | no | — | `platform-inventory.ini` | — | — |
| `roles_path` | no | `roles` | — | — | — |

Example: `inventory=platform-inventory.ini` writes `ansible.cfg`:

```ini
[defaults]
inventory = platform-inventory.ini
roles_path = roles
```

Ansible reads `ansible.cfg` from the directory it is run in. From the output directory, `ansible-playbook site.yml` then uses that inventory without `-i`, and finds roles in `roles/` even for playbooks in a subfolder such as `playbooks/`.

## JSON field shapes

A field value whose first non-whitespace character is `[` or `{` and that parses as JSON is passed to the template as a list or map. Any other value, including invalid JSON, is passed as a string. Object keys are iterated in alphabetical order.

### `hosts`

Field of [`ansible/inventory`](#ansibleinventory). A JSON array of group objects, written in array order.

| Key | Type | Written as |
|---|---|---|
| `group` | string | Section name `[<group>]`, `[<group>:children]`, `[<group>:vars]` |
| `members` | array of host objects | `[<group>]` section, one line per host. Omitted when missing or empty |
| `children` | array of strings | `[<group>:children]` section, one group name per line. Omitted when missing or empty |
| `vars` | object | `[<group>:vars]` section, one `key=value` line per key. Omitted when missing or empty |

Host object:

| Key | Type | Written as |
|---|---|---|
| `name` | string | First token of the host line |
| `ansible_host` | string | ` ansible_host=<value>` when non-empty |
| `ansible_user` | string or `null` | See [Missing, null and empty](#missing-null-and-empty) |
| `ansible_port` | number, string or `null` | See [Missing, null and empty](#missing-null-and-empty) |
| `ssh_key_file` | string | ` ansible_ssh_private_key_file=<value>` when non-empty |
| `vars` | object | ` key=value` per key, after all other tokens |

A host listed under several groups is written in each of those groups.

#### Missing, null and empty

| `ansible_user` on the host | Written |
|---|---|
| key missing | ` ansible_user=<default_user>`, or nothing when `default_user` is empty |
| `null`, `""` or `false` | nothing |
| non-empty value | ` ansible_user=<value>` |

`ansible_port` follows the same rules with `default_port`.

Example value:

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

Output with the default `default_user` and `default_port`:

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

### `vars`, `yaml` and `layout`

Fields of [`ansible/group-vars`](#ansiblegroup-vars).

| Field | Shape | Written as |
|---|---|---|
| `vars` | JSON object | One `key: value` line per key, after `---` |
| `yaml` | string | Written after `---` with leading and trailing whitespace trimmed. When non-empty, `vars` is ignored |
| `layout` | `file` or `dir` | `dir`: `group_vars/<group>/main.yml`. Any other value: `group_vars/<group>.yml` |

The path uses the `group` field, not the component name.

Example: `group=db`, `vars={"pg_version":16,"pg_port":5432}` writes `group_vars/db.yml`:

```yaml
---
pg_port: 5432
pg_version: 16
```

### `plays`

Field of [`ansible/playbook`](#ansibleplaybook). A JSON array of play objects, written in order and separated by a blank line.

| Key | Type | Default | Written as |
|---|---|---|---|
| `name` | string | component name | `- name: <value>` |
| `hosts` | string | — | `hosts: <value>`, verbatim |
| `become` | boolean | `true` | `become: true` when missing or truthy. No line when `false` |
| `tags` | array of strings | — | `tags: [a, b]`. No line when missing or empty |
| `pre_tasks` | string of YAML tasks | — | `pre_tasks:` block, trimmed and indented by 4 spaces. No block when missing or empty |
| `roles` | array of role entries | — | `roles:` list |
| `post_tasks` | string of YAML tasks | — | `post_tasks:` block after `roles`, trimmed and indented by 4 spaces |

Role entry:

| Form | Written as |
|---|---|
| `"common"` | `- common` |
| `{"role": "postgres"}` | `- role: postgres` |
| `{"role": "postgres", "when": "<expr>"}` | `- role: postgres` followed by `when: <expr>` |

Example value, with component name `data` and `folder=playbooks`:

```json
[
  {"name": "Data tier", "hosts": "db", "become": false, "tags": ["data", "db"],
   "roles": ["common", {"role": "postgres", "when": "inventory_hostname == groups[\"db\"][0]"}],
   "pre_tasks": "- name: Wait\n  ansible.builtin.wait_for_connection:\n",
   "post_tasks": "- name: Done\n  ansible.builtin.debug:\n    msg: ok\n"},
  {"hosts": "web", "roles": ["nginx"]}
]
```

Output, `playbooks/data.yml`:

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

### Legacy `hosts` and `roles`

Fields of [`ansible/playbook`](#ansibleplaybook), used when `plays` is missing or empty. They produce one play named after the component, with `become: true`.

| Field | Shape |
|---|---|
| `hosts` | string |
| `roles` | JSON array of role names |

Example: component name `legacy`, `hosts=web`, `roles=["common","nginx"]` writes `legacy.yml`:

```yaml
---
- name: legacy
  hosts: web
  become: true
  roles:
    - common
    - nginx
```

`plays` covers everything this form does, plus names, tags, role conditions and several plays per file. Prefer it for new playbooks.

### `playbooks`

Field of [`ansible/site`](#ansiblesite). A JSON array of objects, written in order.

| Key | Type | Written as |
|---|---|---|
| `name` | string | `- name: <value>` |
| `path` | string | `import_playbook: <value>` |

Example: `[{"name":"Data","path":"playbooks/data.yml"},{"name":"Legacy","path":"legacy.yml"}]` writes:

```yaml
---
- name: Data
  import_playbook: playbooks/data.yml
- name: Legacy
  import_playbook: legacy.yml
```

## See also

- [Write a multi-play playbook with role conditions](../how-to/multi-play-playbooks.md)
- [Manage group vars as YAML or a folder](../how-to/group-vars.md)
- [Import an existing Ansible inventory](../how-to/import-an-inventory.md)
- [Wire playbooks together with a site playbook](../how-to/site-playbook.md)
- [The registry as single source of truth](../explanation/registry.md)

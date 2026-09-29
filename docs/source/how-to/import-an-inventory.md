# Import an existing Ansible inventory

Use this when you already have an `inventory.ini` and want kikx to manage it.

## In the dashboard

1. In **Build**, pick **Inventory** under the Inventory stage. To replace an inventory you already added, open that one instead.
2. Next to **Hosts**, click **Import inventory.ini**.
3. Paste the file into the text box, or click **Choose a file…** and pick it.
4. Check the count under the text box (for example `3 hosts · 3 groups`) and read any warnings.
5. Click **Replace hosts & groups**.
6. Give the inventory a **Name** and click **Add to project** (or **Save changes**).

**Replace hosts & groups** overwrites every host and group row in the form. It doesn't merge them with what's already there.

### How hosts in several groups are merged

A host that appears in several sections becomes one host row with several groups:

```ini
[web]
web1 ansible_host=192.0.2.10 ansible_user=deploy

[monitored]
web1
```

This gives one `web1` row in groups `web` and `monitored`, with the address and user kept. When kikx writes the file back, the connection details go on the host's first group only. Later groups list just the name.

`[group:children]` sections become nested groups, and `[group:vars]` sections become that group's vars.

### Warnings you may see

| Warning | What to do |
|-|-|
| `Line N: "…" is outside any [group] section, so it was skipped.` | Put the host under a `[group]` header, or ignore it if you didn't need it. |
| `web1: ansible_host is "192.0.2.10" in one group but "192.0.2.11" in [db]. Kept the first.` | The same name points at two machines. Rename one of the hosts, or fix the address after the import. |
| `web1 has no ansible_host. Ansible will try to resolve the name itself.` | Fine if the name resolves in DNS. Otherwise, add an address in the host row. |

Comment lines starting with `#` or `;` are ignored and aren't kept.

After the import, open **Checks** to catch problems across components. See [Resolve file conflicts and checks](resolve-conflicts.md).

## With the CLI

The CLI takes the inventory as JSON in the `hosts` field: a list of groups, each with `members`, `children` and `vars`.

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

This writes `platform-inventory.ini`:

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

To put a host in a second group, list it again with `ansible_host`, `ansible_user` and `ansible_port` set to `null`. A missing `ansible_user` or `ansible_port` gets the default (`root` and `22`). Set a different default with `--set default_user=deploy` or `--set default_port=2222`.

Add `--force` to overwrite an inventory you already added.

## See also

- [Components reference](../reference/components.md) for every inventory field
- [Manage group vars as YAML or a folder](group-vars.md)

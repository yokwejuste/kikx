# Resolve file conflicts and checks

Use this when the dashboard stops you with **This file already exists**, or when the **Checks** tab shows a count.

## A file already exists

A project allows only one component per file. If the component you're saving would write a file another component already writes, the dashboard shows the conflict before it saves:

- With the form still open, the save bar warns you: *Saving replaces `<file>`, currently from `<component>`*.
- When you click **Add to project** or **Save changes**, a dialog opens titled **This file already exists** (or **N files already exist**).

In the dialog:

1. Expand a file to compare the **Current** and **Incoming** content side by side. The row says **same content** or **content differs**.
2. Read the **Also removed with that component:** line, if there is one. Replacing removes the *whole* owning component, including its other files.
3. Choose one:
   - **Keep existing**: nothing changes. Rename your new component (for example, give the role or playbook a different **Name**) and save again.
   - **Replace**: the owning component is removed and yours takes its files. This can't be undone. To get the old component back, add it again.

Editing a component and saving it under the same name replaces it in place, without a dialog.

### The same thing with the CLI

The CLI refuses instead of asking, and writes nothing:

- `kikx add` and `kikx apply` stop with `<file> already exists. Pass --force to overwrite`. Re-run with `--force` to overwrite. The files you don't re-render stay on disk.
- A preset where two components render the same path stops with ``two files rendered to the same path: `<file>` ``. Rename one of them in the preset.

## Fix what Checks reports

Open **Checks** from the header, or click **Review** in the **Project** panel. Each item has **Open …** buttons that take you straight to the component to fix. When you edit a component, its own checks also appear at the top of the editor, with the same **Open …** and **Scaffold N roles** buttons. Errors break the output, warnings are probably mistakes, and notes are informational.

### Errors

| Check | Fix |
|-|-|
| `2 components write <file>` | Only the last one survives in the download. Remove one of them, or rename it. This usually comes from a preset you opened. |
| `<host> has two addresses: <a> and <b>` | Two inventories, or two groups, give the same host name different `ansible_host` values. Rename one host, or correct the address. |
| `Group nesting loops: a → b → a` | Remove one of the `:children` entries so the groups no longer contain each other. Ansible refuses to load a cycle. |

### Warnings

| Check | Fix |
|-|-|
| `[<parent>:children] lists "<group>", which has no hosts` | Fix the typo in the child group's name, or add hosts to that group. |
| `<host> sets ansible_user=<a>, overriding [<group>:vars] ansible_user=<b>` (also `ansible_port`) | Clear the value on the host if the group's value is the one you want. Host vars win. |
| `Group "<g>" has both group_vars/<g>.yml and group_vars/<g>/main.yml` | Keep one layout. See [Manage group vars](group-vars.md#when-both-layouts-exist). |
| `group_vars/<g>.yml targets a group no inventory defines` | Correct the group name so it matches an inventory group. Otherwise the vars never load. |
| `<key> is set in both [<g>:vars] and group_vars/<g>.yml` | Keep the key in one place. The group vars file wins. |
| `Play "<name>" targets "<group>", which isn't in the inventory` | Correct **Runs on (hosts)**, or add the group to the inventory. Otherwise the play matches no hosts. |
| `site.yml imports <path>, which this project doesn't produce` | Ignore it if the playbook already exists in your repo. Otherwise, add that playbook or fix the path. |
| `Service <name> selects app=<name>, but no deployment has that label` | Give the Deployment the same name as the Service, or set the same `app` label on both. |
| `Ingress <name> routes to service "<svc>", which isn't in the project` | Add a Service with that name, or correct **Backend service**. |

### Notes

| Check | What to do |
|-|-|
| `<playbook> uses N roles kikx doesn't vendor` | Click **Scaffold N roles**, or ignore it if the roles already exist in your repo. See [Scaffold roles](scaffold-roles.md). |
| `<path> isn't imported by any site playbook` | Add it to the site playbook if it should run as part of `site.yml`. |
| `N inventories in this project` | Fine for separate environments. Checks treat all their groups as one pool, so pass the right one with `-i`. |

The checks only run in the dashboard. The CLI doesn't run them.

## See also

- [Checks reference](../reference/checks.md) for the exact rules
- [Vendoring real files](../explanation/vendoring.md)

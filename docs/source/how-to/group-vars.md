# Manage group vars as YAML or a folder

Use this to give an inventory group its variables, either as simple key/value pairs or as raw YAML. You can write them to `group_vars/<group>.yml` or to `group_vars/<group>/main.yml`.

## In the dashboard

1. In **Build**, pick **Group vars** under the Inventory stage.
2. In **Group**, type the group name, or pick one from your inventory's groups. `all` is always offered.
3. Choose how to enter the variables with the toggle next to **Variables**:
   - **Key / value**: one row per variable. Click **Add variable** for more.
   - **YAML**: paste anything YAML, including lists and nested maps. Your keys, order and comments are kept; only indentation and spacing are tidied when you paste or leave the editor, and mistakes such as a duplicate key or a tab used for indentation are underlined as you type. This makes it the easiest way to bring over an existing `group_vars` file.
4. For the folder layout, tick **Folder layout (`group_vars/<group>/main.yml`)**. The line under **Group** shows the path that will be written.
5. Click **Add to project**.

When you switch from **Key / value** to **YAML**, your rows are copied into the YAML box. Switching back only works when every line is a flat `key: value`. If the YAML has nested values, the dashboard keeps you in YAML mode so nothing is lost.

## With the CLI

Pass key/value pairs as a JSON map in `vars`:

```bash
kikx add ansible/group-vars --name web --set group=web \
  --set 'vars={"http_port": "8080", "app_env": "production"}'
```

This writes `group_vars/web.yml`:

```yaml
app_env: production
http_port: 8080
```

For nested data, pass raw YAML in `yaml`, and add `layout=dir` for the folder layout:

```bash
kikx add ansible/group-vars --name db --set group=db --set layout=dir --set 'yaml=postgres_version: 16
postgres_databases:
  - name: app
    owner: app'
```

This writes `group_vars/db/main.yml`. `--name` is required but doesn't affect the path, which comes from `group` and `layout`.

## Move a group to the folder layout

If you want to add more files next to `main.yml` later, such as a `vault.yml`, move the group to the folder layout:

1. Open the existing group vars component, tick **Folder layout**, and click **Save changes**.
2. With the CLI, re-run `kikx add` with `--set layout=dir`, then delete the old `group_vars/<group>.yml` yourself. The CLI never removes files.

## When both layouts exist

If a project has both `group_vars/web.yml` and `group_vars/web/main.yml`, **Checks** shows:

> Group "web" has both group_vars/web.yml and group_vars/web/main.yml

Ansible loads and merges both files, so a key set in both depends on load order. Fix it by keeping one layout: open one of the components from the check, move its variables into the other, then remove it.

**Checks** also warns when:

- a group vars file targets a group that no inventory defines, which is usually a typo;
- a key is set both in group vars and in the inventory's `[group:vars]`, where the group vars value wins.

See [Resolve file conflicts and checks](resolve-conflicts.md).

## See also

- [Components reference](../reference/components.md)
- [Import an existing Ansible inventory](import-an-inventory.md)

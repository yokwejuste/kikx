# Scaffold the roles your playbooks use

Use this when a playbook references roles that don't exist yet and you want an empty, valid role to fill in for each one.

A scaffolded role has four files:

```
roles/<name>/tasks/main.yml
roles/<name>/defaults/main.yml
roles/<name>/handlers/main.yml
roles/<name>/meta/main.yml
```

The task file holds a single placeholder `debug` task, so the role runs straight away. Replace it with your real tasks.

## Scaffold every missing role at once (dashboard)

1. Add your playbooks.
2. Open **Checks**. For each playbook that uses roles kikx doesn't vendor, there's a note such as:

   > web uses 3 roles kikx doesn't vendor

3. Click **Scaffold 3 roles** on that note.

This adds one **Role skeleton** per missing role. The note disappears, and the roles appear in the project and in role suggestions.

Skip this for roles that already exist under `roles/` in your repo, or that come from Ansible Galaxy. The note is only informational, and the download works without it.

## Scaffold one role (dashboard)

1. In **Build**, pick **Role skeleton** under the Configure stage.
2. Fill in **Name**, which must match the name used in the playbook. It can contain letters, digits, `_`, `.` and `-`.
3. Optionally fill in **Description**, which goes into `meta/main.yml`.
4. Click **Add to project**.

For a role with real starter tasks (base packages, timezone, swap, motd), pick **Common role** instead; it sits under **Show more** in the Configure stage.

## Scaffold a role with the CLI

```bash
kikx add ansible/role --name nginx --set 'description=Serves the storefront'
```

This writes the four files under `roles/nginx/`. `meta/main.yml` gets the description:

```yaml
galaxy_info:
  role_name: nginx
  description: Serves the storefront
dependencies: []
```

`defaults/main.yml` starts with a single `nginx_enabled: true`. Dashes in the role name become underscores in the variable and in `role_name`.

`kikx add` won't overwrite a role you've already started filling in. It stops with `already exists. Pass --force to overwrite`, so only pass `--force` if you want the empty skeleton back.

## See also

- [Write a multi-play playbook with role conditions](multi-play-playbooks.md)
- [Components reference](../reference/components.md)

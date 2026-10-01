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

## Scaffold every missing role at once

::::{tab-set}

:::{tab-item} In the app
:sync: app

1. Add your playbooks.
2. Open **Checks**. For each playbook that uses roles kikx doesn't vendor, there's a note such as:

   > web uses 3 roles kikx doesn't vendor

3. Click **Scaffold 3 roles** on that note.

```{image} ../images/web/checks-missing-role.webp
:alt: The Checks tab with one note, web uses 1 role kikx doesn't vendor, and the buttons Scaffold 1 role and Open web
:class: only-light
```

```{image} ../images/web/checks-missing-role-dark.webp
:alt: The Checks tab with one note, web uses 1 role kikx doesn't vendor, and the buttons Scaffold 1 role and Open web
:class: only-dark
```

This adds one **Role skeleton** per missing role. The note disappears, and the roles appear in the project and in role suggestions.

```{image} ../images/web/project-panel.webp
:alt: The Project panel listing 5 components, with the nginx role skeleton unfolded to show its four files
:class: only-light
```

```{image} ../images/web/project-panel-dark.webp
:alt: The Project panel listing 5 components, with the nginx role skeleton unfolded to show its four files
:class: only-dark
```

Skip this for roles that already exist under `roles/` in your repo, or that come from Ansible Galaxy. The note is only informational, and the download works without it.
:::

:::{tab-item} With the CLI
:sync: cli

This only exists in the app, because it comes from **Checks** and the CLI doesn't run checks. With the CLI, add one role skeleton for each role your playbooks use, as shown below.
:::

::::

## Scaffold one role

::::{tab-set}

:::{tab-item} In the app
:sync: app

1. In **Build**, pick **Role skeleton** under the Configure stage.
2. Fill in **Name**, which must match the name used in the playbook. It can contain letters, digits, `_`, `.` and `-`.
3. Optionally fill in **Description**, which goes into `meta/main.yml`.
4. Click **Add to project**.

For a role with real starter tasks (base packages, timezone, swap, motd), pick **Common role** instead; it sits under **Show more** in the Configure stage.

[Start this lesson](teach:playbooks) to watch the dashboard write a playbook and scaffold its roles.
:::

:::{tab-item} With the CLI
:sync: cli

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

For a role with real starter tasks (base packages, timezone, swap, motd), use `ansible/common-role` instead of `ansible/role`.
:::

::::

## See also

- [Write a multi-play playbook with role conditions](multi-play-playbooks.md)
- [Components reference](../reference/components.md)

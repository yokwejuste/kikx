# Write a multi-play playbook with role conditions

Use this when one playbook file has to run different roles on different groups, or when a role should only run under a condition.

## In the dashboard

1. In **Build**, pick **Playbook** under the Configure stage.
2. Fill in **Name**. Set **Folder** to `playbooks` if you keep playbooks in a subfolder. Leave it empty to write the file at the project root.
3. For the first play, fill in:
   - **Name**: what the play does, for example `Prepare every host`.
   - **Runs on (hosts)**: an inventory group, `all`, or a pattern such as `web:db`. The suggestions come from your inventory's groups.
   - **Roles, in the order they run**: type each role name and press Enter. Roles already in the project, or used by other playbooks, are suggested.
4. To make a role conditional, expand **Role conditions (`when:`)** and type a Jinja expression next to that role, for example `enable_tls | default(false)`. Leave it empty to always run the role.
5. To run tasks around the roles, expand **Pre-tasks & post-tasks**. Paste a YAML list of tasks under **Before the roles** or **After the roles**. It's written as-is.
6. Optionally, add **Tags (optional)** and clear **Run as root (become)** if the play shouldn't escalate.
7. Click **Add play** for the next play. Use the arrows on a play to reorder it.
8. Click **Add to project**.

The preview shows the rendered YAML as you type. If a play targets a group that isn't in the inventory, **Checks** warns you.

## With the CLI

Pass the plays as a JSON list in the `plays` field:

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

This writes `playbooks/web.yml`:

```yaml
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

A few rules for the JSON:

- A role is either a plain name (`"nginx"`) or an object (`{"role": "certbot", "when": "..."}`) when it needs a condition.
- `become` defaults to `true`. With `"become": false`, the play has no `become:` line at all.
- `pre_tasks` and `post_tasks` are YAML strings. Keep them at zero indentation, and kikx indents them under the play.

Use `plays`, even for a single play. The older `--set hosts=... --set roles=[...]` form still works, but it writes a single play named after the component, with no tags and no role conditions.

## In a preset

In a preset, the same JSON goes in as a string value of `fields.plays`. This is exactly what the dashboard writes when you click **Download preset**:

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

## Next steps

- [Scaffold the roles your playbooks use](scaffold-roles.md)
- [Wire playbooks together with a site playbook](site-playbook.md)
- [Components reference](../reference/components.md)
- [Preset format](../reference/preset-format.md)

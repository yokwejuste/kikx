# kikx documentation

{.pronunciation}
kikx is pronounced “kicking”.

The docs follow [Diátaxis](https://diataxis.fr): four kinds of documentation for four different needs.

::::{grid} 1 1 2 2
:gutter: 3
:class-container: quadrants

:::{grid-item-card} Tutorials
*Learn kikx by building something.*

Start here if you're new. Each one builds a working project from scratch.

1. [Your first project with the CLI](tutorials/first-project-cli.md)
2. [Build an Ansible platform in the dashboard](tutorials/platform-in-the-dashboard.md)
3. [Let kikx show you](tutorials/teach-me.md)
:::

:::{grid-item-card} How-to guides
*Get a specific task done.*

Recipes for a specific goal, assuming you know the basics.

- [Import an existing Ansible inventory](how-to/import-an-inventory.md)
- [Write a multi-play playbook with role conditions](how-to/multi-play-playbooks.md)
- [Manage group vars as YAML or a folder](how-to/group-vars.md)
- [Wire playbooks together with a site playbook](how-to/site-playbook.md)
- [Scaffold the roles your playbooks use](how-to/scaffold-roles.md)
- [Resolve file conflicts and checks](how-to/resolve-conflicts.md)
- [Share a project as a preset](how-to/presets.md)
- [Export the architecture to draw.io](how-to/export-to-drawio.md)
- [Render your own component from a registry item](how-to/custom-registry-item.md)
:::

:::{grid-item-card} Explanation
*Why kikx works the way it does.*

Background and design decisions.

- [Vendoring real files](explanation/vendoring.md)
- [The registry as single source of truth](explanation/registry.md)
- [How rendering works](explanation/rendering.md)
- [How the architecture diagram is drawn](explanation/architecture-diagram.md)
- [How the pieces fit together](explanation/project-layout.md)
:::

:::{grid-item-card} Reference
*Exact commands, fields and formats.*

Exact, complete facts to look things up.

- [CLI](reference/cli.md)
- [Components](reference/components.md)
- [HTTP API](reference/http-api.md)
- [Configuration](reference/configuration.md)
- [Preset format](reference/preset-format.md)
- [Registry item format](reference/registry-item-format.md)
- [Checks](reference/checks.md)
:::

::::

```{toctree}
:maxdepth: 2
:titlesonly:
:hidden:

tutorials/index
how-to/index
reference/index
explanation/index
contributing/index
```

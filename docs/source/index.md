# kikx documentation

{.pronunciation}
kikx is pronounced “kicking”.

## Pick your way in

kikx works the same in the browser and in the terminal. Start with the one you use.

::::{grid} 1 1 2 2
:gutter: 3

:::{grid-item-card} I use the web app
*Build the project in your browser, then export it.*

1. [Your first project in the web app](tutorials/first-project-web.md)
2. [Let kikx show you](tutorials/teach-me.md)
3. [The web app](reference/web-app.md)
4. [Where your project lives](explanation/project-storage.md)
:::

:::{grid-item-card} I use the CLI
*Write the files straight into your repository.*

1. [Your first project with the CLI](tutorials/first-project-cli.md)
2. [Practice the CLI in your browser](how-to/practice-cli-in-browser.md)
3. [CLI](reference/cli.md)
4. [Configuration](reference/configuration.md)
:::

::::

The how-to guides show both ways side by side: pick **In the app** or **With the CLI** once and every page keeps your choice.

## Everything in the docs

The docs follow [Diátaxis](https://diataxis.fr): four kinds of documentation for four different needs.

::::{grid} 1 1 2 2
:gutter: 3
:class-container: quadrants

:::{grid-item-card} Tutorials
*Learn kikx by building something.*

Start here if you're new. Each one builds a working project from scratch.

1. [Your first project in the web app](tutorials/first-project-web.md)
2. [Your first project with the CLI](tutorials/first-project-cli.md)
3. [Build an Ansible platform in the dashboard](tutorials/platform-in-the-dashboard.md)
4. [Let kikx show you](tutorials/teach-me.md)
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
- [Start from a template in the app](how-to/start-from-template-web.md)
- [Edit components in the app](how-to/edit-components-web.md)
- [Change project settings in the app](how-to/project-settings-web.md)
- [Export and reopen a project in the app](how-to/export-and-reopen-web.md)
- [Provision cloud servers in the app](how-to/provision-servers-web.md)
- [Deploy an app to Kubernetes in the app](how-to/deploy-kubernetes-web.md)
- [Practice the CLI in your browser](how-to/practice-cli-in-browser.md)
:::

:::{grid-item-card} Explanation
*Why kikx works the way it does.*

Background and design decisions.

- [Vendoring real files](explanation/vendoring.md)
- [The registry as single source of truth](explanation/registry.md)
- [How rendering works](explanation/rendering.md)
- [How the architecture diagram is drawn](explanation/architecture-diagram.md)
- [How the pieces fit together](explanation/project-layout.md)
- [Where your project lives](explanation/project-storage.md)
:::

:::{grid-item-card} Reference
*Exact commands, fields and formats.*

Exact, complete facts to look things up.

- [The web app](reference/web-app.md)
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

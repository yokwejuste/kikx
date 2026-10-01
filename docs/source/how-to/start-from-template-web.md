# Start from a template in the app

A template is a complete project you adapt instead of starting from an empty page. This guide shows how to pick one in the app, what you get, and how to make it yours.

[Start this lesson](teach:template) to have the app walk you through the same steps.

## Pick a template

1. Go to the home page. If you're in the builder, click **Home** in the header.
2. Make sure **In the app** is selected above the cards.
3. Under **Start from a template**, read the cards. Each one shows:
   - the template's title and a one-line description;
   - badges for the stages it covers, such as **Provision**, **Inventory**, **Configure** or **Deploy**. Hover a badge to see what that stage is for;
   - a last line with the template name and its component count, for example `single-server · 7 components`. The name is the one the CLI accepts.
4. Click a card.

The card shows a spinner while the app renders every component through the backend. Then the builder opens.

The list comes from the backend, so it's the same list `kikx presets` prints. [Built-in templates](../reference/preset-format.md#built-in-templates) describes each one.

:::{note}
Opening a template replaces the project kept in your browser, along with its unsaved drafts. If the browser already holds a project, the card at the top of the home page asks **Replace** followed by the project name first. Click **Download preset first** to keep a copy, then **Replace** to open the template, or **Keep** to stay on the current project. See [Export and reopen a project in the app](export-and-reopen-web.md).
:::

## What opens

The builder opens on the **Build** tab with the template loaded:

- the project name, namespace and output directory come from the template. The header shows them, for example `ns: default` and `infra/`;
- the **Project** panel lists every component, grouped by stage in build order. Its summary counts the components and files and names the output directory;
- the editor in the middle shows a new, empty component. Nothing in the template is open yet.

From here on, the project is yours. Nothing links it back to the template, and a later change to the template doesn't touch it.

## Look around before you change anything

- Click the arrow next to a component in the **Project** panel to list the files it writes. Click a file to read it in a dialog.
- Open the **Architecture** tab to see how the components relate. Click a node to open that component.
- Open the **Checks** tab to see what kikx reports before you change anything, so you can tell later which issues your changes introduced.

## Adapt the components

1. In the **Project** panel, click a component. The editor title changes to **Editing** followed by the component, for example **Editing Inventory · app**.
2. Change the values you need: your real host names and addresses in the inventory, your settings in the group vars, your image in a Kubernetes deployment.
3. Watch **Preview** update as you type.
4. Click **Save changes**.

Repeat for each component you want to change. [Edit components in the app](edit-components-web.md) covers editing in detail, including what happens when you rename a component.

To change the namespace or output directory the template set, click the badges in the header. See [Change project settings in the app](project-settings-web.md).

## Remove what you don't need

Templates often include more than you need. For example, `single-server` creates a DigitalOcean droplet in its **Provision** stage; if your server already exists, you don't need it.

1. In the **Project** panel, hover the component you don't need.
2. Click the bin icon at the end of its row.

A notification says **Removed** followed by the component name, with an **Undo** button. Click **Undo** if you removed the wrong one.

After removing components, open the **Checks** tab. Removing a playbook, for example, can leave `site.yml` importing a file the project no longer produces. Fix what it reports, as described in [Resolve file conflicts and checks](resolve-conflicts.md#fix-what-checks-reports).

## Next steps

- Download the result: [Export and reopen a project in the app](export-and-reopen-web.md).
- Use the same template with the CLI: [Share a project as a preset](presets.md#start-from-a-template).
- See every template's contents: [Built-in templates](../reference/preset-format.md#built-in-templates).

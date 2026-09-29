# Share a project as a preset

A preset is a `.kikx-preset.json` file that lists your components and their field values. Anyone can render it into real files with the CLI, or open it again in the dashboard. kikx also ships a few ready-made presets, called templates, to start from.

## Start from a template

List the templates:

```bash
kikx presets
```

Each entry starts with the template name, for example `single-server` or `k8s-web-app`. Pass that name wherever this page uses a preset file:

```bash
kikx setup single-server
kikx apply k8s-web-app --into deploy/k8s
```

In the dashboard, go to the home page and click a card under **Start from a template**. The builder opens with every component of the template loaded, ready to edit.

The files are yours from then on. Nothing links them back to the template.

## Download a preset from the dashboard

1. Build your project.
2. At the bottom of the **Project** panel, click **Download preset**.

The browser saves `<project-name>.kikx-preset.json`. The panel then shows the two commands to run it, with copy buttons.

**Download .zip** in the header is different. It gives you the rendered files themselves, not a recipe.

## Start a new project from a preset

In an empty directory:

```bash
kikx setup ./platform.kikx-preset.json
```

`setup` writes `kikx.toml`, using the preset's project name, namespace and output directory, and renders every component into that output directory. Afterwards, `kikx add` works in that directory as usual.

`setup` stops if `kikx.toml` already exists. Pass `--force` to overwrite both the config and any existing files.

## Add a preset to a repo you already have

```bash
kikx apply ./platform.kikx-preset.json --into ops/ansible
```

`apply` never creates or reads `kikx.toml`. It writes the files under `--into`, relative to the current directory. Without `--into`, files land directly in the current directory. The preset's output directory is ignored.

If any target file already exists, `apply` writes nothing and names the file. Re-run with `--force` to overwrite.

## Choose between setup and apply

| You want to… | Use |
|---|---|
| Start a fresh kikx project, then keep using `kikx add` | `kikx setup` |
| Drop the files into an existing repo, at a path you choose | `kikx apply --into <dir>` |

Both re-render every component from the registry each time, so a preset picks up template fixes. The files aren't a frozen snapshot.

## Load a preset from a URL

Both commands also accept a URL:

```bash
kikx apply https://example.com/platform.kikx-preset.json --into infra
```

## Open a preset in the dashboard

1. Go to the home page. If you're in the builder, click **Start over** in the header.
2. Click **Open a preset** and pick the `.kikx-preset.json` file.

The dashboard re-renders every component through the backend, then opens the builder with the project loaded. If a component can't render, for example a custom registry item the backend can't reach, the preset doesn't open and an error names the problem.

Opening a preset replaces the project currently in the browser. Download what you have first if you want to keep it.

## See also

- [Preset format](../reference/preset-format.md)
- [CLI reference](../reference/cli.md)
- [Built-in templates](../reference/preset-format.md#built-in-templates)

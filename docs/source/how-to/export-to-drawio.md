# Export the architecture to draw.io

Use this to take the generated architecture diagram into draw.io (diagrams.net) and keep editing it by hand, for example to annotate it for a design review.

:::{note}
This only exists in the app. The CLI doesn't draw the architecture, so it has nothing to export. If you built the project with the CLI from a preset, open that preset in the app with **Open a preset** and export from there.
:::

## Export

1. In the dashboard, click the **Architecture** tab in the header.
2. Wait for the diagram to finish arranging. **Export to draw.io** stays disabled until it does.
3. Click **Export to draw.io**.

The browser saves `<project-name>-architecture.drawio`.

The export is a snapshot of the current project. If you add or change components later, export again.

## Open it

- **In the browser:** go to [app.diagrams.net](https://app.diagrams.net), choose **File → Open from → Device…**, and pick the file. You can also drag the file onto the canvas.
- **In the desktop app:** open the `.drawio` file directly.
- **In VS Code:** with the Draw.io Integration extension installed, open the file like any other.

## What's preserved

| Kept | Not kept |
|-|-|
| The swimlanes shown in the dashboard (Provision, Inventory, Playbooks, Roles, Deploy), with their labels and sizes | Colors and dark mode. The export uses draw.io's default styling. |
| Every node, at the position the dashboard laid it out, with its title and description | Hover tracing and click-to-edit |
| Every edge, with its label and the waypoints of its right-angle route | The link back to the kikx component |
| Dashed styling for data nodes and structural edges | |

Nodes are placed on top of the swimlanes, not inside them. If you move a lane in draw.io, select the nodes over it and move them along with it.

## Tips

- Edges are orthogonal connectors attached to their nodes. When you drag a node, draw.io reroutes the edge, and you can drag the waypoints to tidy it up.
- To keep the draw.io file in sync with the project, re-export after changes rather than editing both. The dashboard can't import the file back.

## See also

- [How the architecture diagram is drawn](../explanation/architecture-diagram.md)

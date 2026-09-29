# How the architecture diagram is drawn

The dashboard's Architecture view draws the project you are building: groups, group vars,
playbooks, roles, cloud servers and Kubernetes resources, with arrows between the ones that relate
to each other. It is computed from the project every time, not drawn by hand. This page explains
where the nodes and edges come from, why the layout looks the way it does, and why the diagram can
leave the dashboard as a draw.io file.

## Derived, not drawn

The graph is built in `web/lib/architecture/graph.ts` from the same component recipes the
dashboard renders. Most components become one node. An inventory is the exception: it becomes one
node per group, because groups are what playbooks and group vars point at, and a single
"inventory" box would hide every interesting relationship.

An edge exists only when kikx can find a real relationship in the values you entered:

- an inventory group lists another group as a `:children` entry ("includes");
- a group vars component names a group that exists in an inventory ("configures");
- a play in a playbook, or the Kubernetes bootstrap playbook, targets a group through its `hosts`
  pattern ("targets");
- a site playbook imports a playbook at a path that one of your playbooks renders to ("imports");
- a play lists a role that the project vendors ("runs");
- an Ingress's backend service is a Service in the project ("routes to");
- a Service's `app` selector matches a Deployment's `app` label ("selects").

A play targeting `all` connects to every top-level group when no group is literally called `all`,
since that is what Ansible would do.

The point of this strictness is trust. A diagram that lets you draw any arrow will eventually show
an arrow that isn't true, and then it stops being useful as a picture of the system. A derived
diagram can be wrong only when the configuration is wrong, and then the missing arrow is itself the
signal: a playbook with no "targets" edge coming into it is aimed at a group that doesn't exist. The Checks
view reports many of the same gaps as explicit issues, and the two are meant to be read together.
See the [checks reference](../reference/checks.md).

Edges come in two tones. Structural relationships (group nesting and group vars) are drawn dashed
and muted, because they describe how the inventory is organised. Behavioural ones (targets,
imports, runs, routes to, selects) are drawn solid, because they describe what happens when you run
something.

## Swimlanes

Every node belongs to a lane: Provision, Inventory, Playbooks, Roles, Deploy, and a Custom lane for
components that come from your own registry items. The lanes are ordered the way work happens:
servers are created, then listed and grouped, then configured by playbooks running roles, then
workloads are deployed onto the cluster.

Lanes answer the question people ask first when they look at an infrastructure diagram, which is
"where does this fit?", before they look at any individual arrow. They also make the diagram stable
as the project grows. Adding a role only ever adds something to the Roles lane; it doesn't
reshuffle the inventory. Without lanes an automatic layout is free to move any node anywhere, and a
small change can produce a picture that looks unrelated to the previous one.

## A layered layout engine

The layout is computed by ELK (the Eclipse Layout Kernel, through `elkjs`) in
`web/lib/architecture/layout.ts`, and the result is rendered with React Flow.

A dependency graph flowing from provisioning to deployment is a directed graph with a natural
direction, which is exactly what layered layout algorithms are designed for. ELK's layered
algorithm arranges nodes in columns from left to right, sweeps across the layers to reduce edge
crossings, and places nodes to keep edges short and straight. The lanes are expressed through ELK's
partitioning, so each node is constrained to its lane's range of columns while ELK is still free to
order and space nodes within it.

Edges are routed orthogonally, as horizontal and vertical segments that go around nodes. On a dense
diagram with dozens of edges, curves or straight diagonals pile up and cross nodes; right-angled
routes with consistent spacing stay readable, and they are also the style people expect from
architecture diagrams they'd draw by hand. Edge labels are given real sizes and placed by ELK too,
so they don't cover nodes or each other.

The alternative was free placement: let people drag nodes around and remember where they put
them. That works for a whiteboard, but it fights with the fact that the diagram is derived. Every
added component would need a position, saved positions would go stale as relationships changed,
and the diagram would quietly become a hand-maintained artefact again. Letting the engine own the
layout means the picture is always a faithful, reproducible function of the project.

## Hover tracing

On a project with many nodes, the question is rarely "what does the whole graph look like" and
usually "what is this connected to". Hovering a node highlights it, its direct neighbours and the
edges between them, and dims everything else. That turns a busy diagram into a local answer
without changing the layout, which would undermine the stability the lanes provide. Clicking a
node opens the component in the editor, since the diagram is a view of the project rather than a
separate thing to edit.

## Exporting to draw.io

The diagram is optimised for being correct, not for presentation. For a design review, a runbook
or a slide, people want to annotate it, recolour it, add things kikx doesn't model such as a load
balancer or a managed database, and remove detail that doesn't matter to their audience.

Rather than grow an editor inside the dashboard, kikx exports to draw.io, a widely used, free
diagram editor. The export in `web/lib/architecture/drawio.ts` writes the lanes as draw.io
swimlanes, each node at its computed position and size (group-like nodes dashed, as on screen),
and each edge with its label, its tone and the bend points ELK computed. Opening the file shows the
same diagram, with orthogonal edges that draw.io will keep routing sensibly as you move things.

The export is a one-way handoff. Changes made in draw.io don't come back to kikx, and exporting
again produces a fresh diagram from the project. That matches the rest of kikx: generate a good
first version, then let the person own it. See
[Export the architecture to draw.io](../how-to/export-to-drawio.md).

## Related

- [Build an Ansible platform in the dashboard](../tutorials/platform-in-the-dashboard.md)
- [Vendoring real files](vendoring.md)

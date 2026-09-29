# The registry as single source of truth

Every kikx component, whether you add it from the terminal, through the HTTP API or in the
dashboard, is resolved through the same registry. The registry is not just a list of templates. It
is where each component's fields are declared, together with their defaults, examples, allowed
choices and the paths its files render to. This page explains why that information lives in one
place and what that buys you.

## What a registry item holds

A registry item describes one component: a category and a name (together the reference, such as
`k8s/deployment`), a title and description, a list of fields, and a list of files. Each field can
be marked required and can carry a default, a human description, an example value and a set of
options. Each file is a pair of templates: one for the output path and one for the content. The
exact shape is in the [registry item format reference](../reference/registry-item-format.md).

The built-in items are defined in Rust in `backend/core/src/registry/builtin.rs`, with their
templates compiled into the binary from `backend/core/templates/`. A custom item is the same
structure written as JSON.

## Why one source

The alternative, and the natural thing to drift into, is for each client to know a little about
each component. The CLI hardcodes that replicas default to 1, the dashboard's form pre-fills a port
of 80, a help text somewhere says the Hetzner image is `ubuntu-24.04`. Each copy is reasonable on
its own, and together they are a guarantee that the values will disagree the first time one of them
changes. The disagreement is also invisible: the dashboard preview and the CLI output would simply
differ, and nobody would know which one was right.

kikx avoids that by making the registry the only place any of these values are written. The
renderer applies defaults from the registry. The CLI's help and the dashboard's forms describe
what the registry says. When a default changes, it changes in one line of `builtin.rs`, and every
front end reflects it the next time it asks.

The same applies to project-level defaults: the default namespace, the default output directory
and the fallback project name are constants in `kikx-core`'s config module, used by `kikx init` for
its flag defaults and served to the dashboard rather than repeated in it.

## How each client reads it

The CLI links `kikx-core` directly, so it reads the registry in-process. `kikx list` walks the
built-in items and prints each field with whatever the registry declares for it: whether it is
required, its default, an example, and its allowed values. The `--replicas` help text doesn't
state a number; it points you at `kikx list`.

The backend exposes the registry over HTTP. `/api/registry` returns every built-in item with its
field specs and its output path templates, `/api/config` returns the project defaults, and
`/api/registry/inspect` returns the field schema for any single reference, including ones that
aren't built in. The [HTTP API reference](../reference/http-api.md) lists the payloads.

The dashboard fetches `/api/registry` and `/api/config` once when it starts and keeps them as a
snapshot for the session (in `web/lib/registry/store.ts`). Everything that needs a value asks the
snapshot: form defaults come from each field's default, placeholders from its example, dropdowns
and suggestion lists from its options, and the component's title and description in the catalog
come from the item itself. Even the "writes" hint the catalog shows under each component, such as
`<name>-deployment.yaml`, is derived from the registry's path template rather than typed out.

What the dashboard does keep locally is structure, not values: a map from its own form kinds to
registry references, the order of the catalog stages, and how each kind's form is laid out. Those
are presentation decisions. No default, example or option value is repeated in the web code.

## Custom registry items

Because the registry item is a plain data structure, the set of components isn't closed. Any
`registry-item.json`, as a local file or a URL, can be passed where a built-in reference would go:
`kikx add ./item.json --name x`, the `ref` parameter of `/api/registry/inspect`, or the
dashboard's "From registry URL" entry. kikx fetches or reads the JSON, and from then on the item is
rendered exactly like a built-in one, with its own field defaults and path templates.

This is what makes a kikx release unnecessary for a new component. A team can keep its own items
in a repository or behind a URL and use them alongside the built-ins. The dashboard's custom panel
reads the item's field list through the inspect endpoint and pre-fills defaults from it, so a
custom item gets the same "the registry decides" treatment as a built-in one.

Resolution checks built-ins first, and it matches on the last segment of the reference. That is
why `k8s/deployment` and `deployment` both resolve to the same built-in. It also means a custom
reference whose final path segment is exactly a built-in name (a URL ending in `/deployment`, or an
extension-less file called `role`) resolves to the built-in rather than to the file. Naming
custom items with a `.json` extension, as the convention suggests, avoids the collision.

## Related

- [Render your own component from a registry item](../how-to/custom-registry-item.md)
- [Components reference](../reference/components.md) for the built-in fields and defaults.
- [How rendering works](rendering.md) for how field values and defaults are combined.

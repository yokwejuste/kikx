# How rendering works

Rendering is the step between "I want a Deployment called `api` running this image" and a file on
disk. It is the same code whether the request comes from `kikx add`, from a preset, or from the
dashboard's live preview: `render_component` in `backend/core/src/ops/add.rs`. This page walks
through what it does and why each decision was made. For the exact field names of each component,
see the [components reference](../reference/components.md).

## Resolving the reference

The first question is which registry item you mean. kikx tries three things in order. If the
reference names a built-in component, that item is used; only the last segment is compared, so
`k8s/deployment` and `deployment` are the same thing. Otherwise, if the reference starts with
`http://` or `https://`, kikx fetches it and parses the body as a registry item. Otherwise, if it
names an existing local file, kikx reads that. Anything else is an error that points you at
`kikx list`.

Built-ins go first so that the common case never touches the network or the filesystem, and so a
typo in a built-in name fails quickly with a helpful message instead of an attempt to open a file.
URLs and files share one loader, which is also what presets use, so "a reference is a built-in
name, a URL or a path" means the same thing everywhere in kikx. The [registry page](registry.md)
covers why custom items matter.

## Building the context

Rendering produces a template context: a map of names to values that the templates can use. It
always contains `name`, which you must supply, and `namespace`, which is the value you passed if
you passed one and otherwise the project's default namespace. For `kikx add` that default comes
from `kikx.toml`; for `setup` and `apply` it comes from the preset's project block; over HTTP it is
the request's `defaultNamespace`.

Then kikx walks the item's declared fields. For each one it takes your value if you gave one, and
falls back to the registry default if you didn't. A required field with neither is an error, named
after the flag you'd use to supply it. Explicit values always beat defaults, and the defaults are
only ever the registry's, never a client's.

Values you supply that the item doesn't declare are still added to the context. Declared fields
exist to give clients defaults, examples and validation, not to restrict what a template can see,
so a custom item can use extra values without listing every one.

Labels are handled alongside fields. You can set any labels you like, and if you don't set `app`
it defaults to the component name. That one default is why a Deployment and a Service with the
same name select each other without further configuration.

## Named flags and `--set`

The CLI offers two ways to give a value. A handful of common fields have their own flags
(`--image`, `--replicas`, `--port`, `--target-port`, `--namespace`, `--host`, `--path`,
`--service`), and every field can be set with `--set key=value`. The HTTP API mirrors this: the
same common fields are top-level properties of a render request, and everything else goes in a
`fields` map.

Both routes feed a single list. Named values go in first and `--set` values are appended after
them, and when the list is turned into the context the later entry for a key replaces the earlier
one. So if you pass both `--image nginx` and `--set image=caddy`, the rendered image is `caddy`;
the same holds for a top-level `image` versus `fields.image` over HTTP. The named flags exist for
convenience and type checking (a port has to be a number), and `--set` is the general mechanism
that always has the last word.

## JSON-valued fields

Every value arrives as a string, from a flag, a preset or an HTTP body. That keeps the interface
uniform, but some components need structure: an inventory is a list of groups with members and
vars, a playbook is a list of plays with roles and conditions. Rather than invent a second input
format, kikx looks at each value as it goes into the context. If it starts with `[` or `{` and
parses as JSON, the template receives the parsed list or map. Otherwise it receives the string.

This keeps presets as simple string maps, lets the dashboard send structured data as a JSON
string, and lets the CLI accept it with `--set hosts='[...]'`. The rule applies to registry
defaults too, so a custom item can declare a JSON default. The trade-off is that a plain string
value that happens to be valid JSON beginning with a bracket or brace becomes structured; in
practice field values like images, hostnames and ports never look like that.

## Templates

Templates are [minijinja](https://github.com/mitsuhiko/minijinja), a Rust implementation of Jinja2.
Jinja was the obvious choice for a tool whose main audience writes Ansible, which already uses it,
and minijinja makes it available without a Python runtime. Trailing newlines are kept so rendered
files end the way their templates do.

Both halves of a registry file are templates. The content is rendered with the context, and so is
the path, which is how `{{ name }}-deployment.yaml`, an optional playbook folder, and the choice
between `group_vars/<group>.yml` and `group_vars/<group>/main.yml` all come from the registry
rather than from client code. If two files of one item render to the same path, rendering fails:
that is a broken item, not a situation to resolve silently.

## Null versus missing in the inventory

The inventory component has one subtle rule worth understanding. It takes a `default_user` and a
`default_port` (defaulting to `root` and `22`) that are written onto hosts that don't set their
own. The question is what "don't set" means.

If a host entry has no `ansible_user` key at all, the default is written, so a quick inventory of a
few servers gets `ansible_user=root ansible_port=22` on every line with no extra effort. If the host
sets `ansible_user` to a value, that value is written. And if the host sets `ansible_user` to
`null` (or an empty string), nothing is written for it at all, not even the default. The same
applies to `ansible_port`.

The reason for the third case is Ansible's variable precedence. A host variable written inline in
the inventory beats a group variable. If kikx always wrote a default user onto every host, a
`[all:vars]` block or a `group_vars/all.yml` saying `ansible_user=ops` would be silently overridden
by `ansible_user=root` on each host line, which is exactly the kind of bug that is hard to spot.
Explicit `null` is how a caller says "I have nothing to say about this host's user; let the group
decide". The dashboard uses this: a host whose user or port field is left empty is sent with
`null`, and when a host belongs to several groups only its first appearance carries connection
details, the rest being bare names, so the same variables aren't repeated or re-defaulted.

## Path safety

Rendered paths come from templates, and templates can come from a URL you don't control. Before
kikx writes anything to disk, it checks every rendered path. Absolute paths are refused. Paths are
walked component by component, and any `..` that would climb above the output directory is refused.
Two files rendering to the same path across a whole preset are refused too. Only then does kikx
check for existing files and write.

These checks run when kikx writes, which is the CLI's `add`, `setup` and `apply`. The HTTP API
only renders and returns content, so it doesn't apply them; the dashboard puts the rendered paths
into the zip you download.

## One writer per file

A file can have only one content, so kikx insists that a file has only one owner. On the command
line this shows up as the refusal to overwrite without `--force`, and as the rejection of a preset
where two components render to the same path.

The dashboard enforces it more precisely because it knows which component produced which file.
Each component is identified by its reference and name. When you save a component whose files
collide with files another component already owns, the conflict dialog shows the owner and a diff,
and confirming replaces the previous owner: that component is removed from the project, not just
the colliding file. Saving a component with the same reference and name as an existing one
replaces it in place.

Removing the whole previous owner can feel heavy-handed, but the alternatives are worse. Keeping
the old component while dropping one of its files would leave a component whose recipe no longer
matches its output, and it would come back the next time the project is re-rendered from a preset.
Keeping both would make the download depend on ordering, and the Checks view flags exactly that
case as an error because only the last writer would survive. Replacing the owner keeps the
project's recipe and its files telling the same story. See [Resolve file conflicts and checks](../how-to/resolve-conflicts.md).

## Related

- [Vendoring real files](vendoring.md) for why the output is written once and then owned by you.
- [Registry item format](../reference/registry-item-format.md) for the templates' inputs.
- [CLI reference](../reference/cli.md) for every flag mentioned here.

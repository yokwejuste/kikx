# Vendoring real files

kikx has one central idea: the infrastructure it produces for you should be ordinary files in your
repository, not something that lives behind a dependency. When you add an inventory, a playbook, a
role or a Kubernetes Deployment, kikx renders a template once and writes the result next to the
rest of your code. From that moment on the file is yours. This page explains why kikx works that
way, what you give up in exchange, and when the model fits.

## The problem with hidden infrastructure

Infrastructure tooling usually reaches you in one of two shapes. The first is a dependency: an
Ansible collection, a Helm chart, a Terraform module. You pin a version, pass it variables, and the
real logic stays inside a package you don't read. The second is a generator that produces output
and then expects to keep owning it, often with a header asking you not to edit the file because the
next run will overwrite it.

Both shapes work well while your needs match the author's. They get uncomfortable the day you need
one more line the abstraction didn't anticipate. With a dependency you end up forking it, wrapping
it, or adding a variable upstream and waiting. With an owning generator you either stop running the
generator or keep patching its output after every run. In both cases the thing you actually deploy
is one step removed from the thing you can see and change.

Infrastructure files are also unusually worth reading. An inventory tells you which hosts exist, a
`group_vars` file tells you what they're configured with, a Service manifest tells you what traffic
goes where. Hiding those behind a package makes the most important facts about a system harder to
find, review and debug.

## What kikx does instead

kikx treats a template as a starting point, not a contract. `kikx add` resolves a component from
the registry, fills in your values and the registry's defaults, renders the template, and writes
plain files into the project's output directory. Nothing in those files refers back to kikx. There
is no runtime package, no lock file entry for the component, and no marker in the output. The
project's only kikx-specific file is `kikx.toml`, which records the project name, the default
namespace and the output directory so later `add` commands know where to write.

This is the same trade that "copy the source into your project" UI libraries make: the tool is a
fast, consistent way to get good first versions of files, and after that it gets out of the way.
You can edit the rendered playbook, delete a task from a role, rename a manifest, or stop using
kikx entirely, and nothing breaks.

## The trade-offs you accept

Owning the files means owning their drift. Once a playbook is in your repository it evolves with
your system, and kikx doesn't track how far it has moved from the template it came from. There is
no diff against upstream and no three-way merge.

It also means nobody pulls upgrades for you. If a template improves in a later kikx release, your
existing files don't change. That is deliberate: an infrastructure file changing underneath you
because a tool was upgraded is exactly the kind of surprise vendoring exists to prevent. But it
does mean adopting an improvement is a conscious act.

The act kikx gives you for that is re-rendering. `add`, `setup` and `apply` all refuse to write
over an existing file, and they check every target before writing any of them, so a conflict on
one file of a four-file role stops the whole component before anything is written. Passing `--force` re-renders the component with the
values you give it and overwrites the files. That is a clean way to regenerate something you
haven't customised, and a blunt one for something you have: `--force` replaces the file, it
doesn't merge your edits into the new version. Version control is what makes this safe. Re-render,
look at the diff, keep what you want.

Presets follow the same philosophy. A preset is a recipe (components and their field values), not
a bundle of pre-rendered output, so `kikx setup` and `kikx apply` render every component fresh
from the registry each time they run. See [Share a project as a preset](../how-to/presets.md).

## When vendoring is the right model

Vendoring fits best when the files are small, readable and likely to be customised, which
describes most of what kikx produces: inventories, group vars, playbooks, role skeletons and single
manifests. These are files people already expect to read and edit by hand, and a good starting
version saves time without taking anything away.

It fits less well for large bodies of logic that you want someone else to maintain, such as a
full-featured community role or a complex Helm chart with its own release cadence. Those are
better consumed as dependencies, and nothing stops a kikx project from doing both: a vendored
playbook can happily run a role installed from Ansible Galaxy. kikx's own role components reflect
this split. `ansible/role` gives you an empty skeleton, and generating the contents of your roles
is explicitly out of scope; the tasks are yours to write.

## Related

- [How rendering works](rendering.md) for what happens between your values and the written file.
- [Resolve file conflicts and checks](../how-to/resolve-conflicts.md) for what to do when a file
  already exists.
- [CLI reference](../reference/cli.md) for `--force`, `setup`, `apply` and `--into`.

# Provision cloud servers in the app

The **Provision** stage of the builder writes Terraform files that create servers at a cloud
provider. This page shows how to describe one or more servers in the app, read the file kikx
writes, and connect those servers to an inventory.

Provision is optional. If your servers already exist, skip it and start with an
[inventory](import-an-inventory.md).

[Start this lesson](teach:terraform)

## Add a cloud server

1. Open the builder. From the home page, start a **Blank project** or open a project you already
   have.
2. In the stages on the left, under **Provision**, click **Cloud server**. The editor shows
   **New cloud server**.
3. In **Name**, type a name such as `web`. The name becomes the Terraform resource name, the file
   name and the prefix of every machine Terraform creates.
4. Pick a **Provider**.
5. Fill in the fields for that provider, described below.
6. Click **Add to project**, or press ⌘/Ctrl + Enter.

The badge at the top right of the editor shows the file the component writes:
`<name>-<provider>.tf`, for example `web-hetzner.tf`.

## Choose a provider

The **Provider** list is not built into the app. It lists every Terraform item in the kikx
registry, so a provider added to the registry shows up here. For a provider that isn't listed,
load its registry item from **Custom** instead, see
[Render your own component from a registry item](custom-registry-item.md).

Each provider asks for its own fields. Switching provider resets them to that provider's
defaults, because one provider's values rarely make sense at another.

## Fill in the fields

| Field | What to enter |
|-|-|
| **Region** | The data centre the server runs in, such as `fsn1` at Hetzner or `nyc3` at DigitalOcean. The placeholder shows a value the provider accepts. |
| **Size** | The machine type: how many CPUs and how much memory. Names differ per provider, for example `cx22` or `s-2vcpu-4gb`. |
| **OS image** | The system installed on first boot. The suggestions are a shortcut; any image the provider accepts works. |
| **Count** | How many identical machines to create from this one description. The default is `1`. |
| **Private network** | Optional. A private range for these servers, in CIDR notation, such as `10.10.0.0/16`. Leave it empty to use the provider's default network. |

Some providers add fields of their own. Hetzner, for example, adds **Network zone**, which must
contain the server's region. Every field has a help line under it, and
[Components](../reference/components.md) lists the fields of each provider.

Required fields that are empty, or values in the wrong format, are flagged when you leave the
field. Until you fix them, the preview keeps showing the last valid render.

### Enter a private network range

**Private network** takes one IPv4 or IPv6 range written as an address, a slash and a prefix
length. The address must be the first address of the range:

| You type | The app says |
|-|-|
| `10.10.0.0/16` | Nothing: the range is valid. |
| `10.10.0.5/16` | **This range starts at 10.10.0.0/16; enter that instead** |
| `10.10.0.0` or `10.10.0.0/40` | **Enter a range as address/prefix length, like the example** |

With a range set, the file also creates a private network for these servers and attaches every
machine to it. Without one, the servers use the provider's default network.

## Read the generated file

The **Preview** under the form shows the `.tf` file as you type. It is plain Terraform that you
can read, review and commit. Look for these parts:

- **The provider and its token.** For providers that use an API token, such as Hetzner or
  DigitalOcean, the token is declared as a sensitive variable and is never written into the file.
  You pass it when you run Terraform, through an environment variable or a gitignored
  `.tfvars` file.
- **The server resource.** One resource, named after the component, for example
  `resource "hcloud_server" "web"`.
- **The machine names.** Each machine is named after the component plus its index, starting at
  zero: `web-0`, `web-1` and so on. You'll use these names in the inventory.
- **The region.** Each provider names this setting its own way. kikx maps **Region** to the right
  attribute for you.
- **The private network,** when you set one.

Use **Copy** on the preview to copy the file.

## Add several servers

Real projects rarely have one kind of machine. Add one **Cloud server** component per kind, for
example `web` for the web servers and `db` for the database:

1. After you add the first server, the editor stays on it. Click **New** at the top of the editor,
   or click **Cloud server** again in the stages.
2. Fill in the second server with a different **Name**, and add it.

Each server writes its own file and carries its own provider block, so servers can use different
providers. Terraform reads every `.tf` file in the folder together, so one `terraform apply`
creates them all. To create several identical machines, raise **Count** instead of adding more
components.

If two servers would write the same file, for example two servers named `web` at the same
provider, the app asks before replacing the first. See [Resolve file conflicts and checks](resolve-conflicts.md).

### Check that private networks don't overlap

Each server with a **Private network** creates its own network. When the ranges of two servers
overlap, the **Checks** tab shows a warning such as:

**web (10.10.0.0/16) and db (10.10.0.0/24) use overlapping networks**

Overlapping networks can't be peered or routed to each other. That is fine if the servers never
need to talk. Otherwise, give each server a range that doesn't overlap the others, for example
`10.10.0.0/16` and `10.20.0.0/16`.

## Connect servers to the inventory

Terraform creates the machines, and Ansible configures them. kikx does not read Terraform state,
so after `terraform apply` you list the machines in an inventory yourself:

1. Run `terraform apply`. Terraform prints or stores the address of each machine.
2. In the builder, under **Inventory**, add an inventory. Name each host the way Terraform does,
   `web-0`, `web-1` and so on, with its address.
3. Put the hosts in a group named after the server, for example `web`.

Using the same names lets kikx link the two. See [Import an existing Ansible inventory](import-an-inventory.md) to
paste an existing inventory instead of typing hosts.

## See the servers in Architecture

Open the **Architecture** tab. Each server sits in the **Provision** lane, with its region and size
under its name. An arrow labelled **provisions** goes from the server to the inventory groups it
creates machines for. kikx picks those groups in this order:

1. a group with the same name as the server;
2. groups with a host whose name starts with the server name and a dash, such as `web-0`;
3. groups whose name contains the server name as a word, such as `web_eu` for `web`.

When no group matches, the arrow goes to every top level group. Add a group named after the
server to make the arrow precise. Click a node to open its component in the editor.

## See also

- [Let kikx show you](../tutorials/teach-me.md)
- [Components](../reference/components.md)
- [Checks](../reference/checks.md#range-overlap)
- [How the architecture diagram is drawn](../explanation/architecture-diagram.md)

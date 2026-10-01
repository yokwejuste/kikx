# Checks

The dashboard's Checks view, computed in the browser by `checkProject` in `web/lib/project/checks.ts`. Checks read component field values; they do not call the backend or read files on disk.

## Severities

| Severity | Order |
|-|-|
| `error` | 1 |
| `warning` | 2 |
| `info` | 3 |

Issues are listed in this order.

## Summary

| ID pattern | Severity | Component types |
|-|-|-|
| [`dup-file:<file>`](#dup-file) | `error` | any |
| [`cycle:<inventory>`](#cycle) | `error` | `ansible/inventory` |
| [`addr:<host>:<address>`](#addr) | `error` | `ansible/inventory` |
| [`empty-child:<inventory>:<group>:<child>`](#empty-child) | `warning` | `ansible/inventory` |
| [`override:<inventory>:<host>:<key>:<group>`](#override) | `warning` | `ansible/inventory` |
| [`shared-addr:<address>`](#shared-addr) | `warning` | `ansible/inventory` |
| [`range-overlap:<component>:<field>:<other component>:<other field>`](#range-overlap) | `warning` | any component with a `cidr` field |
| [`gv-layouts:<group>`](#gv-layouts) | `warning` | `ansible/group-vars` |
| [`gv-group:<group-vars>`](#gv-group) | `warning` | `ansible/group-vars`, `ansible/inventory` |
| [`gv-shadow:<group-vars>:<inventory>:<key>`](#gv-shadow) | `warning` | `ansible/group-vars`, `ansible/inventory` |
| [`play-hosts:<playbook>:<play index>:<target>`](#play-hosts) | `warning` | `ansible/playbook`, `ansible/inventory` |
| [`site-missing:<site>:<path>`](#site-missing) | `warning` | `ansible/site`, `ansible/playbook` |
| [`svc-selector:<service>`](#svc-selector) | `warning` | `k8s/service`, `k8s/deployment` |
| [`ing-backend:<ingress>`](#ing-backend) | `warning` | `k8s/ingress`, `k8s/service` |
| [`multi-inventory`](#multi-inventory) | `info` | `ansible/inventory` |
| [`ext-roles:<playbook>`](#ext-roles) | `info` | `ansible/playbook` |
| [`not-imported:<playbook>`](#not-imported) | `info` | `ansible/playbook`, `ansible/site` |

In ID patterns, `<inventory>`, `<group-vars>`, `<playbook>`, `<site>`, `<service>`, `<ingress>`, `<component>` and `<other component>` are the dashboard's internal component IDs.

## Definitions

| Term | Meaning |
|-|-|
| Inventory entries | The parsed `hosts` field of an `ansible/inventory` component. See [Components](components.md#hosts) |
| Known groups | `all`, `ungrouped`, and every `group` and `children` name in every inventory |
| Addressed hosts | Host names that have an `ansible_host` in any inventory |
| Normalised address | An `ansible_host` that is an IPv4 or IPv6 address, in canonical form (IPv6 compressed and lowercase); any other value lowercased |
| Range fields | Non-empty fields whose registry [`format`](registry-item-format.md#field) is `cidr` and whose value is a valid range |
| Group of a group-vars component | Its `group` field, else its component name |
| Plays | The parsed `plays` field of an `ansible/playbook` component, else one play from its `hosts` and `roles` fields |
| Play targets | The play's `hosts` split on `:` and `,`, trimmed, with a leading `!` or `&` removed, empty parts dropped |
| Playbook path | `<folder>/<name>.yml` with trailing `/` removed from `folder`, or `<name>.yml` when `folder` is empty |
| Vendored roles | Names of `ansible/*` components, other than `inventory`, `group-vars`, `playbook` and `site`, that render more than one file |
| App label | A component's `app` label, else its name |

Checks that compare against the inventory ([`gv-group`](#gv-group), [`play-hosts`](#play-hosts)) run only when the project has at least one inventory.

## `dup-file`

| | |
|-|-|
| Severity | `error` |
| Trigger | Two or more components render a file with the same path |
| Title | `<count> components write <file>` |
| Detail | `Only the last one survives in the download. Remove or rename one of them.` |

## `cycle`

| | |
|-|-|
| Severity | `error` |
| Trigger | The `children` of an inventory's groups form a cycle. One issue per inventory, for the first cycle found |
| Title | `Group nesting loops: <a> → <b> → <a>` |
| Detail | `Ansible refuses to load an inventory whose :children form a cycle.` |

## `addr`

| | |
|-|-|
| Severity | `error` |
| Trigger | A host name appears with two different `ansible_host` values, in one or several inventories |
| Title | `<host> has two addresses: <first> and <second>` |
| Detail | `The same host name points at different machines. Ansible uses whichever it reads last.` |

## `empty-child`

| | |
|-|-|
| Severity | `warning` |
| Trigger | A group's `children` names a group that has no `members` and no `children` in the same inventory |
| Title | `[<group>:children] lists "<child>", which has no hosts` |
| Detail | `Probably a typo, or add hosts to that group.` |

## `override`

| | |
|-|-|
| Severity | `warning` |
| Trigger | A host sets `ansible_user` or `ansible_port` to a non-empty value, and its group or an ancestor group sets the same key in `vars` to a different value |
| Title | `<host> sets <key>=<host value>, overriding [<group>:vars] <key>=<group value>` |
| Detail | `Host vars win over group vars. Clear <key> on the host if the group value is the one you want.` |

## `shared-addr`

| | |
|-|-|
| Severity | `warning` |
| Trigger | Two or more different host names have the same normalised address, in one or several inventories. One issue per address |
| Title | `<count> hosts share the address <address>: <hosts>` |
| Detail | `Different host names pointing at one machine run the same plays on it twice. Give each host its own address, or keep a single host.` |

## `range-overlap`

| | |
|-|-|
| Severity | `warning` |
| Trigger | Range fields of two different components overlap, that is one range contains the first address of the other. One issue per pair of fields |
| Title | `<first name> (<first range>) and <second name> (<second range>) use overlapping networks` |
| Detail | `Overlapping private networks cannot be peered or routed to each other. Fine if they never need to talk; otherwise pick ranges that do not overlap.` |

## `gv-layouts`

| | |
|-|-|
| Severity | `warning` |
| Trigger | Two or more `ansible/group-vars` components target the same group, whatever their `layout` |
| Title | `Group "<group>" has both group_vars/<group>.yml and group_vars/<group>/main.yml` |
| Detail | `Ansible loads and merges both, so a key set twice depends on load order. Keep one layout.` |

## `gv-group`

| | |
|-|-|
| Severity | `warning` |
| Trigger | A group-vars component's group is not a known group |
| Title | `group_vars/<group>.yml targets a group no inventory defines` |
| Detail | `Those variables will never be loaded. Check the spelling against your inventory groups.` |

## `gv-shadow`

| | |
|-|-|
| Severity | `warning` |
| Trigger | A key is set both in a group-vars component and in the same group's `vars` in an inventory, unless the group-vars value is present and equal to the inventory value |
| Title | `<key> is set in both [<group>:vars] and group_vars/<group>.yml` |
| Detail | `group_vars/<group>.yml wins (<file value> over <inventory value>). Keep it in one place.` The part in parentheses is omitted when the key has no value in `yaml` |

Group-vars keys are read from `yaml` when set, as top-level lines matching `name: value` with surrounding quotes removed from the value; otherwise from `vars`.

## `play-hosts`

| | |
|-|-|
| Severity | `warning` |
| Trigger | A play target is neither a known group nor an addressed host |
| Title | `Play "<play name>" targets "<target>", which isn't in the inventory` |
| Detail | `The play will match no hosts and silently do nothing.` |

## `site-missing`

| | |
|-|-|
| Severity | `warning` |
| Trigger | A site component imports a `path` that is not the playbook path of any playbook component |
| Title | `<site name>.yml imports <path>, which this project doesn't produce` |
| Detail | `Fine if the file already exists in your repo; otherwise add that playbook.` |

## `svc-selector`

| | |
|-|-|
| Severity | `warning` |
| Trigger | A service's app label matches the app label of no `k8s/deployment` component |
| Title | `Service <name> selects app=<label>, but no deployment has that label` |
| Detail | `Its endpoints will be empty. Name the deployment the same, or set the app label.` |

## `ing-backend`

| | |
|-|-|
| Severity | `warning` |
| Trigger | An ingress's `service` field, else its name, is not the name of any `k8s/service` component |
| Title | `Ingress <name> routes to service "<service>", which isn't in the project` |
| Detail | none |

## `multi-inventory`

| | |
|-|-|
| Severity | `info` |
| Trigger | The project has more than one `ansible/inventory` component |
| Title | `<count> inventories in this project` |
| Detail | `Fine for separate environments; pass the right one with -i. Checks treat their groups as one pool.` |

## `ext-roles`

| | |
|-|-|
| Severity | `info` |
| Trigger | A playbook's plays use roles that are not vendored roles |
| Title | `<playbook name> uses <count> role kikx doesn't vendor`, with `roles` when count is not 1 |
| Detail | `<roles>: they must already exist under roles/ in your repo, or scaffold empty ones here.` |
| Action | `scaffold-roles` with the list of roles |

## `not-imported`

| | |
|-|-|
| Severity | `info` |
| Trigger | The project has at least one site component, and a playbook's path is imported by none of them |
| Title | `<path> isn't imported by any site playbook` |
| Detail | `It only runs if you call it directly.` |

## See also

- [Resolve file conflicts and checks](../how-to/resolve-conflicts.md)
- [Scaffold the roles your playbooks use](../how-to/scaffold-roles.md)

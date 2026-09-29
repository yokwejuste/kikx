# Vérifications

La vue « Checks » du tableau de bord, calculée dans le navigateur par `checkProject` dans `web/lib/project/checks.ts`. Les vérifications lisent les valeurs des champs des composants ; elles n'appellent pas le backend et ne lisent aucun fichier sur le disque.

## Sévérités

| Sévérité | Ordre |
|---|---|
| `error` | 1 |
| `warning` | 2 |
| `info` | 3 |

Les problèmes sont listés dans cet ordre.

## Résumé

| Modèle d'ID | Sévérité | Types de composants |
|---|---|---|
| [`dup-file:<file>`](#dup-file) | `error` | tous |
| [`cycle:<inventory>`](#cycle) | `error` | `ansible/inventory` |
| [`addr:<host>:<address>`](#addr) | `error` | `ansible/inventory` |
| [`empty-child:<inventory>:<group>:<child>`](#empty-child) | `warning` | `ansible/inventory` |
| [`override:<inventory>:<host>:<key>:<group>`](#override) | `warning` | `ansible/inventory` |
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

Dans les modèles d'ID, `<inventory>`, `<group-vars>`, `<playbook>`, `<site>`, `<service>` et `<ingress>` sont les identifiants internes des composants dans le tableau de bord.

## Définitions

| Terme | Signification |
|---|---|
| Entrées d'inventaire | Le champ `hosts` analysé d'un composant `ansible/inventory`. Voir [Composants](components.md#hosts) |
| Groupes connus | `all`, `ungrouped`, et chaque nom de `group` et de `children` de chaque inventaire |
| Hôtes adressés | Noms d'hôtes qui ont un `ansible_host` dans un inventaire quelconque |
| Groupe d'un composant de group vars | Son champ `group`, sinon son nom de composant |
| Plays | Le champ `plays` analysé d'un composant `ansible/playbook`, sinon un seul play issu de ses champs `hosts` et `roles` |
| Cibles d'un play | Le `hosts` du play découpé sur `:` et `,`, sans espaces autour, sans `!` ou `&` initial, les parties vides étant supprimées |
| Chemin du playbook | `<folder>/<name>.yml` avec le `/` final retiré de `folder`, ou `<name>.yml` lorsque `folder` est vide |
| Rôles vendorisés | Noms des composants `ansible/*`, autres que `inventory`, `group-vars`, `playbook` et `site`, qui rendent plus d'un fichier |
| Label app | Le label `app` d'un composant, sinon son nom |

Les vérifications qui comparent à l'inventaire ([`gv-group`](#gv-group), [`play-hosts`](#play-hosts)) ne s'exécutent que lorsque le projet contient au moins un inventaire.

## `dup-file`

| | |
|---|---|
| Sévérité | `error` |
| Déclencheur | Deux composants ou plus rendent un fichier ayant le même chemin |
| Titre | `<count> components write <file>` |
| Détail | `Only the last one survives in the download. Remove or rename one of them.` |

## `cycle`

| | |
|---|---|
| Sévérité | `error` |
| Déclencheur | Les `children` des groupes d'un inventaire forment un cycle. Un problème par inventaire, pour le premier cycle trouvé |
| Titre | `Group nesting loops: <a> → <b> → <a>` |
| Détail | `Ansible refuses to load an inventory whose :children form a cycle.` |

## `addr`

| | |
|---|---|
| Sévérité | `error` |
| Déclencheur | Un nom d'hôte apparaît avec deux valeurs `ansible_host` différentes, dans un ou plusieurs inventaires |
| Titre | `<host> has two addresses: <first> and <second>` |
| Détail | `The same host name points at different machines — Ansible uses whichever it reads last.` |

## `empty-child`

| | |
|---|---|
| Sévérité | `warning` |
| Déclencheur | Les `children` d'un groupe nomment un groupe qui n'a ni `members` ni `children` dans le même inventaire |
| Titre | `[<group>:children] lists "<child>", which has no hosts` |
| Détail | `Probably a typo — or add hosts to that group.` |

## `override`

| | |
|---|---|
| Sévérité | `warning` |
| Déclencheur | Un hôte définit `ansible_user` ou `ansible_port` avec une valeur non vide, et son groupe ou un groupe ancêtre définit la même clé dans `vars` avec une valeur différente |
| Titre | `<host> sets <key>=<host value>, overriding [<group>:vars] <key>=<group value>` |
| Détail | `Host vars win over group vars. Clear <key> on the host if the group value is the one you want.` |

## `gv-layouts`

| | |
|---|---|
| Sévérité | `warning` |
| Déclencheur | Deux composants `ansible/group-vars` ou plus ciblent le même groupe, quel que soit leur `layout` |
| Titre | `Group "<group>" has both group_vars/<group>.yml and group_vars/<group>/main.yml` |
| Détail | `Ansible loads and merges both, so a key set twice depends on load order. Keep one layout.` |

## `gv-group`

| | |
|---|---|
| Sévérité | `warning` |
| Déclencheur | Le groupe d'un composant de group vars n'est pas un groupe connu |
| Titre | `group_vars/<group>.yml targets a group no inventory defines` |
| Détail | `Those variables will never be loaded. Check the spelling against your inventory groups.` |

## `gv-shadow`

| | |
|---|---|
| Sévérité | `warning` |
| Déclencheur | Une clé est définie à la fois dans un composant de group vars et dans les `vars` du même groupe dans un inventaire, sauf si la valeur des group vars est présente et égale à celle de l'inventaire |
| Titre | `<key> is set in both [<group>:vars] and group_vars/<group>.yml` |
| Détail | `group_vars/<group>.yml wins (<file value> over <inventory value>). Keep it in one place.` La partie entre parenthèses est omise lorsque la clé n'a pas de valeur dans `yaml` |

Les clés des group vars sont lues depuis `yaml` lorsqu'il est défini, sous forme de lignes de premier niveau correspondant à `name: value`, les guillemets entourant la valeur étant retirés ; sinon depuis `vars`.

## `play-hosts`

| | |
|---|---|
| Sévérité | `warning` |
| Déclencheur | Une cible de play n'est ni un groupe connu ni un hôte adressé |
| Titre | `Play "<play name>" targets "<target>", which isn't in the inventory` |
| Détail | `The play will match no hosts and silently do nothing.` |

## `site-missing`

| | |
|---|---|
| Sévérité | `warning` |
| Déclencheur | Un composant site importe un `path` qui n'est le chemin d'aucun composant playbook |
| Titre | `<site name>.yml imports <path>, which this project doesn't produce` |
| Détail | `Fine if the file already exists in your repo; otherwise add that playbook.` |

## `svc-selector`

| | |
|---|---|
| Sévérité | `warning` |
| Déclencheur | Le label app d'un service ne correspond au label app d'aucun composant `k8s/deployment` |
| Titre | `Service <name> selects app=<label>, but no deployment has that label` |
| Détail | `Its endpoints will be empty. Name the deployment the same, or set the app label.` |

## `ing-backend`

| | |
|---|---|
| Sévérité | `warning` |
| Déclencheur | Le champ `service` d'un ingress, sinon son nom, n'est le nom d'aucun composant `k8s/service` |
| Titre | `Ingress <name> routes to service "<service>", which isn't in the project` |
| Détail | aucun |

## `multi-inventory`

| | |
|---|---|
| Sévérité | `info` |
| Déclencheur | Le projet contient plus d'un composant `ansible/inventory` |
| Titre | `<count> inventories in this project` |
| Détail | `Fine for separate environments; pass the right one with -i. Checks treat their groups as one pool.` |

## `ext-roles`

| | |
|---|---|
| Sévérité | `info` |
| Déclencheur | Les plays d'un playbook utilisent des rôles qui ne sont pas des rôles vendorisés |
| Titre | `<playbook name> uses <count> role kikx doesn't vendor`, avec `roles` lorsque le nombre est différent de 1 |
| Détail | `<roles> — they must already exist under roles/ in your repo, or scaffold empty ones here.` |
| Action | `scaffold-roles` avec la liste des rôles |

## `not-imported`

| | |
|---|---|
| Sévérité | `info` |
| Déclencheur | Le projet contient au moins un composant site, et le chemin d'un playbook n'est importé par aucun d'eux |
| Titre | `<path> isn't imported by any site playbook` |
| Détail | `It only runs if you call it directly.` |

## Voir aussi

- [Résoudre les conflits de fichiers et les vérifications](../how-to/resolve-conflicts.md)
- [Générer les rôles utilisés par vos playbooks](../how-to/scaffold-roles.md)

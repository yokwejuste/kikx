# Résoudre les conflits de fichiers et les vérifications

Suivez ce guide lorsque le tableau de bord vous arrête avec « This file already exists », ou lorsque l'onglet « Checks » affiche un compteur.

## Un fichier existe déjà

Un projet n'autorise qu'un seul composant par fichier. Si le composant que vous enregistrez écrirait un fichier déjà écrit par un autre composant, le tableau de bord affiche le conflit avant d'enregistrer :

- Tant que le formulaire est ouvert, la barre d'enregistrement vous avertit : *Saving replaces `<file>` — currently from `<component>`*.
- Lorsque vous cliquez sur « Add to project » ou « Save changes », une boîte de dialogue s'ouvre avec le titre « This file already exists » (ou « N files already exist »).

Dans la boîte de dialogue :

1. Dépliez un fichier pour comparer côte à côte le contenu « Current » et le contenu « Incoming ». La ligne indique « same content » ou « content differs ».
2. Lisez la ligne « Also removed with that component: », si elle est présente. Remplacer supprime le composant propriétaire *en entier*, y compris ses autres fichiers.
3. Choisissez l'une des options :
   - « Keep existing » : rien ne change. Renommez votre nouveau composant (par exemple, donnez au rôle ou au playbook un autre « Name ») et enregistrez de nouveau.
   - « Replace » : le composant propriétaire est supprimé et le vôtre reprend ses fichiers. Cette action est irréversible. Pour récupérer l'ancien composant, ajoutez-le de nouveau.

Modifier un composant et l'enregistrer sous le même nom le remplace sur place, sans boîte de dialogue.

### La même chose avec la CLI

La CLI refuse au lieu de demander, et n'écrit rien :

- `kikx add` et `kikx apply` s'arrêtent avec `<file> already exists — pass --force to overwrite`. Relancez avec `--force` pour écraser. Les fichiers dont vous n'effectuez pas de nouveau rendu restent sur le disque.
- Un preset dans lequel deux composants rendent le même chemin s'arrête avec ``two files rendered to the same path: `<file>` ``. Renommez l'un d'eux dans le preset.

## Corriger ce que signalent les vérifications

Ouvrez « Checks » depuis l'en-tête, ou cliquez sur « Review » dans le panneau « Project ». Chaque élément comporte des boutons « Open … » qui vous mènent directement au composant à corriger. Les erreurs cassent le résultat, les avertissements signalent des erreurs probables, et les notes sont informatives.

### Erreurs

| Vérification | Correction |
|---|---|
| `2 components write <file>` | Seul le dernier subsiste dans le téléchargement. Supprimez l'un des deux, ou renommez-le. Cela provient généralement d'un preset que vous avez ouvert. |
| `<host> has two addresses: <a> and <b>` | Deux inventaires, ou deux groupes, attribuent au même nom d'hôte des valeurs `ansible_host` différentes. Renommez l'un des hôtes, ou corrigez l'adresse. |
| `Group nesting loops: a → b → a` | Supprimez l'une des entrées `:children` pour que les groupes ne se contiennent plus mutuellement. Ansible refuse de charger un cycle. |

### Avertissements

| Vérification | Correction |
|---|---|
| `[<parent>:children] lists "<group>", which has no hosts` | Corrigez la faute de frappe dans le nom du groupe enfant, ou ajoutez des hôtes à ce groupe. |
| `<host> sets ansible_user=<a>, overriding [<group>:vars] ansible_user=<b>` (également `ansible_port`) | Effacez la valeur sur l'hôte si c'est celle du groupe que vous voulez. Les variables d'hôte l'emportent. |
| `Group "<g>" has both group_vars/<g>.yml and group_vars/<g>/main.yml` | Ne gardez qu'une disposition. Consultez [Gérer les group vars en YAML ou en dossier](group-vars.md#quand-les-deux-dispositions-coexistent). |
| `group_vars/<g>.yml targets a group no inventory defines` | Corrigez le nom du groupe pour qu'il corresponde à un groupe d'inventaire. Sinon, les variables ne sont jamais chargées. |
| `<key> is set in both [<g>:vars] and group_vars/<g>.yml` | Ne définissez la clé qu'à un seul endroit. Le fichier de group vars l'emporte. |
| `Play "<name>" targets "<group>", which isn't in the inventory` | Corrigez « Runs on (hosts) », ou ajoutez le groupe à l'inventaire. Sinon, le play ne correspond à aucun hôte. |
| `site.yml imports <path>, which this project doesn't produce` | Ignorez l'avertissement si le playbook existe déjà dans votre dépôt. Sinon, ajoutez ce playbook ou corrigez le chemin. |
| `Service <name> selects app=<name>, but no deployment has that label` | Donnez au Deployment le même nom que le Service, ou définissez le même label `app` sur les deux. |
| `Ingress <name> routes to service "<svc>", which isn't in the project` | Ajoutez un Service portant ce nom, ou corrigez « Backend service ». |

### Notes

| Vérification | Que faire |
|---|---|
| `<playbook> uses N roles kikx doesn't vendor` | Cliquez sur « Scaffold N roles », ou ignorez la note si les rôles existent déjà dans votre dépôt. Consultez [Générer les rôles utilisés par vos playbooks](scaffold-roles.md). |
| `<path> isn't imported by any site playbook` | Ajoutez-le au playbook site s'il doit s'exécuter dans le cadre de `site.yml`. |
| `N inventories in this project` | Aucun problème pour des environnements distincts. Les vérifications traitent tous leurs groupes comme un seul ensemble ; passez donc le bon inventaire avec `-i`. |

Les vérifications ne s'exécutent que dans le tableau de bord. La CLI ne les exécute pas.

## Voir aussi

- [Vérifications](../reference/checks.md), pour les règles exactes
- [Vendoriser de vrais fichiers](../explanation/vendoring.md)

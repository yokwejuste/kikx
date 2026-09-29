# Comment fonctionne le rendu

Le rendu est l'étape qui sépare « je veux un Deployment nommé `api` qui exécute cette image » d'un
fichier sur le disque. Le code est le même, que la demande provienne de `kikx add`, d'un preset ou
de l'aperçu en direct du tableau de bord : `render_component` dans `backend/core/src/ops/add.rs`.
Cette page décrit ce qu'il fait et la raison de chacun de ses choix. Pour les noms exacts des champs
de chaque composant, consultez la [référence des composants](../reference/components.md).

## Résoudre la référence

La première question est de savoir de quel élément de registre il s'agit. kikx essaie trois choses,
dans l'ordre. Si la référence désigne un composant intégré, c'est cet élément qui est utilisé ; seul
le dernier segment est comparé, si bien que `k8s/deployment` et `deployment` désignent la même
chose. Sinon, si la référence commence par `http://` ou `https://`, kikx la récupère et interprète le
corps de la réponse comme un élément de registre. Sinon, si elle désigne un fichier local existant,
kikx le lit. Dans tous les autres cas, c'est une erreur qui vous renvoie vers `kikx list`.

Les éléments intégrés passent en premier pour que le cas courant ne sollicite jamais ni le réseau ni
le système de fichiers, et pour qu'une faute de frappe dans un nom intégré échoue rapidement avec un
message utile plutôt que par une tentative d'ouverture de fichier. URL et fichiers partagent un même
chargeur, celui qu'utilisent aussi les presets : « une référence est un nom intégré, une URL ou un
chemin » a donc le même sens partout dans kikx. La [page sur le registre](registry.md) explique
pourquoi les éléments personnalisés comptent.

## Construire le contexte

Le rendu produit un contexte de template : une table associant des noms à des valeurs que les
templates peuvent utiliser. Il contient toujours `name`, que vous devez fournir, et `namespace`, qui
prend la valeur que vous avez passée le cas échéant, et sinon le namespace par défaut du projet.
Pour `kikx add`, cette valeur par défaut provient de `kikx.toml` ; pour `setup` et `apply`, du bloc
projet du preset ; en HTTP, du champ `defaultNamespace` de la requête.

kikx parcourt ensuite les champs déclarés par l'élément. Pour chacun, il prend votre valeur si vous
en avez fourni une, et se replie sur la valeur par défaut du registre dans le cas contraire. Un champ
obligatoire dépourvu des deux provoque une erreur, qui mentionne l'option permettant de le fournir.
Les valeurs explicites l'emportent toujours sur les valeurs par défaut, et les valeurs par défaut
sont exclusivement celles du registre, jamais celles d'un client.

Les valeurs que vous fournissez sans que l'élément les déclare sont tout de même ajoutées au
contexte. Les champs déclarés servent à fournir aux clients des valeurs par défaut, des exemples et
une validation, pas à restreindre ce qu'un template peut voir : un élément personnalisé peut donc
utiliser des valeurs supplémentaires sans devoir toutes les énumérer.

Les labels sont traités en même temps que les champs. Vous pouvez définir tous les labels que vous
voulez, et si vous ne définissez pas `app`, il prend par défaut le nom du composant. C'est grâce à
cette seule valeur par défaut qu'un Deployment et un Service portant le même nom se sélectionnent
mutuellement sans autre configuration.

## Options nommées et `--set`

La CLI propose deux façons de fournir une valeur. Quelques champs courants disposent de leur propre
option (`--image`, `--replicas`, `--port`, `--target-port`, `--namespace`, `--host`, `--path`,
`--service`), et tout champ peut être défini avec `--set key=value`. L'API HTTP suit le même
principe : ces mêmes champs courants sont des propriétés de premier niveau d'une requête de rendu,
et tout le reste va dans une table `fields`.

Les deux voies alimentent une liste unique. Les valeurs nommées y entrent d'abord, les valeurs
`--set` sont ajoutées à leur suite, et lorsque la liste est convertie en contexte, la dernière
entrée pour une clé remplace les précédentes. Si vous passez à la fois `--image nginx` et
`--set image=caddy`, l'image rendue est donc `caddy` ; il en va de même en HTTP pour un `image` de
premier niveau face à `fields.image`. Les options nommées existent pour le confort et la
vérification de type (un port doit être un nombre), tandis que `--set` est le mécanisme général, qui
a toujours le dernier mot.

## Champs à valeur JSON

Toute valeur arrive sous forme de chaîne, qu'elle provienne d'une option, d'un preset ou d'un corps
HTTP. Cela garde l'interface uniforme, mais certains composants ont besoin de structure : un
inventaire est une liste de groupes avec leurs membres et leurs variables, un playbook une liste de
plays avec leurs rôles et leurs conditions. Plutôt que d'inventer un second format d'entrée, kikx
examine chaque valeur au moment où elle entre dans le contexte. Si elle commence par `[` ou `{` et
s'interprète comme du JSON, le template reçoit la liste ou la table correspondante. Sinon, il reçoit
la chaîne.

Les presets restent ainsi de simples tables de chaînes, le tableau de bord peut envoyer des données
structurées sous forme de chaîne JSON, et la CLI les accepte avec `--set hosts='[...]'`. La règle
s'applique aussi aux valeurs par défaut du registre, si bien qu'un élément personnalisé peut déclarer
une valeur par défaut en JSON. La contrepartie est qu'une simple chaîne qui se trouve être du JSON
valide commençant par un crochet ou une accolade devient structurée ; en pratique, des valeurs de
champs comme des images, des noms d'hôtes ou des ports n'ont jamais cette forme.

## Templates

Les templates utilisent [minijinja](https://github.com/mitsuhiko/minijinja), une implémentation de
Jinja2 en Rust. Jinja s'imposait pour un outil dont le public principal écrit de l'Ansible, qui
l'utilise déjà, et minijinja le rend disponible sans environnement d'exécution Python. Les sauts de
ligne finaux sont conservés, de sorte que les fichiers rendus se terminent comme leurs templates.

Les deux moitiés d'un fichier de registre sont des templates. Le contenu est rendu avec le contexte,
et le chemin aussi : c'est ainsi que `{{ name }}-deployment.yaml`, un dossier de playbook facultatif
et le choix entre `group_vars/<group>.yml` et `group_vars/<group>/main.yml` proviennent tous du
registre plutôt que du code client. Si deux fichiers d'un même élément sont rendus vers le même
chemin, le rendu échoue : c'est le signe d'un élément défectueux, pas d'une situation à résoudre en
silence.

## Null ou absent dans l'inventaire

Le composant d'inventaire obéit à une règle subtile qui mérite d'être comprise. Il accepte un
`default_user` et un `default_port` (valant par défaut `root` et `22`), écrits sur les hôtes qui ne
définissent pas les leurs. Toute la question est de savoir ce que signifie « ne pas définir ».

Si une entrée d'hôte n'a aucune clé `ansible_user`, la valeur par défaut est écrite : un inventaire
rapide de quelques serveurs obtient ainsi `ansible_user=root ansible_port=22` sur chaque ligne sans
effort supplémentaire. Si l'hôte donne une valeur à `ansible_user`, c'est cette valeur qui est
écrite. Et si l'hôte définit `ansible_user` à `null` (ou à une chaîne vide), rien n'est écrit pour
lui, pas même la valeur par défaut. Il en va de même pour `ansible_port`.

Ce troisième cas s'explique par l'ordre de priorité des variables d'Ansible. Une variable d'hôte
écrite directement dans l'inventaire l'emporte sur une variable de groupe. Si kikx écrivait
systématiquement un utilisateur par défaut sur chaque hôte, un bloc `[all:vars]` ou un fichier
`group_vars/all.yml` indiquant `ansible_user=ops` serait discrètement écrasé par `ansible_user=root`
sur chaque ligne d'hôte, exactement le genre de bogue difficile à repérer. Un `null` explicite est
la façon dont l'appelant dit : « je n'ai rien à dire sur l'utilisateur de cet hôte ; laissez le
groupe décider ». Le tableau de bord s'en sert : un hôte dont le champ utilisateur ou port est laissé
vide est envoyé avec `null`, et lorsqu'un hôte appartient à plusieurs groupes, seule sa première
apparition porte les informations de connexion, les suivantes n'étant que de simples noms, afin que
les mêmes variables ne soient ni répétées ni remises à leur valeur par défaut.

## Sécurité des chemins

Les chemins rendus proviennent de templates, et ces templates peuvent venir d'une URL que vous ne
contrôlez pas. Avant d'écrire quoi que ce soit sur le disque, kikx vérifie chaque chemin rendu. Les
chemins absolus sont refusés. Les chemins sont parcourus segment par segment, et tout `..` qui
remonterait au-dessus du répertoire de sortie est refusé. Deux fichiers rendus vers le même chemin
dans l'ensemble d'un preset sont également refusés. Ce n'est qu'ensuite que kikx vérifie les
fichiers existants et écrit.

Ces vérifications ont lieu lorsque kikx écrit, c'est-à-dire lors des commandes `add`, `setup` et
`apply` de la CLI. L'API HTTP se contente d'effectuer le rendu et de renvoyer le contenu, elle ne
les applique donc pas ; le tableau de bord place les chemins rendus dans le zip que vous
téléchargez.

## Un seul auteur par fichier

Un fichier ne peut avoir qu'un seul contenu ; kikx exige donc qu'il n'ait qu'un seul propriétaire.
En ligne de commande, cela se traduit par le refus d'écraser un fichier sans `--force`, et par le
rejet d'un preset dans lequel deux composants sont rendus vers le même chemin.

Le tableau de bord l'applique plus finement, car il sait quel composant a produit quel fichier.
Chaque composant est identifié par sa référence et son nom. Lorsque vous enregistrez un composant
dont les fichiers entrent en collision avec des fichiers appartenant déjà à un autre composant, la
boîte de dialogue de conflit affiche le propriétaire et un diff, et confirmer remplace l'ancien
propriétaire : ce composant est retiré du projet, pas seulement le fichier en collision. Enregistrer
un composant de même référence et de même nom qu'un composant existant le remplace sur place.

Retirer l'ancien propriétaire en entier peut sembler brutal, mais les alternatives sont pires.
Conserver l'ancien composant en supprimant l'un de ses fichiers laisserait un composant dont la
recette ne correspond plus à ce qu'il produit, et le fichier reviendrait au prochain rendu du projet
depuis un preset. Conserver les deux rendrait le téléchargement dépendant de l'ordre, et la vue
« Checks » signale justement ce cas comme une erreur, puisque seul le dernier auteur survivrait.
Remplacer le propriétaire garantit que la recette du projet et ses fichiers racontent la même
histoire. Voir [Résoudre les conflits de fichiers et les vérifications](../how-to/resolve-conflicts.md).

## Voir aussi

- [Vendoriser de vrais fichiers](vendoring.md) pour comprendre pourquoi le résultat est écrit une
  seule fois puis vous appartient.
- [Format des éléments de registre](../reference/registry-item-format.md) pour les entrées des
  templates.
- [Référence de la CLI](../reference/cli.md) pour toutes les options mentionnées ici.

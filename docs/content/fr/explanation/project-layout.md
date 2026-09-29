# Comment les éléments s'articulent

kikx se compose de quatre éléments réunis dans un même dépôt : un outil en ligne de commande, une
API HTTP, une bibliothèque partagée et un tableau de bord web. Cette page explique comment ils se
répartissent le travail et pourquoi les frontières sont placées là où elles le sont. Pour les
commandes et les points d'accès eux-mêmes, consultez la [référence de la CLI](../reference/cli.md)
et la [référence de l'API HTTP](../reference/http-api.md).

## Une bibliothèque, deux interfaces

Tout le comportement réel de kikx réside dans `kikx-core`, dans `backend/core/`. On y trouve le
registre des composants et leurs templates, les templates de preset intégrés et l'analyse des
presets, la configuration `kikx.toml` et ses valeurs par défaut, ainsi que les opérations :
effectuer le rendu d'un composant, l'ajouter à un projet, initialiser un projet, et mettre en place
ou appliquer un preset. Cette bibliothèque ignore
tout des terminaux et de HTTP.

La CLI, dans `cli/`, et le backend, dans `backend/`, sont de fines couches au-dessus de cette
bibliothèque. La CLI transforme des arguments en appels à `kikx-core` et affiche le résultat ; elle
lit et écrit directement sur le système de fichiers et n'a besoin d'aucun serveur. Le backend
transforme des requêtes HTTP en appels à ces mêmes fonctions et sérialise le résultat en JSON. Le
tableau de bord, dans `web/`, ne communique qu'avec le backend.

L'intérêt de cette organisation est qu'il existe une seule et unique implémentation de « effectuer
le rendu de ce composant avec ces valeurs ». L'aperçu en direct du tableau de bord, un `kikx add`
dans un terminal et un `kikx setup` à partir d'un preset téléchargé passent tous par le même
`render_component`, avec les mêmes valeurs par défaut issues du même registre. Un preset construit
dans le tableau de bord produit donc les mêmes fichiers en ligne de commande, et la correction d'un
template ou d'une règle de rendu atteint toutes les interfaces à la fois. Voir
[Le registre, source unique de vérité](registry.md) et [Comment fonctionne le rendu](rendering.md).

## Des paquets Cargo séparés, partagés par chemin

`cli/` et `backend/` sont des paquets Cargo indépendants et non les membres d'un même workspace
Cargo. Le backend dépend de `kikx-core` situé dans `core`, et la CLI atteint la même crate par un
chemin relatif, `../backend/core`. Chaque paquet possède son propre `Cargo.lock`, se compile seul et
exécute ses propres tests et linters.

Les deux livrables restent ainsi réellement séparés. Le binaire `kikx` est ce que les utilisateurs
installent, et il est publié indépendamment ; le workflow de publication vérifie le tag par rapport
à `cli/Cargo.toml` et ne compile que la CLI. Il n'a aucune raison de compiler ni de verrouiller la
pile HTTP (axum, tokio, tower-http) dont le backend a besoin, et le backend n'a aucune raison
d'embarquer l'analyse d'arguments de la CLI. Un workspace partagerait un seul fichier de
verrouillage entre les deux et lierait la résolution de leurs dépendances. La dépendance par chemin
apporte la seule chose qui compte, une copie unique du code du cœur, sans coupler le reste.

Le prix à payer est une certaine répétition : trois fichiers `Cargo.lock`, et trois endroits où
lancer `cargo test`. La section consacrée au développement du README les énumère.

## Un backend sans état qui se contente du rendu

Le backend ne conserve aucun état entre les requêtes et n'écrit jamais de fichier. Il sert le
registre et les valeurs par défaut du projet, inspecte les éléments de registre et effectue le rendu
d'un composant en contenus de fichiers qu'il renvoie dans la réponse. Il n'a aucune notion de
projet, d'utilisateur ni de session.

Plusieurs conséquences en découlent. Il n'y a rien à stocker, à migrer ni à sauvegarder. Autant
d'onglets du tableau de bord que vous le souhaitez peuvent utiliser le même backend sans se gêner.
Et le backend ne peut rien endommager : le pire qu'une requête puisse faire est de produire un rendu,
et le contenu rendu ne devient un fichier que lorsque vous choisissez de le télécharger. Cela
explique aussi pourquoi le backend est un petit outil local, sans authentification, dont la
politique CORS n'admet par défaut que les origines de bouclage.

Les responsabilités restent également claires. L'écriture de fichiers, avec ses questions sur les
fichiers existants, `--force` et la sécurité des chemins, relève de la CLI, qui s'exécute sur la
machine à laquelle appartient le projet. Le rendu, pur et reproductible, était la seule chose qu'il
fallait partager en HTTP.

## Le tableau de bord garde le projet dans le navigateur

Le tableau de bord assemble l'intégralité du projet côté client. Chaque composant que vous
enregistrez est stocké sous forme de recette (référence, nom, valeurs des champs et labels),
accompagnée des fichiers que le backend a rendus pour lui. Le projet est conservé dans l'état React
et répliqué dans le `localStorage` du navigateur : un rafraîchissement ou un onglet fermé ne fait
donc pas perdre le travail. La détection des conflits, la vue « Checks » et le diagramme
d'architecture opèrent tous sur ce modèle en mémoire du navigateur, sans appeler le backend.

Rien n'atteint le disque avant le téléchargement. Vous pouvez récupérer le projet sous forme de
`.zip` contenant `kikx.toml` et les fichiers rendus, ou sous forme de preset : les recettes seules,
que `kikx setup` ou `kikx apply` rendront à nouveau.

Conserver le projet dans le navigateur s'accorde avec le modèle de vendorisation. Un projet en cours
de construction est un brouillon, et un brouillon n'a pas à être à moitié écrit dans le dépôt de
quelqu'un. Reporter toute écriture à un unique téléchargement explicite signifie que vous examinez
un projet complet, vérifié contre les conflits, avant qu'il ne devienne le vôtre, et cela permet au
backend de rester sans état. La contrepartie est que le projet vit dans un seul profil de navigateur
tant que vous ne l'exportez pas ; le téléchargement du preset est le moyen de le déplacer, de le
partager ou de le placer sous contrôle de version. Voir
[Partager un projet sous forme de preset](../how-to/presets.md).

## Où se trouvent les tests

Chaque paquet Rust range ses tests dans son propre répertoire `tests/`, sous forme de tests
d'intégration, plutôt que dans des modules `#[cfg(test)]` placés à côté du code.
`backend/core/tests/` couvre le rendu, le registre, les presets, `setup`, `apply` et les templates
de preset intégrés ; `backend/tests/` pilote le routeur HTTP, ses points d'accès de presets et sa
politique CORS ; `cli/tests/` exécute le
binaire `kikx` compilé sur des répertoires temporaires et vérifie l'analyse des arguments.

Tester depuis l'extérieur garantit que les tests exercent la même API publique que celle
qu'utilisent les autres paquets : les tests de la CLI voient ce que voit un utilisateur, ceux du
backend ce que voit le tableau de bord, et ceux du cœur ce qu'appellent les deux interfaces. Les
fichiers source restent ainsi centrés sur le comportement, et la suite de tests de chaque paquet
peut s'exécuter seule avec `cargo test`, de la même manière que chaque paquet se compile seul. Le
tableau de bord est contrôlé par la vérification de types, le linting et un build de production.

## Voir aussi

- [Lancer le tableau de bord et le backend](../how-to/run-the-dashboard.md)
- [Référence de la configuration](../reference/configuration.md)
- [Vendoriser de vrais fichiers](vendoring.md)

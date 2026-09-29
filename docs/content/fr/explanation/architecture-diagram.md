# Comment le diagramme d'architecture est dessiné

La vue « Architecture » du tableau de bord dessine le projet que vous construisez : groupes, group
vars, playbooks, rôles, serveurs cloud et ressources Kubernetes, reliés par des flèches lorsqu'ils
sont liés entre eux. Ce diagramme est recalculé à partir du projet à chaque fois, jamais dessiné à
la main. Cette page explique d'où viennent les nœuds et les arêtes, pourquoi la disposition a cette
allure, et pourquoi le diagramme peut quitter le tableau de bord sous forme de fichier draw.io.

## Dérivé, pas dessiné

Le graphe est construit dans `web/lib/architecture/graph.ts` à partir des mêmes recettes de
composants que celles dont le tableau de bord effectue le rendu. La plupart des composants
deviennent un seul nœud. L'inventaire fait exception : il donne un nœud par groupe, car ce sont les
groupes que visent les playbooks et les group vars, et une boîte unique « inventaire » masquerait
toutes les relations intéressantes.

Une arête n'existe que si kikx trouve une relation réelle dans les valeurs que vous avez saisies :

- un groupe d'inventaire liste un autre groupe dans une entrée `:children` (« includes ») ;
- un composant group vars nomme un groupe qui existe dans un inventaire (« configures ») ;
- un play d'un playbook, ou le playbook d'amorçage Kubernetes, cible un groupe au moyen de son motif
  `hosts` (« targets ») ;
- un playbook site importe un playbook situé à un chemin vers lequel l'un de vos playbooks est rendu
  (« imports ») ;
- un play liste un rôle que le projet vendorise (« runs ») ;
- le service backend d'un Ingress est un Service du projet (« routes to ») ;
- le sélecteur `app` d'un Service correspond au label `app` d'un Deployment (« selects »).

Un play qui cible `all` est relié à tous les groupes de premier niveau lorsqu'aucun groupe ne
s'appelle littéralement `all`, puisque c'est ce que ferait Ansible.

Cette rigueur a un but : la confiance. Un diagramme qui vous laisse tracer n'importe quelle flèche
finira par en montrer une qui est fausse, et il cessera alors d'être utile comme image du système.
Un diagramme dérivé ne peut être faux que si la configuration l'est, et dans ce cas la flèche
manquante constitue en elle-même le signal : un playbook sans arête « targets » entrante vise un
groupe qui n'existe pas. La vue « Checks » signale bon nombre de ces mêmes lacunes sous forme de
problèmes explicites, et les deux sont faits pour être lus ensemble. Voir la
[référence des vérifications](../reference/checks.md).

Les arêtes se déclinent en deux tons. Les relations structurelles (imbrication de groupes et group
vars) sont tracées en pointillés et en couleur atténuée, car elles décrivent l'organisation de
l'inventaire. Les relations de comportement (targets, imports, runs, routes to, selects) sont
tracées en trait plein, car elles décrivent ce qui se passe lorsque vous exécutez quelque chose.

## Couloirs

Chaque nœud appartient à un couloir : « Provision », « Inventory », « Playbooks », « Roles »,
« Deploy », ainsi qu'un couloir « Custom » pour les composants issus de vos propres éléments de
registre. Les couloirs sont ordonnés selon le déroulement du travail : les serveurs sont créés, puis
listés et regroupés, puis configurés par des playbooks qui exécutent des rôles, et enfin les charges
de travail sont déployées sur le cluster.

Les couloirs répondent à la première question que l'on se pose devant un diagramme
d'infrastructure, « où cela se situe-t-il ? », avant même de regarder une flèche en particulier. Ils
rendent aussi le diagramme stable à mesure que le projet grandit. Ajouter un rôle ne fait jamais
qu'ajouter quelque chose dans le couloir « Roles » ; l'inventaire n'est pas remanié pour autant.
Sans couloirs, une disposition automatique est libre de déplacer n'importe quel nœud n'importe où,
et un petit changement peut produire une image sans rapport apparent avec la précédente.

## Un moteur de disposition en couches

La disposition est calculée par ELK (l'Eclipse Layout Kernel, via `elkjs`) dans
`web/lib/architecture/layout.ts`, et le résultat est affiché avec React Flow.

Un graphe de dépendances qui s'écoule du provisionnement jusqu'au déploiement est un graphe orienté
doté d'une direction naturelle, exactement ce pour quoi les algorithmes de disposition en couches
sont conçus. L'algorithme en couches d'ELK range les nœuds en colonnes de gauche à droite, balaie les
couches pour réduire les croisements d'arêtes et place les nœuds de façon à garder les arêtes courtes
et droites. Les couloirs s'expriment grâce au partitionnement d'ELK : chaque nœud est contraint à la
plage de colonnes de son couloir, tandis qu'ELK reste libre d'ordonner et d'espacer les nœuds à
l'intérieur.

Les arêtes sont tracées de manière orthogonale, en segments horizontaux et verticaux qui
contournent les nœuds. Sur un diagramme dense comptant des dizaines d'arêtes, les courbes ou les
diagonales s'entassent et traversent les nœuds ; des tracés à angle droit, régulièrement espacés,
restent lisibles, et c'est aussi le style que l'on attend des diagrammes d'architecture que l'on
dessinerait à la main. Les libellés des arêtes reçoivent de véritables dimensions et sont eux aussi
placés par ELK, afin de ne masquer ni les nœuds ni les autres libellés.

L'alternative était le placement libre : laisser chacun déplacer les nœuds et mémoriser leur
position. Cela convient à un tableau blanc, mais entre en conflit avec le fait que le diagramme est
dérivé. Chaque composant ajouté aurait besoin d'une position, les positions enregistrées
deviendraient obsolètes à mesure que les relations changent, et le diagramme redeviendrait
insensiblement un artefact entretenu à la main. Confier la disposition au moteur garantit que
l'image est toujours une fonction fidèle et reproductible du projet.

## Traçage au survol

Sur un projet comptant de nombreux nœuds, la question est rarement « à quoi ressemble le graphe
entier ? » et bien plus souvent « à quoi ceci est-il relié ? ». Survoler un nœud le met en évidence,
ainsi que ses voisins directs et les arêtes qui les relient, et estompe tout le reste. Un diagramme
chargé fournit ainsi une réponse locale sans modifier la disposition, ce qui compromettrait la
stabilité qu'apportent les couloirs. Cliquer sur un nœud ouvre le composant dans l'éditeur, puisque
le diagramme est une vue du projet et non un objet distinct à modifier.

## Exporter vers draw.io

Le diagramme est optimisé pour être exact, pas pour la présentation. Pour une revue de conception,
un runbook ou une diapositive, on veut pouvoir l'annoter, en changer les couleurs, ajouter des
éléments que kikx ne modélise pas, comme un répartiteur de charge ou une base de données managée, et
retirer les détails qui n'intéressent pas le public visé.

Plutôt que de faire grandir un éditeur au sein du tableau de bord, kikx exporte vers draw.io, un
éditeur de diagrammes gratuit et largement répandu. L'export, dans `web/lib/architecture/drawio.ts`,
écrit les couloirs sous forme de swimlanes draw.io, chaque nœud à la position et à la taille
calculées (les nœuds de type groupe en pointillés, comme à l'écran), et chaque arête avec son
libellé, son ton et les points d'inflexion calculés par ELK. En ouvrant le fichier, vous retrouvez
le même diagramme, avec des arêtes orthogonales que draw.io continuera d'acheminer correctement à
mesure que vous déplacez les éléments.

L'export est un passage de relais à sens unique. Les modifications faites dans draw.io ne reviennent
pas dans kikx, et un nouvel export produit un diagramme neuf à partir du projet. C'est cohérent avec
le reste de kikx : générer une bonne première version, puis en laisser la propriété à la personne.
Voir [Exporter l'architecture vers draw.io](../how-to/export-to-drawio.md).

## Voir aussi

- [Construire une plateforme Ansible dans le tableau de bord](../tutorials/platform-in-the-dashboard.md)
- [Vendoriser de vrais fichiers](vendoring.md)

# Vendoriser de vrais fichiers

kikx repose sur une idée centrale : l'infrastructure qu'il produit pour vous doit prendre la forme de
fichiers ordinaires dans votre dépôt, et non de quelque chose qui vit derrière une dépendance.
Lorsque vous ajoutez un inventaire, un playbook, un rôle ou un Deployment Kubernetes, kikx effectue
le rendu d'un template une seule fois et écrit le résultat à côté du reste de votre code. Dès cet
instant, le fichier vous appartient. Cette page explique pourquoi kikx fonctionne ainsi, ce à quoi
vous renoncez en échange, et dans quels cas ce modèle convient.

## Le problème de l'infrastructure cachée

Les outils d'infrastructure vous parviennent généralement sous l'une de deux formes. La première est
une dépendance : une collection Ansible, un chart Helm, un module Terraform. Vous figez une version,
vous lui passez des variables, et la logique réelle reste enfermée dans un paquet que vous ne lisez
pas. La seconde est un générateur qui produit un résultat puis entend en rester propriétaire,
souvent avec un en-tête vous demandant de ne pas modifier le fichier parce que la prochaine exécution
l'écrasera.

Ces deux formes fonctionnent bien tant que vos besoins coïncident avec ceux de l'auteur. Elles
deviennent inconfortables le jour où il vous faut une ligne de plus que l'abstraction n'avait pas
prévue. Avec une dépendance, vous finissez par la forker, l'envelopper, ou ajouter une variable en
amont et attendre. Avec un générateur propriétaire, soit vous cessez de l'exécuter, soit vous
corrigez son résultat après chaque exécution. Dans les deux cas, ce que vous déployez réellement se
trouve à un pas de ce que vous pouvez voir et modifier.

Les fichiers d'infrastructure méritent en outre tout particulièrement d'être lus. Un inventaire vous
dit quels hôtes existent, un fichier `group_vars` avec quoi ils sont configurés, un manifeste de
Service où va le trafic. Cacher ces fichiers derrière un paquet rend les faits les plus importants
d'un système plus difficiles à trouver, à relire et à déboguer.

## Ce que fait kikx à la place

kikx considère un template comme un point de départ, pas comme un contrat. `kikx add` résout un
composant depuis le registre, y injecte vos valeurs et les valeurs par défaut du registre, effectue
le rendu du template et écrit de simples fichiers dans le répertoire de sortie du projet. Rien dans
ces fichiers ne renvoie à kikx. Il n'y a ni paquet d'exécution, ni entrée de fichier de verrouillage
pour le composant, ni marqueur dans le résultat. Le seul fichier propre à kikx dans le projet est
`kikx.toml`, qui enregistre le nom du projet, le namespace par défaut et le répertoire de sortie,
afin que les commandes `add` suivantes sachent où écrire.

C'est le même compromis que celui des bibliothèques d'interface qui vous font « copier le code
source dans votre projet » : l'outil offre un moyen rapide et cohérent d'obtenir de bonnes premières
versions de fichiers, puis il s'efface. Vous pouvez modifier le playbook rendu, supprimer une tâche
d'un rôle, renommer un manifeste ou cesser complètement d'utiliser kikx : rien ne casse.

## Les compromis que vous acceptez

Posséder les fichiers, c'est aussi assumer leur dérive. Une fois qu'un playbook est dans votre dépôt,
il évolue avec votre système, et kikx ne mesure pas à quel point il s'est éloigné du template dont
il est issu. Il n'existe ni diff par rapport à l'amont, ni fusion à trois voies.

Cela signifie aussi que personne ne récupère les mises à jour à votre place. Si un template
s'améliore dans une version ultérieure de kikx, vos fichiers existants ne changent pas. C'est
délibéré : un fichier d'infrastructure qui change sous vos pieds parce qu'un outil a été mis à jour
est précisément le genre de surprise que la vendorisation vise à éviter. Mais adopter une
amélioration devient alors un acte conscient.

L'outil que kikx vous donne pour cela est un nouveau rendu. `add`, `setup` et `apply` refusent tous
d'écraser un fichier existant, et ils vérifient chaque cible avant d'écrire quoi que ce soit : un
conflit sur un seul fichier d'un rôle qui en compte quatre arrête donc tout le composant avant la
moindre écriture. Passer `--force` refait le rendu du composant avec les valeurs que vous fournissez
et écrase les fichiers. C'est une manière propre de régénérer quelque chose que vous n'avez pas
personnalisé, et une manière brutale pour quelque chose que vous avez modifié : `--force` remplace
le fichier, il ne fusionne pas vos modifications dans la nouvelle version. C'est le contrôle de
version qui rend l'opération sûre. Refaites le rendu, examinez le diff, gardez ce qui vous convient.

Les presets suivent la même philosophie. Un preset est une recette (des composants et les valeurs de
leurs champs), pas un lot de fichiers déjà rendus : `kikx setup` et `kikx apply` refont donc le rendu
de chaque composant depuis le registre à chaque exécution. Voir
[Partager un projet sous forme de preset](../how-to/presets.md).

## Quand la vendorisation est le bon modèle

La vendorisation convient le mieux lorsque les fichiers sont petits, lisibles et susceptibles d'être
personnalisés, ce qui décrit l'essentiel de ce que produit kikx : inventaires, group vars, playbooks,
squelettes de rôles et manifestes isolés. Ce sont des fichiers que l'on s'attend déjà à lire et à
modifier à la main, et une bonne version de départ fait gagner du temps sans rien retirer.

Elle convient moins bien aux grands ensembles de logique dont vous souhaitez confier la maintenance
à quelqu'un d'autre, comme un rôle communautaire complet ou un chart Helm complexe doté de son propre
rythme de publication. Ceux-là gagnent à être consommés comme des dépendances, et rien n'empêche un
projet kikx de faire les deux : un playbook vendorisé peut très bien exécuter un rôle installé depuis
Ansible Galaxy. Les composants de rôle de kikx reflètent d'ailleurs ce partage. `ansible/role` vous
fournit un squelette vide, et générer le contenu de vos rôles est explicitement hors du périmètre :
les tâches, c'est à vous de les écrire.

## Voir aussi

- [Comment fonctionne le rendu](rendering.md) : ce qui se passe entre vos valeurs et le fichier écrit.
- [Résoudre les conflits de fichiers et les vérifications](../how-to/resolve-conflicts.md) : que
  faire lorsqu'un fichier existe déjà.
- [Référence de la CLI](../reference/cli.md) : `--force`, `setup`, `apply` et `--into`.

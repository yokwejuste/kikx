# Le registre, source unique de vérité

Chaque composant kikx, que vous l'ajoutiez depuis le terminal, via l'API HTTP ou dans le tableau de
bord, est résolu à travers le même registre. Le registre n'est pas une simple liste de templates.
C'est là que sont déclarés les champs de chaque composant, avec leurs valeurs par défaut, leurs
exemples, les choix autorisés et les chemins vers lesquels ses fichiers sont rendus. Cette page
explique pourquoi ces informations vivent en un seul endroit et ce que cela vous apporte.

## Ce que contient un élément de registre

Un élément de registre décrit un composant : une catégorie et un nom (qui forment ensemble la
référence, comme `k8s/deployment`), un titre et une description, une liste de champs et une liste
de fichiers. Chaque champ peut être marqué comme obligatoire et porter une valeur par défaut, une
description lisible, une valeur d'exemple et un ensemble d'options. Chaque fichier est une paire de
templates : l'un pour le chemin de sortie, l'autre pour le contenu. La structure exacte figure dans
la [référence du format des éléments de registre](../reference/registry-item-format.md).

Les éléments intégrés sont définis en Rust dans `backend/core/src/registry/builtin.rs`, et leurs
templates sont compilés dans le binaire depuis `backend/core/templates/`. Un élément personnalisé
a la même structure, écrite en JSON.

## Pourquoi une seule source

L'alternative, vers laquelle on glisse naturellement, consiste à ce que chaque client connaisse un
peu chaque composant. La CLI code en dur que le nombre de réplicas vaut 1 par défaut, le formulaire
du tableau de bord pré-remplit un port 80, un texte d'aide quelque part indique que l'image Hetzner
est `ubuntu-24.04`. Chaque copie est raisonnable prise isolément ; ensemble, elles garantissent que
les valeurs divergeront dès que l'une d'elles changera. Et cette divergence est invisible : l'aperçu
du tableau de bord et le résultat de la CLI différeraient tout simplement, sans que personne ne
sache lequel a raison.

kikx évite ce piège en faisant du registre le seul endroit où ces valeurs sont écrites. Le moteur de
rendu applique les valeurs par défaut du registre. L'aide de la CLI et les formulaires du tableau de
bord décrivent ce que dit le registre. Lorsqu'une valeur par défaut change, elle change sur une
seule ligne de `builtin.rs`, et chaque interface en tient compte la prochaine fois qu'elle interroge
le registre.

Il en va de même pour les valeurs par défaut au niveau du projet : le namespace par défaut, le
répertoire de sortie par défaut et le nom de projet de repli sont des constantes du module de
configuration de `kikx-core`. `kikx init` s'en sert pour les valeurs par défaut de ses options, et
elles sont servies au tableau de bord au lieu d'y être recopiées.

## Comment chaque client le lit

La CLI est liée directement à `kikx-core` ; elle lit donc le registre dans le même processus.
`kikx list` parcourt les éléments intégrés et affiche chaque champ avec tout ce que le registre
déclare pour lui : s'il est obligatoire, sa valeur par défaut, un exemple et ses valeurs autorisées.
Le texte d'aide de `--replicas` n'indique aucun nombre ; il vous renvoie vers `kikx list`.

Le backend expose le registre en HTTP. `/api/registry` renvoie tous les éléments intégrés avec les
spécifications de leurs champs et les templates de leurs chemins de sortie, `/api/config` renvoie
les valeurs par défaut du projet, et `/api/registry/inspect` renvoie le schéma des champs de
n'importe quelle référence, y compris celles qui ne sont pas intégrées. La
[référence de l'API HTTP](../reference/http-api.md) détaille les charges utiles.

Le tableau de bord récupère `/api/registry` et `/api/config` une seule fois au démarrage et les
conserve comme un instantané pour la session (dans `web/lib/registry/store.ts`). Tout ce qui a
besoin d'une valeur interroge cet instantané : les valeurs par défaut des formulaires proviennent
de la valeur par défaut de chaque champ, les textes indicatifs de son exemple, les listes
déroulantes et les listes de suggestions de ses options, et le titre comme la description du
composant dans le catalogue proviennent de l'élément lui-même. Même l'indication « writes » que le
catalogue affiche sous chaque composant, par exemple `<name>-deployment.yaml`, est dérivée du
template de chemin du registre au lieu d'être saisie à la main.

Ce que le tableau de bord conserve localement relève de la structure, pas des valeurs : une
correspondance entre ses propres types de formulaires et les références du registre, l'ordre des
étapes du catalogue, et la disposition du formulaire de chaque type. Ce sont des décisions de
présentation. Aucune valeur par défaut, aucun exemple ni aucune option n'est répété dans le code web.

## Éléments de registre personnalisés

Comme l'élément de registre est une simple structure de données, l'ensemble des composants n'est pas
fermé. N'importe quel `registry-item.json`, sous forme de fichier local ou d'URL, peut être passé là
où irait une référence intégrée : `kikx add ./item.json --name x`, le paramètre `ref` de
`/api/registry/inspect`, ou l'entrée « From registry URL » du tableau de bord. kikx récupère ou lit
le JSON, et à partir de là l'élément est rendu exactement comme un élément intégré, avec ses propres
valeurs par défaut de champs et ses propres templates de chemins.

C'est ce qui rend inutile une nouvelle version de kikx pour ajouter un composant. Une équipe peut
conserver ses propres éléments dans un dépôt ou derrière une URL et les utiliser aux côtés des
éléments intégrés. Le panneau personnalisé du tableau de bord lit la liste des champs de l'élément
via le point d'accès inspect et en pré-remplit les valeurs par défaut : un élément personnalisé
bénéficie ainsi du même principe, « c'est le registre qui décide », qu'un élément intégré.

La résolution consulte d'abord les éléments intégrés, et elle compare le dernier segment de la
référence. C'est pourquoi `k8s/deployment` et `deployment` se résolvent tous deux vers le même
élément intégré. Cela signifie aussi qu'une référence personnalisée dont le dernier segment de chemin
correspond exactement au nom d'un élément intégré (une URL se terminant par `/deployment`, ou un
fichier sans extension nommé `role`) se résout vers l'élément intégré et non vers le fichier.
Nommer les éléments personnalisés avec l'extension `.json`, comme le veut la convention, évite cette
collision.

## Voir aussi

- [Générer votre propre composant depuis un élément de registre](../how-to/custom-registry-item.md)
- [Référence des composants](../reference/components.md) pour les champs et valeurs par défaut des
  éléments intégrés.
- [Comment fonctionne le rendu](rendering.md) pour la façon dont les valeurs des champs et les
  valeurs par défaut sont combinées.

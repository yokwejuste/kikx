# Exporter l'architecture vers draw.io

Suivez ce guide pour reprendre le diagramme d'architecture généré dans draw.io (diagrams.net) et continuer à le modifier à la main, par exemple pour l'annoter en vue d'une revue de conception.

## Exporter

1. Dans le tableau de bord, cliquez sur l'onglet « Architecture » de l'en-tête.
2. Attendez que la disposition du diagramme soit terminée. « Export to draw.io » reste désactivé jusque-là.
3. Cliquez sur « Export to draw.io ».

Le navigateur enregistre `<project-name>-architecture.drawio`.

L'export est un instantané du projet actuel. Si vous ajoutez ou modifiez des composants par la suite, exportez de nouveau.

## L'ouvrir

- **Dans le navigateur :** rendez-vous sur [app.diagrams.net](https://app.diagrams.net), choisissez « File → Open from → Device… », puis sélectionnez le fichier. Vous pouvez aussi faire glisser le fichier sur le canevas.
- **Dans l'application de bureau :** ouvrez directement le fichier `.drawio`.
- **Dans VS Code :** avec l'extension Draw.io Integration installée, ouvrez le fichier comme n'importe quel autre.

## Ce qui est conservé

| Conservé | Non conservé |
|---|---|
| Les couloirs affichés dans le tableau de bord (Provision, Inventory, Playbooks, Roles, Deploy), avec leurs libellés et leurs tailles | Les couleurs et le mode sombre. L'export utilise le style par défaut de draw.io. |
| Chaque nœud, à la position calculée par la disposition du tableau de bord, avec son titre et sa description | Le traçage au survol et le clic pour modifier |
| Chaque arête, avec son libellé et les points de passage de son tracé à angles droits | Le lien vers le composant kikx |
| Le style en pointillés des nœuds de données et des arêtes structurelles | |

Les nœuds sont placés par-dessus les couloirs, pas à l'intérieur. Si vous déplacez un couloir dans draw.io, sélectionnez les nœuds qui le recouvrent et déplacez-les avec lui.

## Conseils

- Les arêtes sont des connecteurs orthogonaux rattachés à leurs nœuds. Lorsque vous faites glisser un nœud, draw.io recalcule le tracé de l'arête, et vous pouvez faire glisser les points de passage pour la mettre au propre.
- Pour garder le fichier draw.io synchronisé avec le projet, exportez de nouveau après chaque modification plutôt que de modifier les deux. Le tableau de bord ne peut pas réimporter le fichier.

## Voir aussi

- [Comment le diagramme d'architecture est dessiné](../explanation/architecture-diagram.md)

# Documentation de kikx

Cette documentation suit [Diátaxis](https://diataxis.fr) : quatre types de documentation pour quatre besoins différents.

|  | **Apprendre** | **Travailler** |
|---|---|---|
| **Faire** | [Tutoriels](#tutoriels) : apprendre kikx en construisant quelque chose | [Guides pratiques](#guides-pratiques) : accomplir une tâche précise |
| **Comprendre** | [Explications](#explications) : pourquoi kikx fonctionne ainsi | [Référence](#référence) : commandes, champs et formats exacts |

[English version](../en/README.md)

## Tutoriels

Commencez ici si vous découvrez kikx. Chacun construit un projet fonctionnel à partir de zéro.

1. [Votre premier projet avec la CLI](tutorials/first-project-cli.md)
2. [Construire une plateforme Ansible dans le tableau de bord](tutorials/platform-in-the-dashboard.md)

## Guides pratiques

Des recettes pour un objectif précis, en supposant que vous connaissez les bases.

- [Lancer le tableau de bord et le backend](how-to/run-the-dashboard.md)
- [Importer un inventaire Ansible existant](how-to/import-an-inventory.md)
- [Écrire un playbook à plusieurs plays avec des conditions de rôle](how-to/multi-play-playbooks.md)
- [Gérer les group vars en YAML ou en dossier](how-to/group-vars.md)
- [Relier les playbooks avec un playbook site](how-to/site-playbook.md)
- [Générer les rôles utilisés par vos playbooks](how-to/scaffold-roles.md)
- [Résoudre les conflits de fichiers et les vérifications](how-to/resolve-conflicts.md)
- [Partager un projet sous forme de preset](how-to/presets.md)
- [Exporter l'architecture vers draw.io](how-to/export-to-drawio.md)
- [Générer votre propre composant depuis un élément de registre](how-to/custom-registry-item.md)

## Référence

Des faits exacts et complets à consulter.

- [CLI](reference/cli.md)
- [Composants](reference/components.md)
- [API HTTP](reference/http-api.md)
- [Configuration](reference/configuration.md)
- [Format des presets](reference/preset-format.md)
- [Format des éléments de registre](reference/registry-item-format.md)
- [Vérifications](reference/checks.md)

## Explications

Contexte et choix de conception.

- [Vendoriser de vrais fichiers](explanation/vendoring.md)
- [Le registre, source unique de vérité](explanation/registry.md)
- [Comment fonctionne le rendu](explanation/rendering.md)
- [Comment le diagramme d'architecture est dessiné](explanation/architecture-diagram.md)
- [Comment les éléments s'articulent](explanation/project-layout.md)

import type { DriveStep } from "driver.js";

export type TourName = "home" | "builder";

export const TOUR_ROUTES: Record<string, TourName> = {
  "/": "home",
  "/build": "builder",
};

export const tourTarget = (id: string) => `[data-tour="${id}"]`;

export const TOURS: Record<TourName, DriveStep[]> = {
  home: [
    {
      element: tourTarget("welcome"),
      popover: {
        title: "Welcome to kikx",
        description:
          "kikx renders real infrastructure files — Ansible, Kubernetes, Terraform — that you own and edit like any other code. This tour takes a minute.",
      },
    },
    {
      element: tourTarget("cli"),
      popover: {
        title: "The same thing, in your terminal",
        description: "Everything here is also in the kikx CLI. These are the commands you would run.",
      },
    },
    {
      element: tourTarget("templates"),
      popover: {
        title: "Start from a template",
        description: "Open a complete project — a single server, a kubeadm cluster, a multi-tier platform — and adapt it.",
      },
    },
    {
      element: tourTarget("new-project"),
      popover: {
        title: "Or start from scratch",
        description: "Name the project, pick a namespace and an output folder, then add components one by one.",
      },
    },
    {
      element: tourTarget("open-preset"),
      popover: {
        title: "Pick up where you left off",
        description: "Every project downloads as a preset file. Open it here to keep editing.",
      },
    },
    {
      element: tourTarget("data-flow"),
      popover: {
        title: "How it fits together",
        description: "A diagram of how the dashboard, the CLI and the API turn a template into files.",
      },
    },
    {
      element: tourTarget("tour-button"),
      popover: {
        title: "Replay this tour",
        description: "Open it again from here on any page with a tour, including the builder.",
      },
    },
  ],
  builder: [
    {
      element: tourTarget("catalog"),
      popover: {
        title: "Components, stage by stage",
        description:
          "Provision servers, list them in an inventory, configure them with playbooks and roles, then deploy to Kubernetes. A tick shows each stage you have covered.",
      },
    },
    {
      element: tourTarget("editor"),
      popover: {
        title: "Fill in, watch it render",
        description:
          "Every field has a sensible default. The files below update as you type; press ⌘/Ctrl + Enter to add the component.",
      },
    },
    {
      element: tourTarget("project"),
      popover: {
        title: "Your project",
        description:
          "Everything you have added, with its files. Click one to edit it, or download the whole project as a preset to reopen later.",
      },
    },
    {
      element: tourTarget("views"),
      popover: {
        title: "Architecture and checks",
        description:
          "Architecture draws how your components connect. Checks catches conflicts — duplicate hosts, missing groups, unknown roles — before you ship.",
      },
    },
    {
      element: tourTarget("download"),
      popover: {
        title: "Take the files",
        description: "Download everything as a .zip of plain files. Nothing touches your machine until you do.",
      },
    },
  ],
};

"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Panel } from "@/components/dashboard/panel";
import { ComponentForm } from "@/components/dashboard/component-form";
import type { ComponentKind } from "@/lib/schemas";

interface Step {
  value: string;
  label: string;
  description: string;
  tabs: { value: ComponentKind; label: string }[];
}

const STEPS: Step[] = [
  {
    value: "configure",
    label: "1. Configure",
    description: "Ansible playbooks that set up a server you already have.",
    tabs: [
      { value: "ansible", label: "K8s bootstrap" },
      { value: "inventory", label: "Inventory" },
      { value: "groupvars", label: "Group vars" },
      { value: "playbook", label: "Playbook" },
    ],
  },
  {
    value: "deploy",
    label: "2. Deploy",
    description: "Kubernetes manifests for what runs on the cluster.",
    tabs: [
      { value: "deployment", label: "Deployment" },
      { value: "service", label: "Service" },
      { value: "ingress", label: "Ingress" },
    ],
  },
];

export function ComponentTabs() {
  return (
    <Tabs defaultValue={STEPS[0].value}>
      <TabsList className="w-full">
        {STEPS.map((step) => (
          <TabsTrigger key={step.value} value={step.value} className="flex-1">
            {step.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {STEPS.map((step) => (
        <TabsContent
          key={step.value}
          value={step.value}
          forceMount
          className="mt-6 data-[state=inactive]:hidden"
        >
          <Panel title={step.label} description={step.description}>
            <Tabs defaultValue={step.tabs[0].value}>
              <TabsList>
                {step.tabs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {step.tabs.map((tab) => (
                <TabsContent
                  key={tab.value}
                  value={tab.value}
                  forceMount
                  className="mt-6 data-[state=inactive]:hidden"
                >
                  <ComponentForm kind={tab.value} />
                </TabsContent>
              ))}
            </Tabs>
          </Panel>
        </TabsContent>
      ))}
    </Tabs>
  );
}

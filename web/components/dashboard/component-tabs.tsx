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
    value: "provision",
    label: "1. Provision",
    description: "Terraform resources for the servers this project runs on.",
    tabs: [
      { value: "digitalocean", label: "DigitalOcean" },
      { value: "hetzner", label: "Hetzner" },
    ],
  },
  {
    value: "configure",
    label: "2. Configure",
    description: "Ansible playbooks that set the provisioned servers up.",
    tabs: [{ value: "ansible", label: "K8s bootstrap" }],
  },
  {
    value: "deploy",
    label: "3. Deploy",
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
        <TabsContent key={step.value} value={step.value} className="mt-6">
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
                <TabsContent key={tab.value} value={tab.value} className="mt-6">
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

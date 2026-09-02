"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ComponentForm } from "@/components/dashboard/component-form";

export function ComponentTabs({ dir }: { dir: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Add a component</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="deployment">
          <TabsList>
            <TabsTrigger value="deployment">Deployment</TabsTrigger>
            <TabsTrigger value="service">Service</TabsTrigger>
            <TabsTrigger value="ingress">Ingress</TabsTrigger>
          </TabsList>
          <TabsContent value="deployment">
            <ComponentForm dir={dir} kind="deployment" />
          </TabsContent>
          <TabsContent value="service">
            <ComponentForm dir={dir} kind="service" />
          </TabsContent>
          <TabsContent value="ingress">
            <ComponentForm dir={dir} kind="ingress" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

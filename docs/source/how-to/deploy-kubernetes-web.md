# Deploy an app to Kubernetes in the app

The **Deploy** stage of the builder writes Kubernetes manifests. This page shows how to put an app
on Kubernetes with three components that work as a chain: an Ingress sends web traffic to a
Service, and the Service sends it to the pods of a Deployment. Most broken deployments are a broken
link in that chain, so the page also shows how to spot one and fix it.

[Start this lesson](teach:kubernetes)

## Set the project namespace first

Every Deployment, Service and Ingress goes into a Kubernetes namespace. The project has a default
one, shown on the `ns:` badge above the builder columns.

1. Click the `ns:` badge. The **Project settings** dialog opens.
2. In **Default Kubernetes namespace**, type the namespace, for example `shop-prod`.
3. Click **Save**.

Set it before you add components. Components already in the project keep the namespace they were
saved with. New components, and ones you open and save again, use the new one. Inventories,
playbooks and Terraform ignore the namespace.

### Override the namespace for one component

Each Deployment, Service and Ingress also has a **Namespace** field. Left empty, it shows
`project default` and the component uses the project namespace. Type a value to put that one
component somewhere else.

Keep the three components of one app in the same namespace. A Service only selects pods in its own
namespace, and an Ingress only routes to a Service in its own namespace.

## Add the Deployment

The Deployment says which container to run and how many copies to keep alive.

1. Under **Deploy**, click **Deployment**.
2. Fill in the fields:

   | Field | What to enter |
   |-|-|
   | **Name** | The app name, for example `shop`. Also the `app` label on every pod. |
   | **Image** | The container image, with a pinned tag such as `nginx:1.27` rather than `latest`. |
   | **Port** | The port the app listens on inside the container. It is written as `containerPort`. |
   | **Replicas** | How many identical pods run at once. Three lets one die or be updated while two keep serving. |

3. Optionally, click **Add label** to add labels such as `tier` = `web`. They help you filter with
   `kubectl` and are written on the Deployment.
4. Click **Add to project**.

In the **Preview**, `app: shop` appears three times: on the Deployment, in its selector and on the
pod template. The pods always carry `app: <Deployment name>`. Keep that label in mind: the Service
needs it.

## Add the Service

Pods come and go, and each new one gets a new address. A Service gives them one stable name and
spreads traffic across the pods that are alive.

1. Under **Deploy**, click **Service**.
2. Fill in the fields:

   | Field | What to enter |
   |-|-|
   | **Name** | The Service name. Use the Deployment's name, `shop`, unless you have a reason not to. |
   | **Port** | The port other apps call, for example `80`. |
   | **Target port** | Where the Service forwards traffic. It must equal the Deployment's **Port**. Left empty, it uses the Service **Port**. |

3. Click **Add to project**.

### Make the selector match the pods

A Service finds its pods through its selector, `app: <value>`, where the value is the Service's
`app` label. That label defaults to the Service name, which is why a Deployment and a Service with
the same name find each other.

If the Service has a different name, for example `frontend`, its selector is `app: frontend` and it
selects nothing. To keep the name, open the Service, click **Add label**, enter `app` as the key
and the Deployment's name as the value, then click **Save changes**.

Other labels, such as `tier: web`, are written to the Service's `metadata.labels` only. They don't
change the selector, so they never stop the Service from finding its pods.

## Add the Ingress

A Service is only reachable inside the cluster. An Ingress lets the cluster's ingress controller
route outside HTTP traffic to it, by host name and path.

1. Under **Deploy**, click **Ingress**.
2. Fill in the fields:

   | Field | What to enter |
   |-|-|
   | **Name** | Usually the app name. |
   | **Host** | The domain people type, for example `shop.example.com`. Left empty, it becomes `<name>.example.com`. Your DNS must point it at the ingress controller. |
   | **Path** | The URL prefix to route. `/` matches every URL on that host. |
   | **Backend service** | The Service to send traffic to, by name. Pick it from the suggestions, which list the Services in the project. Left empty, it uses the Ingress name. |
   | **Port** | The Service's **Port**, for example `80`. |

3. Click **Add to project**.

## Line up the ports

Each hop must agree with the next:

| From | Must equal |
|-|-|
| Ingress **Port** | Service **Port** |
| Service **Target port** | Deployment **Port** (`containerPort`) |

For example: Ingress port 80, Service port 80, target port 8080, Deployment port 8080. The app
doesn't check ports for you, so compare them in the previews.

## Fix a Service or Ingress that points at nothing

Kubernetes accepts a Service that selects no pods and an Ingress whose Service doesn't exist, but
no traffic gets through. The **Checks** tab reads all components together and warns about both:

- **Service frontend selects app=frontend, but no deployment's pods carry those labels.** Its
  endpoints would be empty and every request would fail.
- **Ingress shop routes to service "shop", which isn't in the project.**

The editor of a flagged component also shows how many checks flag it. To fix a warning:

1. Open the **Checks** tab. Next to the warning, click **Open** followed by the component name, for example **Open frontend**. The component opens in the editor.
2. Fix the link:
   - For a Service, rename it to the Deployment's name, or add the label `app` with the
     Deployment's name as its value.
   - For an Ingress, set **Backend service** to the name of a Service in the project.
3. Click **Save changes**. The warning disappears from **Checks**.

The Ingress warning is fine if the Service already lives in your cluster and you don't manage it
with kikx.

## See the chain in Architecture

Open the **Architecture** tab. In the **Deploy** lane, an arrow labelled **routes to** goes from the
Ingress to its Service, and one labelled **selects** goes from the Service to the Deployment. A
missing arrow means a broken link. When **Checks** shows **No conflicts found** and both arrows are
there, export the project and apply it with `kubectl apply`.

## See also

- [Let kikx show you](../tutorials/teach-me.md)
- [Components](../reference/components.md#k8sdeployment)
- [Checks](../reference/checks.md#svc-selector)
- [Resolve file conflicts and checks](resolve-conflicts.md)
- [How the architecture diagram is drawn](../explanation/architecture-diagram.md)

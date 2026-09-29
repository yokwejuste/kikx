import { NODE_HEIGHT, NODE_WIDTH, type ArchitectureLayout } from "@/lib/architecture-layout";

function xml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Serialises the laid-out diagram as a draw.io (diagrams.net) file: swimlanes, nodes and
 * orthogonal edges keep the exact positions and waypoints from the layout, so the file opens
 * already arranged and stays fully editable.
 */
export function toDrawio(layout: ArchitectureLayout, title: string): string {
  const cells: string[] = ['<mxCell id="0"/>', '<mxCell id="1" parent="0"/>'];
  const cellId = new Map<string, string>();

  layout.lanes.forEach((lane) => {
    cells.push(
      `<mxCell id="lane-${lane.id}" value="${xml(lane.label)}" style="swimlane;startSize=36;horizontal=1;fillColor=none;strokeColor=#999999;fontStyle=1;rounded=0;" vertex="1" parent="1">` +
        `<mxGeometry x="${lane.x}" y="${lane.y}" width="${lane.width}" height="${lane.height}" as="geometry"/></mxCell>`,
    );
  });

  layout.nodes.forEach((node, index) => {
    const id = `n${index}`;
    cellId.set(node.id, id);
    const value = `<b>${xml(node.data.label)}</b><br><font style="font-size:10px">${xml(node.data.description)}</font>`;
    const dashed = node.data.kind === "data" ? "dashed=1;" : "";
    cells.push(
      `<mxCell id="${id}" value="${xml(value)}" style="rounded=1;whiteSpace=wrap;html=1;arcSize=12;align=left;spacingLeft=10;${dashed}" vertex="1" parent="1">` +
        `<mxGeometry x="${node.x}" y="${node.y}" width="${NODE_WIDTH}" height="${NODE_HEIGHT}" as="geometry"/></mxCell>`,
    );
  });

  layout.edges.forEach((edge, index) => {
    const source = cellId.get(edge.source);
    const target = cellId.get(edge.target);
    if (!source || !target) return;
    const waypoints = edge.points.slice(1, -1);
    const dashed = edge.tone === "structure" ? "dashed=1;" : "";
    const points = waypoints.length
      ? `<Array as="points">${waypoints.map((p) => `<mxPoint x="${p.x}" y="${p.y}"/>`).join("")}</Array>`
      : "";
    cells.push(
      `<mxCell id="e${index}" value="${xml(edge.label)}" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=block;endFill=1;fontSize=10;labelBackgroundColor=#ffffff;${dashed}" edge="1" parent="1" source="${source}" target="${target}">` +
        `<mxGeometry relative="1" as="geometry">${points}</mxGeometry></mxCell>`,
    );
  });

  return (
    `<mxfile host="kikx"><diagram name="${xml(title)}" id="kikx-architecture">` +
    `<mxGraphModel grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="0" math="0" shadow="0"><root>` +
    cells.join("") +
    `</root></mxGraphModel></diagram></mxfile>`
  );
}

export function downloadDrawio(layout: ArchitectureLayout, title: string) {
  const blob = new Blob([toDrawio(layout, title)], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${title || "architecture"}.drawio`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

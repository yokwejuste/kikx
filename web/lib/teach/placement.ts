export type CardSide = "below" | "above" | "right" | "left";

export interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface CardPlacement {
  top: number;
  left: number;
  side: CardSide | null;
  arrow: number;
}

export interface PlacementRoom {
  gap: number;
  margin: number;
  header: number;
  arrowInset: number;
}

const ORDER: CardSide[] = ["below", "above", "right", "left"];

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

function fits(side: CardSide, target: Box, card: Size, viewport: Size, room: PlacementRoom): boolean {
  switch (side) {
    case "below":
      return viewport.height - (target.top + target.height) - room.margin >= card.height + room.gap;
    case "above":
      return target.top - room.header >= card.height + room.gap;
    case "right":
      return viewport.width - (target.left + target.width) - room.margin >= card.width + room.gap;
    case "left":
      return target.left - room.margin >= card.width + room.gap;
  }
}

function dockedPlacement(card: Size, viewport: Size, room: PlacementRoom): CardPlacement {
  return {
    top: viewport.height - card.height - room.margin,
    left: (viewport.width - card.width) / 2,
    side: null,
    arrow: 0,
  };
}

export function placeCard(
  target: Box | null,
  card: Size,
  viewport: Size,
  previous: CardSide | null,
  room: PlacementRoom,
): CardPlacement {
  if (!target) return dockedPlacement(card, viewport, room);
  const candidates = previous ? [previous, ...ORDER.filter((side) => side !== previous)] : ORDER;
  const side = candidates.find((candidate) => fits(candidate, target, card, viewport, room));
  if (!side) return dockedPlacement(card, viewport, room);

  const centerX = target.left + target.width / 2;
  const centerY = target.top + target.height / 2;
  if (side === "below" || side === "above") {
    const left = clamp(centerX - card.width / 2, room.margin, viewport.width - card.width - room.margin);
    const top = side === "below" ? target.top + target.height + room.gap : target.top - room.gap - card.height;
    return { top, left, side, arrow: clamp(centerX - left, room.arrowInset, card.width - room.arrowInset) };
  }
  const top = clamp(centerY - card.height / 2, room.header, viewport.height - card.height - room.margin);
  const left = side === "right" ? target.left + target.width + room.gap : target.left - room.gap - card.width;
  return { top, left, side, arrow: clamp(centerY - top, room.arrowInset, card.height - room.arrowInset) };
}

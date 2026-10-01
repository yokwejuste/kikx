import { test } from "node:test";
import assert from "node:assert/strict";
import { placeCard } from "../lib/teach/placement.ts";

const room = { gap: 14, margin: 16, header: 72, arrowInset: 24 };
const viewport = { width: 1440, height: 900 };
const card = { width: 400, height: 200 };

test("a target with room below gets the card underneath, arrow under its centre", () => {
  const placement = placeCard({ top: 100, left: 500, width: 200, height: 40 }, card, viewport, null, room);
  assert.equal(placement.side, "below");
  assert.equal(placement.top, 154);
  assert.equal(placement.left + placement.arrow, 600);
});

test("a target near the bottom gets the card above it", () => {
  const placement = placeCard({ top: 780, left: 500, width: 200, height: 40 }, card, viewport, null, room);
  assert.equal(placement.side, "above");
  assert.equal(placement.top + card.height + room.gap, 780);
});

test("a tall target falls back to the side with room", () => {
  const placement = placeCard({ top: 80, left: 100, width: 600, height: 800 }, card, viewport, null, room);
  assert.equal(placement.side, "right");
  assert.equal(placement.left, 714);
});

test("the previous side is kept while it still fits", () => {
  const placement = placeCard({ top: 300, left: 500, width: 200, height: 40 }, card, viewport, "above", room);
  assert.equal(placement.side, "above");
});

test("no target, or no room anywhere, docks the card at the bottom without an arrow", () => {
  assert.equal(placeCard(null, card, viewport, null, room).side, null);
  const huge = placeCard({ top: 0, left: 0, width: 1440, height: 900 }, card, viewport, null, room);
  assert.equal(huge.side, null);
  assert.equal(huge.top, viewport.height - card.height - room.margin);
});

test("the arrow stays inside the card even when the card is pushed against an edge", () => {
  const placement = placeCard({ top: 100, left: 0, width: 20, height: 20 }, card, viewport, null, room);
  assert.equal(placement.left, room.margin);
  assert.ok(placement.arrow >= room.arrowInset && placement.arrow <= card.width - room.arrowInset);
});

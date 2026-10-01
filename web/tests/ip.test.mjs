import { test } from "node:test";
import assert from "node:assert/strict";
import { isAddress, parseAddress, parseRange, rangeContains, rangesOverlap } from "../lib/net/ip.ts";

const range = (value) => {
  const result = parseRange(value);
  assert.ok(result.ok, value);
  return result.range;
};

test("parses and normalises IPv4 and IPv6 addresses", () => {
  assert.deepEqual(parseAddress(" 10.0.0.5 "), { ok: true, address: "10.0.0.5" });
  assert.deepEqual(parseAddress("2001:0db8:0000::0001"), { ok: true, address: "2001:db8::1" });
});

test("rejects malformed addresses", () => {
  for (const value of ["", "10.0.0", "10.0.0.256", "010.0.0.1", "0x0a.0.0.1", "web-1", "2001:db8:::1", "fe80::1%eth0"]) {
    assert.deepEqual(parseAddress(value), { ok: false, reason: "invalid" }, value);
    assert.equal(isAddress(value), false, value);
  }
});

test("a range in place of an address suggests the single address", () => {
  assert.deepEqual(parseAddress("10.0.0.5/24"), { ok: false, reason: "range", address: "10.0.0.5" });
  assert.deepEqual(parseAddress("2001:db8::7/64"), { ok: false, reason: "range", address: "2001:db8::7" });
  assert.deepEqual(parseAddress("10.0.0.5/40"), { ok: false, reason: "invalid" });
});

test("parses and normalises ranges", () => {
  assert.equal(range("10.10.0.0/16").text, "10.10.0.0/16");
  assert.equal(range(" 2001:0db8::/32 ").text, "2001:db8::/32");
  assert.equal(range("0.0.0.0/0").prefix, 0);
});

test("a range that does not start on its boundary suggests its network", () => {
  assert.deepEqual(parseRange("10.0.0.5/24"), { ok: false, reason: "notNetwork", network: "10.0.0.0/24" });
});

test("rejects malformed ranges", () => {
  for (const value of ["10.0.0.0", "10.0.0.0/33", "10.0.0.0/", "/16", "a.b.c.d/8", "2001:db8::/129", "10.0.0.0/8/8", "10.0.0.0/-1"]) {
    assert.deepEqual(parseRange(value), { ok: false, reason: "invalid" }, value);
  }
});

test("checks containment", () => {
  const net = range("10.10.0.0/16");
  assert.equal(rangeContains(net, "10.10.255.1"), true);
  assert.equal(rangeContains(net, "10.11.0.1"), false);
  assert.equal(rangeContains(net, "::1"), false);
  assert.equal(rangeContains(net, "not-an-ip"), false);
});

test("checks overlap", () => {
  const wide = range("10.0.0.0/8");
  const inner = range("10.20.0.0/16");
  assert.equal(rangesOverlap(wide, inner), true);
  assert.equal(rangesOverlap(inner, wide), true);
  assert.equal(rangesOverlap(inner, inner), true);
  assert.equal(rangesOverlap(inner, range("192.168.0.0/16")), false);
  assert.equal(rangesOverlap(range("10.0.0.0/24"), range("10.0.1.0/24")), false);
  assert.equal(rangesOverlap(wide, range("fd00::/8")), false);
});

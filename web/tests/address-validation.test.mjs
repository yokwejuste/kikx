import "./support/alias.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

const { fieldFormatIssue, inventoryFormSchema } = await import("../lib/forms/schemas.ts");

function hostAddressMessages(address) {
  const result = inventoryFormSchema.safeParse({
    component: "inventory",
    name: "prod",
    hosts: [{ name: "web-1", ansibleHost: address, groups: ["web"] }],
    groups: [],
  });
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

test("a host address accepts IPv4, IPv6 and hostnames", () => {
  for (const address of ["10.0.0.5", "2001:db8::1", "web-1.example.com", "localhost", ""]) {
    assert.deepEqual(hostAddressMessages(address), [], address);
  }
});

test("a host address rejects a range and suggests the single address", () => {
  assert.deepEqual(hostAddressMessages("10.0.0.5/24"), ["validation.addressRange?address=10.0.0.5"]);
});

test("a host address rejects malformed IPs", () => {
  for (const address of ["10.0.0.256", "999.1.1.1", "2001:db8:::1", "bad_host!"]) {
    assert.deepEqual(hostAddressMessages(address), ["validation.addressInvalid"], address);
  }
});

test("ip fields accept one address", () => {
  assert.equal(fieldFormatIssue("ip", "10.0.0.5"), null);
  assert.equal(fieldFormatIssue("ip", "10.0.0.5/32"), "validation.addressRange?address=10.0.0.5");
  assert.equal(fieldFormatIssue("ip", "web-1"), "validation.ipInvalid");
});

test("cidr fields accept a network range", () => {
  assert.equal(fieldFormatIssue("cidr", "10.10.0.0/16"), null);
  assert.equal(fieldFormatIssue("cidr", "10.10.0.9/16"), "validation.cidrNotNetwork?network=10.10.0.0%2F16");
  assert.equal(fieldFormatIssue("cidr", "10.10.0.0"), "validation.cidrInvalid");
});

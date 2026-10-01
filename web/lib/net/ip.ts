import ipaddr from "ipaddr.js";

type Address = ipaddr.IPv4 | ipaddr.IPv6;

export interface IpRange {
  network: Address;
  prefix: number;
  text: string;
}

export type AddressResult =
  | { ok: true; address: string }
  | { ok: false; reason: "invalid" }
  | { ok: false; reason: "range"; address: string };

export type RangeResult =
  | { ok: true; range: IpRange }
  | { ok: false; reason: "invalid" }
  | { ok: false; reason: "notNetwork"; network: string };

const PREFIX_RE = /^\d{1,3}$/;

function parseIp(value: string): Address | null {
  if (ipaddr.IPv4.isValidFourPartDecimal(value)) return ipaddr.IPv4.parse(value);
  if (!value.includes("%") && ipaddr.IPv6.isValid(value)) return ipaddr.IPv6.parse(value);
  return null;
}

function formatIp(address: Address): string {
  return address.kind() === "ipv6" ? (address as ipaddr.IPv6).toRFC5952String() : address.toString();
}

function maxPrefix(address: Address): number {
  return address.kind() === "ipv4" ? 32 : 128;
}

function networkOf(address: Address, prefix: number): Address {
  const cidr = `${address.toString()}/${prefix}`;
  return address.kind() === "ipv4" ? ipaddr.IPv4.networkAddressFromCIDR(cidr) : ipaddr.IPv6.networkAddressFromCIDR(cidr);
}

function splitRange(value: string): { address: Address; prefix: number } | null {
  const [addressPart, prefixPart, ...rest] = value.trim().split("/");
  if (rest.length || prefixPart === undefined || !PREFIX_RE.test(prefixPart)) return null;
  const address = parseIp(addressPart);
  const prefix = Number(prefixPart);
  if (!address || prefix > maxPrefix(address)) return null;
  return { address, prefix };
}

export function parseAddress(value: string): AddressResult {
  const trimmed = value.trim();
  if (trimmed.includes("/")) {
    const range = splitRange(trimmed);
    return range ? { ok: false, reason: "range", address: formatIp(range.address) } : { ok: false, reason: "invalid" };
  }
  const address = parseIp(trimmed);
  return address ? { ok: true, address: formatIp(address) } : { ok: false, reason: "invalid" };
}

export function parseRange(value: string): RangeResult {
  const parts = splitRange(value);
  if (!parts) return { ok: false, reason: "invalid" };
  const network = networkOf(parts.address, parts.prefix);
  const text = `${formatIp(network)}/${parts.prefix}`;
  if (formatIp(network) !== formatIp(parts.address)) return { ok: false, reason: "notNetwork", network: text };
  return { ok: true, range: { network, prefix: parts.prefix, text } };
}

export function isAddress(value: string): boolean {
  return parseAddress(value).ok;
}

export function rangeContains(range: IpRange, address: string): boolean {
  const parsed = parseIp(address.trim());
  return !!parsed && parsed.kind() === range.network.kind() && parsed.match(range.network, range.prefix);
}

export function rangesOverlap(first: IpRange, second: IpRange): boolean {
  if (first.network.kind() !== second.network.kind()) return false;
  const shorter = Math.min(first.prefix, second.prefix);
  return first.network.match(second.network, shorter);
}

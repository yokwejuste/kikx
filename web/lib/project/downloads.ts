import type { AddedComponent, ProjectDetails } from "@/lib/project/context";

const DOWNLOAD_KEY = "kikx:download";

export interface DownloadRecord {
  at: number;
  fingerprint: string;
}

export function projectFingerprint(details: ProjectDetails, components: AddedComponent[]): string {
  const source = JSON.stringify([details, components.map((c) => [c.id, c.files])]);
  let hash = 5381;
  for (let index = 0; index < source.length; index++) {
    hash = (Math.imul(hash, 33) ^ source.charCodeAt(index)) >>> 0;
  }
  return `${components.length}:${hash.toString(36)}`;
}

export function loadDownloadRecord(): DownloadRecord | null {
  try {
    const raw = localStorage.getItem(DOWNLOAD_KEY);
    return raw ? (JSON.parse(raw) as DownloadRecord) : null;
  } catch {
    return null;
  }
}

function saveDownloadRecord(record: DownloadRecord): void {
  try {
    localStorage.setItem(DOWNLOAD_KEY, JSON.stringify(record));
  } catch {
    return;
  }
}

export function recordDownload(details: ProjectDetails, components: AddedComponent[]): DownloadRecord {
  const record = { at: Date.now(), fingerprint: projectFingerprint(details, components) };
  saveDownloadRecord(record);
  return record;
}

export function clearDownloadRecord(): void {
  try {
    localStorage.removeItem(DOWNLOAD_KEY);
  } catch {
    return;
  }
}

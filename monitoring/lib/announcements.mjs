import { readFile } from "node:fs/promises";

export const ANNOUNCEMENT_FINGERPRINT_PATHS = [
  "url",
  "title",
  "publishedAt",
  "priceEuro",
  "surfaceM2",
  "rooms",
  "floor"
];

const TRACKING_PARAMETERS = new Set([
  "fbclid",
  "gclid",
  "dclid",
  "msclkid",
  "mc_cid",
  "mc_eid"
]);

export function canonicalizeUrl(rawUrl) {
  const url = new URL(rawUrl);
  if (!new Set(["http:", "https:"]).has(url.protocol)) throw new Error("URL d'annonce non HTTP(S).");
  url.hash = "";
  for (const name of [...url.searchParams.keys()]) {
    if (name.toLowerCase().startsWith("utm_") || TRACKING_PARAMETERS.has(name.toLowerCase())) {
      url.searchParams.delete(name);
    }
  }
  url.searchParams.sort();
  return url.toString();
}

function optionalNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function sanitizeAnnouncement(candidate) {
  const url = canonicalizeUrl(candidate.url);
  const source = String(candidate.source ?? new URL(url).hostname).trim();
  const externalId = candidate.externalId ? String(candidate.externalId).trim() : null;
  return {
    id: externalId ? `${source}::${externalId}` : url,
    source,
    externalId,
    url,
    title: candidate.title ? String(candidate.title).trim() : "Annonce immobilière",
    publishedAt: candidate.publishedAt ?? null,
    priceEuro: optionalNumber(candidate.priceEuro),
    surfaceM2: optionalNumber(candidate.surfaceM2),
    rooms: optionalNumber(candidate.rooms),
    floor: candidate.floor === null || candidate.floor === undefined ? null : String(candidate.floor),
  };
}

export async function loadAnnouncementCandidates(filePath) {
  let raw;
  try {
    raw = await readFile(filePath, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
  const payload = JSON.parse(raw);
  if (!Array.isArray(payload)) throw new Error("Le fichier de candidats annonces doit contenir un tableau JSON.");
  return payload.map(sanitizeAnnouncement);
}

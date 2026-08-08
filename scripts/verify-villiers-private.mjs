import { webcrypto } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const password = (await readFile(join(root, ".private", "github-pages-password.txt"), "utf8")).trim();
const archive = JSON.parse(await readFile(join(root, "github-pages", "public", "villiers-private.enc.json"), "utf8"));
const context = "villiers-98-private-addresses-v2";
const decode = (value) => Buffer.from(value, "base64");

const decrypt = async (candidate) => {
  const encoder = new TextEncoder();
  const material = await webcrypto.subtle.importKey("raw", encoder.encode(candidate), "PBKDF2", false, ["deriveKey"]);
  const key = await webcrypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", iterations: 600_000, salt: decode(archive.kdf.salt) },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
  const plaintext = await webcrypto.subtle.decrypt(
    { name: "AES-GCM", iv: decode(archive.cipher.iv), additionalData: encoder.encode(context), tagLength: 128 },
    key,
    decode(archive.cipher.data),
  );
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(plaintext));
};

const payload = await decrypt(password);
const synchronized = JSON.parse(await readFile(join(root, ".private", "villiers-outreach-sanitized.json"), "utf8"));
const owners = Object.entries(payload.owners ?? {});
const available = owners.filter(([, entry]) => Boolean(entry.address)).length;
const outreach = Object.entries(payload.outreach ?? {});
const stageCounts = Object.fromEntries([...new Set(outreach.map(([, entry]) => entry?.stage))].map((stage) => [stage, outreach.filter(([, entry]) => entry?.stage === stage).length]));
if (archive.version !== 2 || payload.version !== 2 || owners.length !== 29 || available !== 27 || outreach.length !== 41) {
  throw new Error("Encrypted registry failed its count or version checks");
}
if (owners.some(([, entry]) => entry.letterReady !== Boolean(entry.address))) {
  throw new Error("Letter readiness does not match the address registry");
}
if (synchronized?.schemaVersion !== 1 || synchronized?.privacy !== "SANITIZED_ENCRYPT_BEFORE_PUBLISHING" || !Array.isArray(synchronized.records)) {
  throw new Error("Sanitized outreach registry is invalid");
}
for (const expected of synchronized.records) {
  const actual = payload.outreach?.[expected.ownerKey];
  if (!actual || actual.stage !== expected.stage || actual.sentAt !== expected.sentAt || actual.updatedAt !== expected.updatedAt || JSON.stringify(actual.lotIds) !== JSON.stringify(expected.lotIds) || actual.sourceKind !== expected.sourceKind || actual.confidence !== expected.confidence) {
    throw new Error(`Encrypted outreach state does not match ${expected.ownerKey}`);
  }
}

let wrongPasswordRejected = false;
try {
  await decrypt(`${password}-incorrect`);
} catch {
  wrongPasswordRejected = true;
}
if (!wrongPasswordRejected) throw new Error("Wrong password was unexpectedly accepted");

console.log(JSON.stringify({ protectedOwners: owners.length, addressesAvailable: available, addressesMissing: owners.length - available, trackedOwners: outreach.length, stageCounts, synchronizedRecords: synchronized.records.length, wrongPasswordRejected }));

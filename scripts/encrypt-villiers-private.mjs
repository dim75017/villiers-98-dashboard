import { randomBytes, webcrypto } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const root = process.cwd();
const passwordPath = join(root, ".private", "github-pages-password.txt");
const registryPath = join(root, ".private", "owner-address-watch.json");
const outputPath = join(root, "github-pages", "public", "villiers-private.enc.json");
const context = "villiers-98-private-addresses-v2";
const iterations = 600_000;

const password = (await readFile(passwordPath, "utf8")).trim();
if (password.length < 20) throw new Error("Private dashboard password is missing or too short");

const registry = JSON.parse(await readFile(registryPath, "utf8"));
if (registry?.schemaVersion !== 2 || !Array.isArray(registry.owners)) throw new Error("Private owner registry is invalid");

const owners = Object.fromEntries(
  registry.owners
    .filter((owner) => owner?.mailboxPhotoStatus === "not_seen")
    .map((owner) => {
      const address = typeof owner.correspondenceAddress === "string" ? owner.correspondenceAddress.trim() || null : null;
      const source = typeof owner.addressSource === "string" ? owner.addressSource.trim() || null : null;
      const status = typeof owner.addressStatus === "string" ? owner.addressStatus.trim() || null : null;
      return [owner.ownerKey, { address, source, status, letterReady: Boolean(address) }];
    }),
);
const entries = Object.entries(owners);
const available = entries.filter(([, owner]) => Boolean(owner.address)).length;
if (entries.length !== 29 || available !== 27) throw new Error("Private address counts do not match the validated registry");
const outreach = Object.fromEntries(
  registry.owners.map((owner) => {
    const hold = owner?.outreachHold === true || String(owner?.mailingUse ?? "").toLowerCase().includes("non exploitable");
    return [owner.ownerKey, { stage: hold ? "to-send" : "sent", sentAt: hold ? null : "2026-08-05" }];
  }),
);
if (Object.keys(outreach).length !== 41) throw new Error("Private outreach count does not match the validated registry");

const encoder = new TextEncoder();
let salt = randomBytes(16);
try {
  const existing = JSON.parse(await readFile(outputPath, "utf8"));
  if (
    existing?.version === 2 &&
    existing?.kdf?.name === "PBKDF2" &&
    existing?.kdf?.hash === "SHA-256" &&
    existing?.kdf?.iterations === iterations &&
    typeof existing?.kdf?.salt === "string"
  ) {
    const existingSalt = Buffer.from(existing.kdf.salt, "base64");
    if (existingSalt.length === 16 && existingSalt.toString("base64") === existing.kdf.salt) salt = existingSalt;
  }
} catch {
  // A missing or invalid previous archive starts a fresh trusted-device generation.
}
const iv = randomBytes(12);
const keyMaterial = await webcrypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"]);
const key = await webcrypto.subtle.deriveKey(
  { name: "PBKDF2", hash: "SHA-256", iterations, salt },
  keyMaterial,
  { name: "AES-GCM", length: 256 },
  false,
  ["encrypt"],
);
const plaintext = encoder.encode(JSON.stringify({ version: 2, owners, outreach }));
const encrypted = await webcrypto.subtle.encrypt(
  { name: "AES-GCM", iv, additionalData: encoder.encode(context), tagLength: 128 },
  key,
  plaintext,
);
const base64 = (value) => Buffer.from(value).toString("base64");
const payload = {
  version: 2,
  kdf: { name: "PBKDF2", hash: "SHA-256", iterations, salt: base64(salt) },
  cipher: { name: "AES-GCM", iv: base64(iv), data: base64(encrypted) },
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(payload)}\n`, "utf8");
console.log(JSON.stringify({ protectedOwners: entries.length, addressesAvailable: available, addressesMissing: entries.length - available }));

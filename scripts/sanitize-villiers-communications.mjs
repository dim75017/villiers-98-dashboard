import { readFile, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

const root = process.cwd();
const inputPath = join(root, ".private", "villiers-communications-state.json");
const registryPath = join(root, ".private", "owner-address-watch.json");
const lotsPath = join(root, "app", "lots.json");
const outputPath = join(root, ".private", "villiers-outreach-sanitized.json");
const stages = new Set(["to-send", "sent", "replied", "declined", "in-progress", "acquired"]);
const sourceKinds = new Set(["gmail", "sms", "whatsapp", "drive", "manual", "notarial-email"]);
const confidenceLevels = new Set(["confirmed", "strong", "weak"]);

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const isIsoInstant = (value) => typeof value === "string" && Number.isFinite(Date.parse(value));
const isDate = (value) => value === null || (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value));

const [privateState, registry, lots] = await Promise.all([
  readJson(inputPath),
  readJson(registryPath),
  readJson(lotsPath),
]);

if (privateState?.schemaVersion !== 1 || privateState?.privacy !== "LOCAL_PRIVATE_DO_NOT_COMMIT_OR_PUBLISH" || !Array.isArray(privateState.records) || !isIsoInstant(privateState.updatedAt)) {
  throw new Error("Private communications state is invalid");
}
if (registry?.schemaVersion !== 2 || !Array.isArray(registry.owners)) throw new Error("Private owner registry is invalid");
if (!Array.isArray(lots)) throw new Error("Lots registry is invalid");

const allowedOwners = new Set(registry.owners.map((owner) => owner?.ownerKey).filter((ownerKey) => typeof ownerKey === "string"));
const allowedLots = new Set(lots.map((lot) => lot?.lot).filter((lotId) => Number.isInteger(lotId)));
const seenOwners = new Set();
const records = privateState.records.map((record) => {
  if (!record || typeof record !== "object" || Array.isArray(record)) throw new Error("Communications record is invalid");
  const { ownerKey, stage, sentAt = null, updatedAt, sourceKind, confidence, lotIds = [] } = record;
  if (typeof ownerKey !== "string" || !allowedOwners.has(ownerKey) || seenOwners.has(ownerKey)) throw new Error(`Unknown or duplicate owner: ${ownerKey}`);
  if (!stages.has(stage)) throw new Error(`Invalid stage for ${ownerKey}`);
  if (!isDate(sentAt) || !isIsoInstant(updatedAt)) throw new Error(`Invalid date for ${ownerKey}`);
  if (!sourceKinds.has(sourceKind) || !confidenceLevels.has(confidence)) throw new Error(`Invalid source metadata for ${ownerKey}`);
  if (!Array.isArray(lotIds) || lotIds.some((lotId) => !Number.isInteger(lotId) || !allowedLots.has(lotId))) throw new Error(`Invalid lot mapping for ${ownerKey}`);
  seenOwners.add(ownerKey);
  return {
    ownerKey,
    stage,
    sentAt,
    updatedAt,
    lotIds: [...new Set(lotIds)].sort((a, b) => a - b),
    sourceKind,
    confidence,
  };
}).sort((a, b) => a.ownerKey.localeCompare(b.ownerKey, "fr"));

const output = {
  schemaVersion: 1,
  privacy: "SANITIZED_ENCRYPT_BEFORE_PUBLISHING",
  generatedAt: privateState.updatedAt,
  records,
};

const outputRoot = resolve(root, ".private");
const relativeOutput = relative(outputRoot, resolve(outputPath));
if (!relativeOutput || relativeOutput.startsWith("..") || relativeOutput.includes("..")) throw new Error("Sanitized output path escaped private directory");
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ records: records.length, output: relative(root, outputPath) }));

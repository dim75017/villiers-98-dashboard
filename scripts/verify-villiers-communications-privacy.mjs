import { execFileSync } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const privatePath = join(root, ".private", "villiers-communications-state.json");
const sanitizedPath = join(root, ".private", "villiers-outreach-sanitized.json");
const forbiddenPlaintextPath = join(root, "app", "outreach-sync.json");

const trackedPrivateFiles = execFileSync("git", ["ls-files", ".private"], { cwd: root, encoding: "utf8", windowsHide: true }).trim();
if (trackedPrivateFiles) throw new Error("A private communications file is tracked by Git");

try {
  await access(forbiddenPlaintextPath);
  throw new Error("Plaintext outreach state must not be published from app/");
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

const [privateState, sanitized] = await Promise.all([
  readFile(privatePath, "utf8").then(JSON.parse),
  readFile(sanitizedPath, "utf8").then(JSON.parse),
]);
if (privateState?.privacy !== "LOCAL_PRIVATE_DO_NOT_COMMIT_OR_PUBLISH" || sanitized?.privacy !== "SANITIZED_ENCRYPT_BEFORE_PUBLISHING") {
  throw new Error("Communications privacy markers are invalid");
}

const publicKeys = new Set(["ownerKey", "stage", "sentAt", "updatedAt", "lotIds", "sourceKind", "confidence"]);
for (const record of sanitized.records ?? []) {
  if (Object.keys(record).some((key) => !publicKeys.has(key))) throw new Error(`Unexpected sanitized field for ${record.ownerKey}`);
  const serialized = JSON.stringify(record);
  if (/@|\b(?:telephone|phone|address|adresse|message|excerpt|texte)\b/i.test(serialized)) throw new Error(`Sensitive field detected for ${record.ownerKey}`);
}

console.log(JSON.stringify({ privateRecords: privateState.records?.length ?? 0, sanitizedRecords: sanitized.records?.length ?? 0, gitPrivateFiles: 0 }));

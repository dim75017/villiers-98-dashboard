import { appendFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export async function readJsonIfExists(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

export async function ensurePrivateStateDir(configDir, configuredPath) {
  const stateDir = path.resolve(configDir, configuredPath ?? "private");
  const workspaceRoot = path.resolve(configDir, "..");
  const relative = path.relative(workspaceRoot, stateDir);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Le dossier d'état doit rester dans le dépôt local.");
  }
  await mkdir(stateDir, { recursive: true });
  return stateDir;
}

export async function writeJsonAtomic(filePath, value) {
  const tempPath = `${filePath}.${process.pid}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(tempPath, filePath);
}

export async function appendNdjson(filePath, values) {
  if (!values.length) return;
  await appendFile(filePath, `${values.map((value) => JSON.stringify(value)).join("\n")}\n`, "utf8");
}

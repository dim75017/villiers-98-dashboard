import { readFile, writeFile } from "node:fs/promises";

const files = ["app/lots.json", "app/owners.json"];

for (const file of files) {
  const rows = JSON.parse(await readFile(file, "utf8"));
  if (!Array.isArray(rows)) throw new Error(`${file} must contain an array`);
  for (const row of rows) {
    if (!row || typeof row !== "object") throw new Error(`${file} contains an invalid row`);
    if ("adresse" in row) row.adresse = null;
    if ("telephone" in row) row.telephone = null;
    if ("email" in row) row.email = null;
  }
  await writeFile(file, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
}

console.log(JSON.stringify({ sanitizedFiles: files.length }));

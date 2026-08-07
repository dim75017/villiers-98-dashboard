import { readFileSync, writeFileSync } from "node:fs";

const lotNumber = 15;
const acquisitionDate = "2026-08-06T00:00:00";
const acquisitionPrice = 29_000;
const acquiredTantiemes = 25;
const acquiredOwnerJson = "Dimitri SOMOGUY";
const acquiredOwnerPage = "SOMOGUY Dimitri";
const formerOwner = "CHENE-BERNARDIE Philippe";
const sourceNote = "Information fournie par Dimitri 06/08/2026";

const readText = (path) => readFileSync(path, "utf8");
const writeJson = (path, value) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
const appendSource = (current) => Array.from(new Set(String(current ?? "").split(";").map((item) => item.trim()).filter(Boolean).concat(sourceNote))).join(";");

const lotsPath = "app/lots.json";
const ownersPath = "app/owners.json";
const pagePath = "app/page.tsx";

const lots = JSON.parse(readText(lotsPath));
const lot15 = lots.find((lot) => lot.lot === lotNumber);
if (!lot15) throw new Error("Lot 15 introuvable dans app/lots.json");
if (lot15.tantiemes !== acquiredTantiemes) throw new Error(`Lot 15: tantièmes attendus ${acquiredTantiemes}, trouvés ${lot15.tantiemes}`);

lot15.proprietaire = acquiredOwnerJson;
lot15.type = "Personne physique";
lot15.dateAcquisition = acquisitionDate;
lot15.prixAcquisition = acquisitionPrice;
lot15.potentiel = "P0";
lot15.commentaires = "Offre d'achat acceptée pour Dimitri Somoguy, prix de 29 000 € hors frais de notaire. Acte authentique à régulariser.";
lot15.sources = appendSource(lot15.sources);
writeJson(lotsPath, lots);

const owners = JSON.parse(readText(ownersPath));
const dimitri = owners.find((owner) => owner.proprietaire === acquiredOwnerPage);
if (!dimitri) throw new Error("Propriétaire SOMOGUY Dimitri introuvable dans app/owners.json");

dimitri.tantiemes = 824 + acquiredTantiemes;
dimitri.part = dimitri.tantiemes / 10_000;
dimitri.lotsProuves = "7, 15, 40, 85";
dimitri.sources = appendSource(dimitri.sources);

const chene = owners.find((owner) => owner.proprietaire === formerOwner);
if (chene) {
  chene.tantiemes = 0;
  chene.part = 0;
  chene.lotsProuves = null;
  chene.priorite = "P0";
  chene.pourquoi = "Lot 15 acquis par Dimitri Somoguy; propriétaire retiré de la prospection.";
  chene.prochaineAction = "Aucune";
  chene.statut = "Retiré de la prospection";
  chene.sources = appendSource(chene.sources);
}

const totalTantiemes = owners.reduce((sum, owner) => sum + Number(owner.tantiemes ?? 0), 0);
if (totalTantiemes !== 10_000) throw new Error(`Total des tantièmes incohérent: ${totalTantiemes}`);
writeJson(ownersPath, owners);

let page = readText(pagePath);
const replacements = [
  ["\"SOMOGUY Dimitri\": [7, 40, 85],", "\"SOMOGUY Dimitri\": [7, 15, 40, 85],"],
  ["\"CHENE-BERNARDIE Philippe\": [15],", "\"CHENE-BERNARDIE Philippe\": [],"],
  ["const fundsCommittedToDate = 3_800_000 + 3_020_000;", "const fundsCommittedToDate = 3_800_000 + 3_020_000 + 29_000;"]
];
for (const [from, to] of replacements) {
  if (!page.includes(to)) {
    if (!page.includes(from)) throw new Error(`Remplacement introuvable dans app/page.tsx: ${from}`);
    page = page.replace(from, to);
  }
}
writeFileSync(pagePath, page);

console.log("Villiers dashboard updated for parking lot 15 acquisition.");

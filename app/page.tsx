"use client";

import { useMemo } from "react";
import lots from "./lots.json";
import owners from "./owners.json";

type Owner = (typeof owners)[number];

const ownerLots: Record<string, number[]> = {
  "SARL IMMOVILLIERS": [12, 24, 29, 30, 31, 32, 33, 34, 44, 53],
  "SOMOGUY Dimitri": [7, 40, 85],
  "SCI SC 98 BV": [35, 54],
  "ARMENGAUD Marie-Hélène": [17, 20, 48, 49, 82, 83, 84],
  "SCI SC 98 HV": [55],
  "NIZARD Alexis / Brigitte": [25, 47, 80],
  "Société VILLIERS PRESTIGE": [52, 93],
  "MASSARDY Caroline": [27, 45, 76],
  "SMADJA Anne": [46, 79],
  "VANDAMME Christian": [14, 39, 64, 65],
  "SMADJA CORRE Karine": [28, 78],
  "VANDAMME Philippe": [13, 66],
  "DE LA PORTE DES VAUX Laura": [21, 57],
  "Indivision DE GASTE": [19, 50, 51, 94],
  "FORGET Georges": [81],
  "DUBLANC Marguerite": [9, 91],
  "Indivision AKSOY / OZGUR Kayhan et Sirin": [36, 62],
  "FOURCADE Marion": [43, 70],
  "VICENS Maryline": [77],
  "BENYOUNES André": [37, 71],
  "LAFOURCADE Daniel": [42, 56],
  "SARRAZIN / BIANCARELLI Frédéric": [38, 63],
  "CAUCHYE Jean-Marie": [41, 61],
  "ATGER / GRIGNON J.F / P": [58],
  "FELMY-FRAISSE Nicole": [90],
  "MARETTI Michel / Fabienne": [69],
  "JOUAULT Claudine": [67],
  "LAM Noriko": [59],
  "PERMEZEL Mayeul": [68],
  "ROUILLARD Philippe": [60],
  "BRIERE Jean / Josette": [3, 10],
  "MAS Jean-Bernard": [26],
  "SCI 13ÈME SOUS SOL": [23],
  "CHENE-BERNARDIE Philippe": [15],
  "CORS Michel": [22],
  "DE THIEULLOY": [18],
  "SCI SODAIM": [16],
  "COMMERGNAT Marie-Caroline": [1],
  "DESSE Gregory": [11],
  "DINGREVILLE Arnaud": [4],
  "EL HAIK Sophie": [8],
  "GOIRAND Dominique": [2],
  "LEGRAND Michel": [5],
  "PRUAL Françoise": [6],
};

const commonControlPortfolios: Record<string, { name: string; type: string; note: string }> = {
  "SCI SC 98 BV": { name: "SCI 98BV + 98HV", type: "2 SCI · même gérant", note: "2 SCI distinctes · gérant commun : Roger Berdugo" },
  "SCI SC 98 HV": { name: "SCI 98BV + 98HV", type: "2 SCI · même gérant", note: "2 SCI distinctes · gérant commun : Roger Berdugo" },
};

const ownersSeenOnMailbox = new Set([
  "SCI 98BV + 98HV",
  "ARMENGAUD Marie-Hélène",
  "NIZARD Alexis / Brigitte",
  "Société VILLIERS PRESTIGE",
  "MASSARDY Caroline",
  "SMADJA Anne",
  "SMADJA CORRE Karine",
  "DE LA PORTE DES VAUX Laura",
  "VICENS Maryline",
  "LAFOURCADE Daniel",
  "SARRAZIN / BIANCARELLI Frédéric",
  "ROUILLARD Philippe",
]);

const ownerByLot = new Map<number, Owner>();
owners.forEach((owner) => ownerLots[owner.proprietaire]?.forEach((lot) => ownerByLot.set(lot, owner)));

const directLots = new Set(lots.filter((lot) => Boolean(lot.proprietaire)).map((lot) => lot.lot));
const officePackageLots = new Set([12, 24, 29, 30, 31, 32, 33, 34, 44, 53]);
const obsoleteOwnershipNote = /Rattachement au propriétaire non prouvé par les pièces disponibles: laisser vide jusqu'au retour SPF\.\s*/g;
const valuationOverrides: Record<number, { value: number; note: string }> = {
  80: { value: 1600000, note: "Vue Tour Eiffel · prime intégrée (hypothèse Dimitri)" },
  84: { value: 3000000, note: "Vue Tour Eiffel · prime intégrée" },
};

const categoryForNature = (nature: string | null) => {
  if (nature === "Parking") return { categorie: "Parkings", categorieSlug: "parking", categorieEmoji: "🅿️" };
  if (nature === "Cave") return { categorie: "Caves", categorieSlug: "cave", categorieEmoji: "📦" };
  if (nature === "Appartement" || nature === "Studio" || nature === "Chambre") return { categorie: "Habitations", categorieSlug: "habitation", categorieEmoji: "🏠" };
  return { categorie: "Bureaux / commerces", categorieSlug: "bureau", categorieEmoji: "💼" };
};

const masterLots = lots.map((lot) => {
  const owner = ownerByLot.get(lot.lot);
  const direct = directLots.has(lot.lot);
  const category = categoryForNature(lot.nature);
  const isOfficePackage = officePackageLots.has(lot.lot);
  const valuationOverride = valuationOverrides[lot.lot];
  const cleanedComment = lot.commentaires?.replace(obsoleteOwnershipNote, "").trim() || null;
  const packageComment = isOfficePackage
    ? lot.nature === "Parking" ? "Parking rattaché à l’ensemble de bureaux acquis." : "Lot principal de l’ensemble de bureaux acquis."
    : null;
  return {
    ...lot,
    ...category,
    valeurEstimee: valuationOverride?.value ?? lot.valeurEstimee,
    valuationNote: valuationOverride?.note ?? null,
    proprietaire: owner?.proprietaire ?? null,
    type: owner?.type ?? lot.type,
    adresse: lot.adresse ?? owner?.adresse ?? null,
    telephone: lot.telephone ?? owner?.telephone ?? null,
    email: lot.email ?? owner?.email ?? null,
    prioriteContact: owner?.priorite ?? null,
    partProprietaire: owner?.part ?? null,
    tantiemesProprietaire: owner?.tantiemes ?? null,
    lotsDuProprietaire: owner ? ownerLots[owner.proprietaire]?.length ?? null : null,
    prochaineAction: owner?.prochaineAction ?? null,
    pourquoi: owner?.pourquoi ?? null,
    ensemble: isOfficePackage ? "Ensemble de bureaux acquis · LOFI OFFICE" : null,
    preuve: direct ? "Pièce directe" : "Recoupé AG 2024/2026",
    preuveDirecte: direct,
    commentaires: [packageComment, cleanedComment].filter(Boolean).join(" ") || null,
    sourcesFusion: [lot.sources, owner?.sources, "Feuille de présence AG 07/10/2024", isOfficePackage || valuationOverride ? "Information fournie par Dimitri" : null].filter(Boolean).join(" · "),
  };
});

const calibratedSurface = (predicate: (lot: (typeof masterLots)[number]) => boolean) => {
  const referenceLots = masterLots.filter((lot) => predicate(lot) && typeof lot.surface === "number" && lot.tantiemes);
  return referenceLots.reduce((sum, lot) => sum + (lot.surface ?? 0), 0) / referenceLots.reduce((sum, lot) => sum + lot.tantiemes, 0);
};
const studioSurfacePerTantieme = calibratedSurface((lot) => lot.nature === "Studio");
const apartmentSurfacePerTantieme = calibratedSurface((lot) => lot.nature === "Appartement");
const officeSurfacePerTantieme = 313 / (471 + 568);
const surfaceEstimateForLot = (lot: (typeof masterLots)[number]) => {
  if (typeof lot.surface === "number") return { value: lot.surface, documented: true };
  if (lot.lot === 84) return { value: 149.55, documented: false };
  if (lot.nature === "Studio") return { value: lot.tantiemes * studioSurfacePerTantieme, documented: false };
  if (lot.nature === "Chambre") return { value: lot.tantiemes * studioSurfacePerTantieme, documented: false };
  if (lot.nature === "Appartement") return { value: lot.tantiemes * apartmentSurfacePerTantieme, documented: false };
  if (lot.categorie === "Bureaux / commerces") return { value: lot.tantiemes * officeSurfacePerTantieme, documented: false };
  return null;
};

const ownedOwnerNames = new Set(["SARL IMMOVILLIERS", "SOMOGUY Dimitri"]);
const ownedLots = masterLots.filter((lot) => ownedOwnerNames.has(lot.proprietaire ?? ""));
const prospectLots = masterLots.filter((lot) => !ownedOwnerNames.has(lot.proprietaire ?? ""));
const ownedShare = ownedLots.reduce((sum, lot) => sum + (lot.tantiemes ?? 0), 0) / 10000;
const fundsCommittedToDate = 3_800_000 + 3_020_000;
const estimatedRemainingAcquisition = prospectLots.reduce((sum, lot) => sum + (lot.valeurEstimee ?? 0), 0);

const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const number = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });
const text = (value: unknown) => value === null || value === undefined || value === "" ? "—" : String(value);
const money = (value: unknown) => typeof value === "number" ? euro.format(value) : "—";
const pct = (value: unknown) => typeof value === "number" ? `${number.format(value * 100)} %` : "—";
const dateLabel = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
const acquisitionLabel = (value: string | null | undefined) => value ? `Acq. ${dateLabel.format(new Date(value))}` : null;

type MasterLot = (typeof masterLots)[number];
const categoryNames = ["Parkings", "Caves", "Bureaux / commerces", "Habitations"];
const primaryCategoryNames = ["Habitations", "Bureaux / commerces"];
const categoryEmoji: Record<string, string> = { Parkings: "🅿️", Caves: "📦", "Bureaux / commerces": "💼", Habitations: "🏠" };
const categoryShortName: Record<string, string> = { Parkings: "Parkings", Caves: "Caves", "Bureaux / commerces": "Bureaux / commerces", Habitations: "Habitations" };

export default function Home() {
  const ownerGroups = useMemo(() => {
    const grouped = new Map<string, MasterLot[]>();
    prospectLots.forEach((lot) => {
      const ownerName = lot.proprietaire ?? "À identifier";
      const groupName = commonControlPortfolios[ownerName]?.name ?? ownerName;
      const current = grouped.get(groupName) ?? [];
      current.push(lot);
      grouped.set(groupName, current);
    });

    const rows = Array.from(grouped.entries()).map(([ownerName, filteredLots]) => {
      const sortedLots = [...filteredLots].sort((a, b) => a.lot - b.lot);
      const first = sortedLots[0];
      const commonControl = first.proprietaire ? commonControlPortfolios[first.proprietaire] : null;
      const legalOwners = Array.from(new Set(sortedLots.map((lot) => lot.proprietaire).filter((owner): owner is string => Boolean(owner))));
      const acquisitions = Array.from(new Map(sortedLots
        .filter((lot) => lot.dateAcquisition || lot.prixAcquisition)
        .map((lot) => [`${lot.dateAcquisition ?? ""}|${lot.prixAcquisition ?? ""}`, { date: lot.dateAcquisition, price: lot.prixAcquisition }])).values());
      const primaryLots = sortedLots.filter((lot) => primaryCategoryNames.includes(lot.categorie));
      const accessoryLots = sortedLots.filter((lot) => !primaryCategoryNames.includes(lot.categorie));
      const primarySurfaceDetails = primaryLots.map((lot) => surfaceEstimateForLot(lot)).filter((item): item is NonNullable<typeof item> => item !== null);
      return {
        ownerName,
        type: commonControl?.type ?? first.type,
        commonControlNote: commonControl?.note ?? null,
        address: first.adresse,
        ownerWeight: legalOwners.length > 1 ? sortedLots.reduce((sum, lot) => sum + lot.tantiemes, 0) : first.tantiemesProprietaire ?? 0,
        ownerShare: legalOwners.length > 1 ? sortedLots.reduce((sum, lot) => sum + lot.tantiemes, 0) / 10000 : first.partProprietaire,
        totalOwnerLots: legalOwners.length > 1 ? sortedLots.length : first.lotsDuProprietaire ?? sortedLots.length,
        lots: sortedLots,
        primaryLots,
        accessoryLots,
        primaryLotCount: primaryLots.length,
        primaryCategories: primaryCategoryNames.map((name) => ({ name, lots: primaryLots.filter((lot) => lot.categorie === name) })).filter((item) => item.lots.length > 0),
        accessoryCategories: categoryNames.filter((name) => !primaryCategoryNames.includes(name)).map((name) => ({ name, lots: accessoryLots.filter((lot) => lot.categorie === name) })).filter((item) => item.lots.length > 0),
        estimatedPrimarySurface: primarySurfaceDetails.reduce((sum, item) => sum + item.value, 0),
        documentedPrimarySurfaceCount: primarySurfaceDetails.filter((item) => item.documented).length,
        estimatedPrimarySurfaceCount: primarySurfaceDetails.filter((item) => !item.documented).length,
        value: sortedLots.reduce((sum, lot) => sum + (lot.valeurEstimee ?? 0), 0),
        acquisitions,
        mailboxSeen: ownersSeenOnMailbox.has(ownerName),
        sources: Array.from(new Set(sortedLots.flatMap((lot) => lot.sourcesFusion.split(" · ")))).join(" · "),
      };
    });

    return rows.sort((a, b) => {
      return b.ownerWeight - a.ownerWeight || a.ownerName.localeCompare(b.ownerName, "fr");
    });
  }, []);

  return (
    <main className="page-shell">
      <header className="simple-header">
        <div className="identity"><span className="identity-mark">98</span><div><strong>🏛️ 98 avenue de Villiers</strong><small>ACQUISITION PROGRESSIVE · PARIS 17</small></div></div>
        <div className="header-meta"><span>🗓️ Mise à jour · 4 août 2026</span><b>📌 Suivi opérationnel</b></div>
      </header>

      <section className="hero">
        <div className="metrics">
          <article><small>🧩 Lots à acquérir</small><strong>{prospectLots.length}</strong><p>Hors lots déjà maîtrisés</p></article>
          <article><small>👥 Propriétaires à approcher</small><strong>{ownerGroups.length}</strong><p>Les positions déjà détenues sont retirées</p></article>
          <article><small>🧮 Tantièmes contrôlés</small><strong>10 000</strong><p>Rapprochés lot par lot et propriétaire par propriétaire</p></article>
        </div>
        <div className="ownership-progress"><div className="progress-copy"><span>📈 Progression de l’acquisition</span><strong>{pct(ownedShare)} des tantièmes</strong></div><div className="progress-visual" aria-label={`${pct(ownedShare)} des tantièmes déjà maîtrisés`}><div className="progress-track"><i style={{ width: `${ownedShare * 100}%` }} /><b style={{ left: `${ownedShare * 100}%` }}>{pct(ownedShare)}</b></div><div className="progress-scale"><span>0 %</span><span>25 %</span><span>50 %</span><span>75 %</span><span>100 %</span></div></div><div className="progress-finance"><span><b>{money(fundsCommittedToDate)}</b> engagés à date</span><span><b>{money(estimatedRemainingAcquisition)}</b> estimés pour le solde</span></div></div>
      </section>

      <section className="section lots-section">
        <div className="section-title"><div><span className="eyebrow copper">📊 PORTEFEUILLES À ACQUÉRIR</span><h2>Propriétaires à contacter</h2></div><strong>👥 {ownerGroups.length} propriétaires · 🧩 {prospectLots.length} lots</strong></div>

        <div className="portfolio-grid">
          {ownerGroups.filter((group) => group.primaryLotCount > 0).map((group) => <article key={group.ownerName} className="portfolio-card">
            <header><div><span className="portfolio-type">{text(group.type)}</span><h3>👤 {group.ownerName}</h3><span className={`mailbox-status ${group.mailboxSeen ? "seen" : "not-seen"}`}>{group.mailboxSeen ? "Repéré sur une boîte aux lettres" : "Non repéré sur les photos"}</span>{group.commonControlNote && <small className="portfolio-subtitle">⚖️ {group.commonControlNote}</small>}</div><div className="portfolio-weight"><strong>{pct(group.ownerShare)}</strong><span>{number.format(group.ownerWeight)} tantièmes</span></div></header>
            <div className="primary-categories">{group.primaryCategories.map((category) => <section key={category.name} className={`primary-category ${category.name === "Habitations" ? "habitation" : "bureau"}`}><h4>{categoryEmoji[category.name]} {categoryShortName[category.name]}</h4><div>{category.lots.map((lot) => { const surfaceDetail = surfaceEstimateForLot(lot); const acquisition = acquisitionLabel(lot.dateAcquisition); return <span key={lot.lot} className="primary-lot"><b>Lot {lot.lot}</b><small>{text(lot.etage)}{surfaceDetail ? ` · ${surfaceDetail.documented ? "" : "≈ "}${number.format(surfaceDetail.value)} m²` : ""}</small>{acquisition && <i>📅 {acquisition}</i>}{lot.valeurEstimee && <em>≈ {money(lot.valeurEstimee)}</em>}{lot.valuationNote && <i>{lot.valuationNote}</i>}</span>; })}</div></section>)}</div>
            {group.accessoryLots.length > 0 && <div className="accessory-line">{group.accessoryCategories.map((category) => { const categoryValue = category.lots.reduce((sum, lot) => sum + (lot.valeurEstimee ?? 0), 0); const acquisitions = category.lots.map((lot) => acquisitionLabel(lot.dateAcquisition) ? `L${lot.lot} · ${acquisitionLabel(lot.dateAcquisition)}` : null).filter(Boolean); return <span key={category.name}>{categoryEmoji[category.name]} {category.lots.length} {categoryShortName[category.name].toLocaleLowerCase("fr")} · lots {category.lots.map((lot) => lot.lot).join(", ")}{categoryValue ? ` · ≈ ${money(categoryValue)}` : ""}{acquisitions.length ? ` · 📅 ${acquisitions.join(" · ")}` : ""}</span>; })}</div>}
            <footer><span>{group.estimatedPrimarySurface ? `📐 ${group.estimatedPrimarySurfaceCount ? "≈ " : ""}${number.format(group.estimatedPrimarySurface)} m²${group.documentedPrimarySurfaceCount ? ` · ${group.documentedPrimarySurfaceCount} mesuré${group.documentedPrimarySurfaceCount > 1 ? "s" : ""}` : ""}` : "📐 Surface non reconstituée"}</span><span>{group.value ? `💶 ≈ ${money(group.value)}` : ""}</span></footer>
          </article>)}</div>

        <section className="accessory-section"><div><span className="eyebrow">🅿️ 📦 ANNEXES SEULES</span><h3>Parkings et caves sans logement ni bureau associé</h3><p>Ils restent recensés, sans prendre la place des portefeuilles principaux.</p></div><div className="accessory-owner-list">{ownerGroups.filter((group) => group.primaryLotCount === 0).map((group) => <article key={group.ownerName}><div><strong>👤 {group.ownerName}</strong><small>{text(group.type)} · {number.format(group.ownerWeight)} tantièmes</small><span className={`mailbox-status ${group.mailboxSeen ? "seen" : "not-seen"}`}>{group.mailboxSeen ? "Repéré sur une boîte aux lettres" : "Non repéré sur les photos"}</span></div><p>{group.accessoryCategories.map((category) => { const categoryValue = category.lots.reduce((sum, lot) => sum + (lot.valeurEstimee ?? 0), 0); const acquisitions = category.lots.map((lot) => acquisitionLabel(lot.dateAcquisition) ? `L${lot.lot} · ${acquisitionLabel(lot.dateAcquisition)}` : null).filter(Boolean); return <span key={category.name}>{categoryEmoji[category.name]} {category.lots.length} {categoryShortName[category.name].toLocaleLowerCase("fr")} : {category.lots.map((lot) => lot.lot).join(", ")}{categoryValue ? ` · ≈ ${money(categoryValue)}` : ""}{acquisitions.length ? ` · 📅 ${acquisitions.join(" · ")}` : ""}</span>; })}</p></article>)}</div></section>
      </section>

    </main>
  );
}

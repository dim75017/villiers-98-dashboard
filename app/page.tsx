"use client";

import { useMemo, useState } from "react";
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

const ownerByLot = new Map<number, Owner>();
owners.forEach((owner) => ownerLots[owner.proprietaire]?.forEach((lot) => ownerByLot.set(lot, owner)));

const directLots = new Set(lots.filter((lot) => Boolean(lot.proprietaire)).map((lot) => lot.lot));
const officePackageLots = new Set([12, 24, 29, 30, 31, 32, 33, 34, 44, 53]);
const obsoleteOwnershipNote = /Rattachement au propriétaire non prouvé par les pièces disponibles: laisser vide jusqu'au retour SPF\.\s*/g;

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
  const cleanedComment = lot.commentaires?.replace(obsoleteOwnershipNote, "").trim() || null;
  const packageComment = isOfficePackage
    ? lot.nature === "Parking" ? "Parking rattaché à l’ensemble de bureaux acquis." : "Lot principal de l’ensemble de bureaux acquis."
    : null;
  return {
    ...lot,
    ...category,
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
    sourcesFusion: [lot.sources, owner?.sources, "Feuille de présence AG 07/10/2024", isOfficePackage ? "Information fournie par Dimitri" : null].filter(Boolean).join(" · "),
  };
});

const blocks = [
  { priority: "P0", name: "Ensemble de bureaux LOFI OFFICE", lots: "Bureaux 44 + 53 · parkings 12, 24, 29–34", levels: "RDC + rez-de-jardin + 8 parkings accessoires", tantiemes: 1243, owner: "Ensemble acquis", note: "Les parkings restent classés comme parkings et sont rattachés au bureau" },
  { priority: "P1", name: "Plateaux 1er + 2e", lots: "54 + 55", levels: "1er et 2e étages", tantiemes: 1670, owner: "SCI SC 98 BV + SCI SC 98 HV", note: "Deux plateaux de bureaux de 835 tantièmes chacun" },
  { priority: "P1", name: "Derniers niveaux", lots: "84 + 85", levels: "8e–9e étages", tantiemes: 1596, owner: "ARMENGAUD Marie-Hélène + SOMOGUY Dimitri", note: "Regroupement du sommet de l’immeuble" },
  { priority: "P1", name: "5e étage", lots: "90 + 91 + 93 + 94", levels: "5e étage", tantiemes: 930, owner: "FELMY-FRAISSE · DUBLANC · VILLIERS PRESTIGE · DE GASTE", note: "Regroupement horizontal à confirmer" },
  { priority: "P2", name: "Studios 3e étage", lots: "56 à 63", levels: "3e étage", tantiemes: 842, owner: "8 copropriétaires identifiés", note: "Campagne groupée possible" },
  { priority: "P2", name: "Studios 4e étage", lots: "64 à 71", levels: "4e étage", tantiemes: 842, owner: "8 copropriétaires identifiés", note: "Campagne groupée possible" },
  { priority: "P3", name: "Parkings", lots: "1 à 34", levels: "3e à 5e sous-sols", tantiemes: 804, owner: "Tous propriétaires identifiés", note: "Lots accessoires · proxy CBRE 50 k€/unité" },
];

const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const number = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });
const text = (value: unknown) => value === null || value === undefined || value === "" ? "—" : String(value);
const money = (value: unknown) => typeof value === "number" ? euro.format(value) : "—";
const pct = (value: unknown) => typeof value === "number" ? `${number.format(value * 100)} %` : "—";

type MasterLot = (typeof masterLots)[number];
type SortKey = "owner" | "lotCount" | "ownerWeight" | "value" | "firstLot";
type SortDirection = "asc" | "desc";

const sortOptions: Array<{ value: SortKey; label: string }> = [
  { value: "owner", label: "Propriétaire" },
  { value: "lotCount", label: "Nombre de lots" },
  { value: "ownerWeight", label: "Poids du propriétaire" },
  { value: "value", label: "Valeur cumulée" },
  { value: "firstLot", label: "Premier numéro de lot" },
];

const categoryNames = ["Parkings", "Caves", "Bureaux / commerces", "Habitations"];
const categoryEmoji: Record<string, string> = { Parkings: "🅿️", Caves: "📦", "Bureaux / commerces": "💼", Habitations: "🏠" };

export default function Home() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Toutes");
  const [floor, setFloor] = useState("Tous");
  const [sortKey, setSortKey] = useState<SortKey>("ownerWeight");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const floors = useMemo(() => ["Tous", ...Array.from(new Set(masterLots.map((lot) => lot.etage).filter(Boolean))).sort()], []);
  const categoryCounts = useMemo(() => Object.fromEntries(categoryNames.map((item) => [item, masterLots.filter((lot) => lot.categorie === item).length])), []);
  const visibleLots = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("fr");
    return masterLots.filter((lot) => {
      const matchesQuery = !q || [lot.lot, lot.categorie, lot.nature, lot.etage, lot.proprietaire, lot.type, lot.ensemble, lot.adresse, lot.commentaires, lot.sourcesFusion].some((value) => text(value).toLocaleLowerCase("fr").includes(q));
      const matchesCategory = category === "Toutes" || lot.categorie === category;
      const matchesFloor = floor === "Tous" || lot.etage === floor;
      return matchesQuery && matchesCategory && matchesFloor;
    });
  }, [query, category, floor]);

  const ownerGroups = useMemo(() => {
    const grouped = new Map<string, MasterLot[]>();
    visibleLots.forEach((lot) => {
      const ownerName = lot.proprietaire ?? "À identifier";
      const current = grouped.get(ownerName) ?? [];
      current.push(lot);
      grouped.set(ownerName, current);
    });

    const rows = Array.from(grouped.entries()).map(([ownerName, filteredLots]) => {
      const sortedLots = [...filteredLots].sort((a, b) => a.lot - b.lot);
      const first = sortedLots[0];
      const acquisitions = Array.from(new Map(sortedLots
        .filter((lot) => lot.dateAcquisition || lot.prixAcquisition)
        .map((lot) => [`${lot.dateAcquisition ?? ""}|${lot.prixAcquisition ?? ""}`, { date: lot.dateAcquisition, price: lot.prixAcquisition }])).values());
      return {
        ownerName,
        type: first.type,
        address: first.adresse,
        phone: first.telephone,
        email: first.email,
        ownerWeight: first.tantiemesProprietaire ?? 0,
        ownerShare: first.partProprietaire,
        totalOwnerLots: first.lotsDuProprietaire ?? sortedLots.length,
        lots: sortedLots,
        categories: categoryNames.map((name) => ({ name, count: sortedLots.filter((lot) => lot.categorie === name).length })).filter((item) => item.count > 0),
        floors: Array.from(new Set(sortedLots.map((lot) => lot.etage).filter(Boolean))),
        knownSurface: sortedLots.reduce((sum, lot) => sum + (lot.surface ?? 0), 0),
        surfaceCount: sortedLots.filter((lot) => typeof lot.surface === "number").length,
        value: sortedLots.reduce((sum, lot) => sum + (lot.valeurEstimee ?? 0), 0),
        acquisitions,
        sources: Array.from(new Set(sortedLots.flatMap((lot) => lot.sourcesFusion.split(" · ")))).join(" · "),
      };
    });

    const sortValue = (row: (typeof rows)[number]): string | number => {
      switch (sortKey) {
        case "owner": return row.ownerName;
        case "lotCount": return row.lots.length;
        case "ownerWeight": return row.ownerWeight;
        case "value": return row.value;
        case "firstLot": return row.lots[0]?.lot ?? 999;
      }
    };

    return rows.sort((a, b) => {
      const aValue = sortValue(a);
      const bValue = sortValue(b);
      const comparison = typeof aValue === "number" && typeof bValue === "number"
        ? aValue - bValue
        : String(aValue).localeCompare(String(bValue), "fr", { numeric: true, sensitivity: "base" });
      const directed = sortDirection === "asc" ? comparison : -comparison;
      return directed || a.ownerName.localeCompare(b.ownerName, "fr");
    });
  }, [visibleLots, sortKey, sortDirection]);

  const changeSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((direction) => direction === "asc" ? "desc" : "asc");
      return;
    }
    setSortKey(key);
    setSortDirection(["lotCount", "ownerWeight", "value"].includes(key) ? "desc" : "asc");
  };

  const sortHeader = (key: SortKey, label: string) => (
    <th aria-sort={sortKey === key ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}>
      <button type="button" className={`sort-header ${sortKey === key ? "active" : ""}`} onClick={() => changeSort(key)} title={`Trier par ${label.toLocaleLowerCase("fr")}`}>
        <span>{label}</span><i aria-hidden="true">{sortKey === key ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}</i>
      </button>
    </th>
  );

  const resetFilters = () => {
    setQuery("");
    setCategory("Toutes");
    setFloor("Tous");
    setSortKey("ownerWeight");
    setSortDirection("desc");
  };

  return (
    <main className="page-shell">
      <header className="simple-header">
        <div className="identity"><span className="identity-mark">98</span><div><strong>🏛️ 98 avenue de Villiers</strong><small>ACQUISITION PROGRESSIVE · PARIS 17</small></div></div>
        <div className="header-meta"><span>🗓️ Mise à jour · 1 août 2026</span><b>🔒 Accès privé</b></div>
      </header>

      <section className="hero">
        <span className="eyebrow copper">🗂️ BASE MAÎTRE PAR PROPRIÉTAIRE</span>
        <div className="hero-heading"><div><h1>👤 Chaque propriétaire. Tous ses lots. Un seul bloc.</h1><p>Les 85 lots sont regroupés sous leurs 44 copropriétaires pour visualiser immédiatement chaque portefeuille.</p></div><span className="proof-badge">👥 44 groupes propriétaires</span></div>
        <div className="metrics">
          <article><small>🧩 Lots associés</small><strong>85</strong><p>100 % de l’immeuble relié</p></article>
          <article><small>👥 Copropriétaires</small><strong>44</strong><p>Liste actuelle issue de l’AG 2026</p></article>
          <article><small>📜 Pièce directe</small><strong>18</strong><p>Acte, PUV ou transaction identifiée</p></article>
          <article><small>🔗 Recoupés</small><strong>67</strong><p>Feuille détaillée 2024 + liste 2026</p></article>
          <article><small>🧮 Tantièmes contrôlés</small><strong>10 000</strong><p>Rapprochés lot par lot et propriétaire par propriétaire</p></article>
        </div>
      </section>

      <section className="section lots-section">
        <div className="section-title"><div><span className="eyebrow copper">📊 TABLEAU REGROUPÉ</span><h2>🗃️ Portefeuille de chaque copropriétaire</h2><p>Une ligne correspond à un propriétaire ; tous ses lots sont réunis dans la même cellule.</p></div><strong>👥 {ownerGroups.length} propriétaires · 🧩 {visibleLots.length} / 85 lots</strong></div>

        <div className="category-strip" aria-label="Catégories de lots">
          {[
            { name: "Parkings", slug: "parking", icon: "🅿️", detail: "Emplacements seuls ou accessoires" },
            { name: "Caves", slug: "cave", icon: "📦", detail: "Caves et annexes privatives" },
            { name: "Bureaux / commerces", slug: "bureau", icon: "💼", detail: "Locaux professionnels" },
            { name: "Habitations", slug: "habitation", icon: "🏠", detail: "Studios, chambres et appartements" },
          ].map((item) => <button key={item.name} type="button" className={`category-card ${item.slug} ${category === item.name ? "active" : ""}`} onClick={() => setCategory(category === item.name ? "Toutes" : item.name)} aria-pressed={category === item.name}><span>{item.icon} {item.name}</span><strong>{categoryCounts[item.name]}</strong><small>{item.detail}</small></button>)}
        </div>

        <div className="filters master-filters">
          <label className="search"><span>🔎 Rechercher</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Lot, propriétaire, étage, source…" /></label>
          <label><span>🗂️ Catégorie</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option>Toutes</option><option>Parkings</option><option>Caves</option><option>Bureaux / commerces</option><option>Habitations</option></select></label>
          <label><span>🛗 Étage</span><select value={floor} onChange={(event) => setFloor(event.target.value)}>{floors.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>↕️ Trier par</span><select value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)}>{sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label><span>🔃 Ordre</span><select value={sortDirection} onChange={(event) => setSortDirection(event.target.value as SortDirection)}><option value="asc">Croissant ↑</option><option value="desc">Décroissant ↓</option></select></label>
          <button type="button" onClick={resetFilters}>🧹 Réinitialiser les filtres</button>
        </div>

        <div className="table-shell master-table-shell">
          <table className="grouped-table">
            <thead><tr>{sortHeader("owner", "👤 Propriétaire")}<th>🏷️ Type</th>{sortHeader("lotCount", "🧩 Lots regroupés")}<th>🗂️ Répartition</th><th>🛗 Étages</th><th>📐 Surface documentée</th>{sortHeader("ownerWeight", "⚖️ Poids du propriétaire")}<th>📬 Coordonnées</th><th>📅 Acquisition(s)</th>{sortHeader("value", "💶 Valeur cumulée")}<th>🔗 Sources</th></tr></thead>
            <tbody>{ownerGroups.map((group) => <tr key={group.ownerName}>
              <td className="owner-sticky"><strong>👤 {group.ownerName}</strong><small>🧩 {group.lots.length === group.totalOwnerLots ? `${group.totalOwnerLots} lot${group.totalOwnerLots === 1 ? "" : "s"}` : `${group.lots.length} affiché${group.lots.length === 1 ? "" : "s"} sur ${group.totalOwnerLots}`}</small></td>
              <td>{text(group.type)}</td>
              <td className="lots-group-cell"><div className="group-lots">{group.lots.map((lot) => <span key={lot.lot} className={`group-lot-chip ${lot.categorieSlug}`}><b>{lot.categorieEmoji} Lot {lot.lot}</b><small>{lot.categorie} · {lot.etage}</small></span>)}</div></td>
              <td className="category-breakdown">{group.categories.map((item) => <span key={item.name}>{categoryEmoji[item.name]} <b>{item.count}</b> {item.name.toLocaleLowerCase("fr")}</span>)}</td>
              <td className="floors-list">{group.floors.map((item) => <span key={item}>🛗 {item}</span>)}</td>
              <td className="numeric">{group.surfaceCount ? <><strong>{number.format(group.knownSurface)} m²</strong><small>{group.surfaceCount} lot{group.surfaceCount === 1 ? "" : "s"} renseigné{group.surfaceCount === 1 ? "" : "s"}</small></> : "—"}</td>
              <td className="stacked owner-weight"><strong>{number.format(group.ownerWeight)} tantièmes · {pct(group.ownerShare)}</strong><span>{group.totalOwnerLots} lot{group.totalOwnerLots === 1 ? "" : "s"} détenu{group.totalOwnerLots === 1 ? "" : "s"}</span></td>
              <td className="stacked contact-cell"><span>{text(group.address)}</span>{group.phone && <a href={`tel:${group.phone}`}>{group.phone}</a>}{group.email && <a href={`mailto:${group.email}`}>{group.email}</a>}</td>
              <td className="acquisition-list">{group.acquisitions.length ? group.acquisitions.map((item, index) => <span key={`${item.date}-${item.price}-${index}`}><b>{text(item.date)}</b>{item.price ? money(item.price) : ""}</span>) : "—"}</td>
              <td className="numeric value-cell"><strong>{money(group.value)}</strong></td>
              <td className="group-sources"><span className="source-chip">{group.sources}</span></td>
            </tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className="section">
        <div className="section-title"><div><span className="eyebrow copper">🧱 ASSEMBLAGE</span><h2>🎯 Blocs stratégiques désormais attribués</h2><p>💡 Même étage ou même package ne signifie pas automatiquement contiguïté physique.</p></div></div>
        <div className="blocks-grid">{blocks.map((block) => <article key={block.name} className="block-card"><div><span className={`priority ${block.priority.toLowerCase()}`}>🎯 {block.priority}</span><span className="block-share">⚖️ {number.format(block.tantiemes)} tantièmes</span></div><h3>🧩 {block.name}</h3><p>🛗 {block.levels}</p><dl><div><dt>🔢 Lots</dt><dd>{block.lots}</dd></div><div><dt>👤 Propriétaire(s)</dt><dd>{block.owner}</dd></div></dl><footer>💡 {block.note}</footer></article>)}</div>
      </section>

      <section className="section final-section">
        <article className="spf-panel"><div><span className="eyebrow copper">⚖️ CONSOLIDATION JURIDIQUE</span><h2>📜 Transformer les recoupements en preuves récentes</h2><p>Les 85 associations sont désormais lisibles. Pour les 67 lignes sans pièce directe récente, le SPF reste le contrôle définitif avant prise de contact ou acquisition.</p></div><ol><li><b>1</b>🎯 Prioriser les P0/P1</li><li><b>2</b>📨 Commander les fiches SPF</li><li><b>3</b>📎 Joindre l’acte à chaque ligne</li></ol><a href="https://www.impots.gouv.fr/formulaire/3233-sd/demande-de-renseignements-pour-la-periode-compter-du-1er-janvier-1956" target="_blank" rel="noreferrer">🧾 Formulaire officiel DGFIP</a></article>
        <p className="footnote"><strong>Rapprochement principal :</strong> feuille de présence détaillée de l’AG du 7 octobre 2024, recoupée avec la liste des 44 comptes copropriétaires et le PV 2026. Les mutations documentées par acte, PUV ou DVF sont signalées « Pièce directe ». Les autres restent signalées « Recoupé » jusqu’au contrôle SPF.</p>
      </section>
    </main>
  );
}

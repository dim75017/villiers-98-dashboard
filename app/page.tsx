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
const obsoleteOwnershipNote = /Rattachement au propriétaire non prouvé par les pièces disponibles: laisser vide jusqu'au retour SPF\.\s*/g;

const masterLots = lots.map((lot) => {
  const owner = ownerByLot.get(lot.lot);
  const direct = directLots.has(lot.lot);
  return {
    ...lot,
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
    preuve: direct ? "Pièce directe" : "Recoupé AG 2024/2026",
    preuveDirecte: direct,
    commentaires: lot.commentaires?.replace(obsoleteOwnershipNote, "").trim() || null,
    sourcesFusion: [lot.sources, owner?.sources, "Feuille de présence AG 07/10/2024"].filter(Boolean).join(" · "),
  };
});

const blocks = [
  { priority: "P0", name: "Bureaux LOFI OFFICE", lots: "12, 24, 29–34, 44, 53", levels: "RDC + rez-de-jardin + parkings", tantiemes: 1243, owner: "SARL IMMOVILLIERS", note: "Promesse 3,8 M€ · échéance 30/11/2026" },
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

export default function Home() {
  const [query, setQuery] = useState("");
  const [nature, setNature] = useState("Toutes");
  const [floor, setFloor] = useState("Tous");
  const [priority, setPriority] = useState("Toutes");
  const [proof, setProof] = useState("Toutes");

  const natures = useMemo(() => ["Toutes", ...Array.from(new Set(masterLots.map((lot) => lot.nature).filter(Boolean))).sort()], []);
  const floors = useMemo(() => ["Tous", ...Array.from(new Set(masterLots.map((lot) => lot.etage).filter(Boolean))).sort()], []);
  const visibleLots = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("fr");
    return masterLots.filter((lot) => {
      const matchesQuery = !q || [lot.lot, lot.nature, lot.etage, lot.proprietaire, lot.type, lot.adresse, lot.commentaires, lot.sourcesFusion].some((value) => text(value).toLocaleLowerCase("fr").includes(q));
      const matchesNature = nature === "Toutes" || lot.nature === nature;
      const matchesFloor = floor === "Tous" || lot.etage === floor;
      const matchesPriority = priority === "Toutes" || lot.prioriteContact === priority;
      const matchesProof = proof === "Toutes" || (proof === "Directe" ? lot.preuveDirecte : !lot.preuveDirecte);
      return matchesQuery && matchesNature && matchesFloor && matchesPriority && matchesProof;
    });
  }, [query, nature, floor, priority, proof]);

  const resetFilters = () => {
    setQuery("");
    setNature("Toutes");
    setFloor("Tous");
    setPriority("Toutes");
    setProof("Toutes");
  };

  return (
    <main className="page-shell">
      <header className="simple-header">
        <div className="identity"><span className="identity-mark">98</span><div><strong>98 avenue de Villiers</strong><small>ACQUISITION PROGRESSIVE · PARIS 17</small></div></div>
        <div className="header-meta"><span>Mise à jour · 1 août 2026</span><b>Accès privé</b></div>
      </header>

      <section className="hero">
        <span className="eyebrow copper">BASE MAÎTRE LOT × PROPRIÉTAIRE</span>
        <div className="hero-heading"><div><h1>Chaque lot. Son propriétaire. Une seule ligne.</h1><p>Les 85 lots sont reliés aux 44 copropriétaires, avec l’étage, les tantièmes, le CRM et le niveau de preuve.</p></div><span className="proof-badge">85 / 85 lots associés</span></div>
        <div className="metrics">
          <article><small>Lots associés</small><strong>85</strong><p>100 % de l’immeuble relié</p></article>
          <article><small>Copropriétaires</small><strong>44</strong><p>Liste actuelle issue de l’AG 2026</p></article>
          <article><small>Pièce directe</small><strong>18</strong><p>Acte, PUV ou transaction identifiée</p></article>
          <article><small>Recoupés</small><strong>67</strong><p>Feuille détaillée 2024 + liste 2026</p></article>
          <article><small>Tantièmes contrôlés</small><strong>10 000</strong><p>Rapprochés lot par lot et propriétaire par propriétaire</p></article>
        </div>
        <div className="method-banner"><strong>Lecture du niveau de preuve</strong><span><i className="direct-dot" /> Pièce directe : attribution appuyée par un acte, une promesse ou une transaction.</span><span><i className="cross-dot" /> Recoupé : lot de la feuille détaillée 2024 rapproché du même compte copropriétaire dans les pièces 2026.</span></div>
      </section>

      <section className="section lots-section">
        <div className="section-title"><div><span className="eyebrow copper">TABLEAU UNIQUE</span><h2>Base complète de l’immeuble</h2><p>Une ligne correspond à un lot juridique précis. Les coordonnées inconnues restent vides.</p></div><strong>{visibleLots.length} / 85 lots affichés</strong></div>

        <div className="filters master-filters">
          <label className="search"><span>Rechercher</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Lot, propriétaire, étage, source…" /></label>
          <label><span>Nature</span><select value={nature} onChange={(event) => setNature(event.target.value)}>{natures.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Étage</span><select value={floor} onChange={(event) => setFloor(event.target.value)}>{floors.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Priorité contact</span><select value={priority} onChange={(event) => setPriority(event.target.value)}><option>Toutes</option><option>P0</option><option>P1</option><option>P2</option><option>P3</option></select></label>
          <label><span>Preuve</span><select value={proof} onChange={(event) => setProof(event.target.value)}><option>Toutes</option><option>Directe</option><option>Recoupée</option></select></label>
          <button type="button" onClick={resetFilters}>Réinitialiser les filtres</button>
        </div>

        <div className="table-shell master-table-shell">
          <table className="lots-table master-table">
            <thead><tr><th>Lot</th><th>Nature</th><th>Étage</th><th>Surface</th><th>Tantièmes</th><th>Propriétaire actuel</th><th>Niveau de preuve</th><th>Type</th><th>Poids du propriétaire</th><th>Coordonnées</th><th>Priorité contact</th><th>Acquisition</th><th>Valeur estimée</th><th>Potentiel lot</th><th>Commentaires</th><th>Sources</th></tr></thead>
            <tbody>{visibleLots.map((lot) => <tr key={lot.lot} className={lot.preuveDirecte ? "direct-row" : "cross-row"}>
              <td className="sticky-col"><span className="lot-number">{lot.lot}</span></td>
              <td><strong>{text(lot.nature)}</strong></td>
              <td className="floor-cell">{text(lot.etage)}</td>
              <td className="numeric">{lot.surface ? `${number.format(lot.surface)} m²` : "—"}</td>
              <td className="numeric strong-number">{number.format(lot.tantiemes)}</td>
              <td className="owner-known"><strong>{text(lot.proprietaire)}</strong></td>
              <td><span className={`proof-chip ${lot.preuveDirecte ? "direct" : "cross"}`}>{lot.preuve}</span></td>
              <td>{text(lot.type)}</td>
              <td className="stacked owner-weight"><strong>{number.format(lot.tantiemesProprietaire)} tantièmes · {pct(lot.partProprietaire)}</strong><span>{lot.lotsDuProprietaire} lot{lot.lotsDuProprietaire === 1 ? "" : "s"} détenu{lot.lotsDuProprietaire === 1 ? "" : "s"}</span></td>
              <td className="stacked contact-cell"><span>{text(lot.adresse)}</span>{lot.telephone && <a href={`tel:${lot.telephone}`}>{lot.telephone}</a>}{lot.email && <a href={`mailto:${lot.email}`}>{lot.email}</a>}</td>
              <td className="priority-cell"><span className={`priority ${String(lot.prioriteContact).toLowerCase()}`}>{text(lot.prioriteContact)}</span><small>{text(lot.prochaineAction)}</small></td>
              <td className="stacked"><span>{text(lot.dateAcquisition)}</span><strong>{money(lot.prixAcquisition)}</strong></td>
              <td className="numeric value-cell">{money(lot.valeurEstimee)}</td>
              <td><span className={`priority ${String(lot.potentiel).toLowerCase()}`}>{text(lot.potentiel)}</span></td>
              <td className="comment-cell">{text(lot.commentaires)}</td>
              <td><span className="source-chip">{lot.sourcesFusion}</span></td>
            </tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className="section">
        <div className="section-title"><div><span className="eyebrow copper">ASSEMBLAGE</span><h2>Blocs stratégiques désormais attribués</h2><p>Même étage ou même package ne signifie pas automatiquement contiguïté physique.</p></div></div>
        <div className="blocks-grid">{blocks.map((block) => <article key={block.name} className="block-card"><div><span className={`priority ${block.priority.toLowerCase()}`}>{block.priority}</span><span className="block-share">{number.format(block.tantiemes)} tantièmes</span></div><h3>{block.name}</h3><p>{block.levels}</p><dl><div><dt>Lots</dt><dd>{block.lots}</dd></div><div><dt>Propriétaire(s)</dt><dd>{block.owner}</dd></div></dl><footer>{block.note}</footer></article>)}</div>
      </section>

      <section className="section final-section">
        <article className="spf-panel"><div><span className="eyebrow copper">CONSOLIDATION JURIDIQUE</span><h2>Transformer les recoupements en preuves récentes</h2><p>Les 85 associations sont désormais lisibles. Pour les 67 lignes sans pièce directe récente, le SPF reste le contrôle définitif avant prise de contact ou acquisition.</p></div><ol><li><b>1</b>Prioriser les P0/P1</li><li><b>2</b>Commander les fiches SPF</li><li><b>3</b>Joindre l’acte à chaque ligne</li></ol><a href="https://www.impots.gouv.fr/formulaire/3233-sd/demande-de-renseignements-pour-la-periode-compter-du-1er-janvier-1956" target="_blank" rel="noreferrer">Formulaire officiel DGFIP</a></article>
        <p className="footnote"><strong>Rapprochement principal :</strong> feuille de présence détaillée de l’AG du 7 octobre 2024, recoupée avec la liste des 44 comptes copropriétaires et le PV 2026. Les mutations documentées par acte, PUV ou DVF sont signalées « Pièce directe ». Les autres restent signalées « Recoupé » jusqu’au contrôle SPF.</p>
      </section>
    </main>
  );
}

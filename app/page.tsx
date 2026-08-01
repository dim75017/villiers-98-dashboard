"use client";

import { useMemo, useState } from "react";
import lots from "./lots.json";
import owners from "./owners.json";

const blocks = [
  { priority: "P0", name: "Bureaux LOFI OFFICE", lots: "12, 24, 29–34, 44, 53", levels: "RDC + rez-de-jardin + parkings", tantiemes: 1243, owner: "SARL IMMOVILLIERS", note: "Promesse 3,8 M€ · échéance 30/11/2026" },
  { priority: "P1", name: "Plateaux 1er + 2e", lots: "54 + 55", levels: "1er et 2e étages", tantiemes: 1670, owner: "À déterminer", note: "Deux plateaux de bureaux de 835 tantièmes" },
  { priority: "P1", name: "Derniers niveaux", lots: "84 + 85", levels: "8e–9e étages", tantiemes: 1606, owner: "Lot 85 : Dimitri · lot 84 : inconnu", note: "Regroupement du sommet de l’immeuble" },
  { priority: "P1", name: "5e étage", lots: "90 + 91 + 93 + 94", levels: "5e étage", tantiemes: 930, owner: "Partiellement connu", note: "Regroupement horizontal à confirmer" },
  { priority: "P2", name: "Studios 3e étage", lots: "56 à 63", levels: "3e étage", tantiemes: 842, owner: "À déterminer sauf lot 62", note: "Campagne groupée possible" },
  { priority: "P2", name: "Studios 4e étage", lots: "64 à 71", levels: "4e étage", tantiemes: 842, owner: "À déterminer", note: "Campagne groupée possible" },
  { priority: "P3", name: "Parkings", lots: "1 à 34", levels: "3e à 5e sous-sols", tantiemes: 804, owner: "Multiples", note: "Lots accessoires · proxy CBRE 50 k€/unité" },
];

const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const number = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });
const text = (value: unknown) => value === null || value === undefined || value === "" ? "—" : String(value);
const money = (value: unknown) => typeof value === "number" ? euro.format(value) : "—";
const pct = (value: unknown) => typeof value === "number" ? `${number.format(value * 100)} %` : "—";

export default function Home() {
  const [query, setQuery] = useState("");
  const [nature, setNature] = useState("Toutes");
  const [priority, setPriority] = useState("Toutes");
  const [ownership, setOwnership] = useState("Tous");

  const natures = useMemo(() => ["Toutes", ...Array.from(new Set(lots.map((lot) => lot.nature).filter(Boolean))).sort()], []);
  const visibleLots = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("fr");
    return lots.filter((lot) => {
      const matchesQuery = !q || [lot.lot, lot.nature, lot.etage, lot.proprietaire, lot.type, lot.commentaires, lot.sources].some((value) => text(value).toLocaleLowerCase("fr").includes(q));
      const matchesNature = nature === "Toutes" || lot.nature === nature;
      const matchesPriority = priority === "Toutes" || lot.potentiel === priority;
      const matchesOwner = ownership === "Tous" || (ownership === "Identifié" ? Boolean(lot.proprietaire) : !lot.proprietaire);
      return matchesQuery && matchesNature && matchesPriority && matchesOwner;
    });
  }, [query, nature, priority, ownership]);

  return (
    <main className="page-shell">
      <header className="simple-header">
        <div className="identity"><span className="identity-mark">98</span><div><strong>98 avenue de Villiers</strong><small>ACQUISITION PROGRESSIVE · PARIS 17</small></div></div>
        <div className="header-meta"><span>Mise à jour · 1 août 2026</span><b>Accès privé</b></div>
      </header>

      <section className="hero">
        <span className="eyebrow copper">VUE COMPLÈTE DE L’IMMEUBLE</span>
        <div className="hero-heading"><div><h1>85 lots. Une seule page.</h1><p>Toutes les informations documentées, sans compléter artificiellement les données manquantes.</p></div><span className="proof-badge">10 000 / 10 000 tantièmes contrôlés</span></div>
        <div className="metrics">
          <article><small>Lots actuels</small><strong>85</strong><p>Parkings, caves, bureaux et logements</p></article>
          <article><small>Copropriétaires</small><strong>44</strong><p>Comptes issus de l’AG 2026</p></article>
          <article><small>Lots attribués avec preuve</small><strong>18</strong><p>67 restent à confirmer par le SPF</p></article>
          <article><small>Détenu + sous promesse</small><strong>20,67 %</strong><p>2 067 tantièmes</p></article>
          <article><small>Valeur indicative</small><strong>26,99 M€</strong><p>Modèle DVF + CBRE, pas une expertise</p></article>
        </div>
        <div className="progress"><div className="owned" /><div className="pending" /></div>
        <div className="legend"><span><i className="copper-dot" />Détenu 8,24 %</span><span><i className="teal-dot" />Sous promesse 12,43 %</span><span><i />Reste 79,33 %</span></div>
      </section>

      <section className="section lots-section">
        <div className="section-title"><div><span className="eyebrow copper">BASE PAR LOT</span><h2>Tous les lots de l’immeuble</h2><p>Les cellules « — » correspondent à une donnée non prouvée.</p></div><strong>{visibleLots.length} / 85 lots affichés</strong></div>

        <div className="filters">
          <label className="search"><span>Rechercher</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Lot, propriétaire, étage, source…" /></label>
          <label><span>Nature</span><select value={nature} onChange={(event) => setNature(event.target.value)}>{natures.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Priorité</span><select value={priority} onChange={(event) => setPriority(event.target.value)}><option>Toutes</option><option>P0</option><option>P1</option><option>P2</option><option>P3</option></select></label>
          <label><span>Propriétaire</span><select value={ownership} onChange={(event) => setOwnership(event.target.value)}><option>Tous</option><option>Identifié</option><option>À identifier</option></select></label>
          <button type="button" onClick={() => { setQuery(""); setNature("Toutes"); setPriority("Toutes"); setOwnership("Tous"); }}>Réinitialiser</button>
        </div>

        <div className="table-shell lots-table-shell">
          <table className="lots-table">
            <thead><tr><th>Lot</th><th>Nature</th><th>Étage</th><th>Surface</th><th>Tantièmes</th><th>Propriétaire actuel</th><th>Type</th><th>Coordonnées</th><th>Acquisition</th><th>Valeur estimée</th><th>Priorité</th><th>Commentaires</th><th>Sources</th></tr></thead>
            <tbody>{visibleLots.map((lot) => <tr key={lot.lot} className={lot.proprietaire ? "known-row" : ""}>
              <td className="sticky-col"><span className="lot-number">{lot.lot}</span></td>
              <td><strong>{text(lot.nature)}</strong></td>
              <td>{text(lot.etage)}</td>
              <td className="numeric">{lot.surface ? `${number.format(lot.surface)} m²` : "—"}</td>
              <td className="numeric strong-number">{number.format(lot.tantiemes)}</td>
              <td className={lot.proprietaire ? "owner-known" : "owner-missing"}>{lot.proprietaire || "À identifier"}</td>
              <td>{text(lot.type)}</td>
              <td className="stacked"><span>{text(lot.adresse)}</span>{lot.telephone && <span>{lot.telephone}</span>}{lot.email && <a href={`mailto:${lot.email}`}>{lot.email}</a>}</td>
              <td className="stacked"><span>{text(lot.dateAcquisition)}</span><strong>{money(lot.prixAcquisition)}</strong></td>
              <td className="numeric value-cell">{money(lot.valeurEstimee)}</td>
              <td><span className={`priority ${String(lot.potentiel).toLowerCase()}`}>{text(lot.potentiel)}</span></td>
              <td className="comment-cell">{text(lot.commentaires)}</td>
              <td><span className="source-chip">{text(lot.sources)}</span></td>
            </tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className="section">
        <div className="section-title"><div><span className="eyebrow copper">CRM COMPLET</span><h2>Les 44 copropriétaires</h2><p>Classés par priorité de contact et poids dans l’immeuble.</p></div><strong>100 % des tantièmes rapprochés</strong></div>
        <div className="table-shell owners-table-shell">
          <table className="owners-table">
            <thead><tr><th>Priorité</th><th>Propriétaire</th><th>Type</th><th>Tantièmes</th><th>Part</th><th>Lots prouvés</th><th>Coordonnées</th><th>Pourquoi</th><th>Prochaine action</th><th>Sources</th></tr></thead>
            <tbody>{owners.map((owner) => <tr key={owner.proprietaire}>
              <td><span className={`priority ${owner.priorite.toLowerCase()}`}>{owner.priorite}</span></td>
              <td><strong>{owner.proprietaire}</strong></td><td>{owner.type}</td><td className="numeric strong-number">{number.format(owner.tantiemes)}</td><td className="numeric value-cell">{pct(owner.part)}</td>
              <td>{text(owner.lotsProuves)}</td><td className="stacked"><span>{text(owner.adresse)}</span>{owner.telephone && <span>{owner.telephone}</span>}{owner.email && <a href={`mailto:${owner.email}`}>{owner.email}</a>}</td>
              <td className="comment-cell">{owner.pourquoi}</td><td className="comment-cell">{owner.prochaineAction}</td><td><span className="source-chip">{owner.sources}</span></td>
            </tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className="section">
        <div className="section-title"><div><span className="eyebrow copper">ASSEMBLAGE</span><h2>Tous les blocs stratégiques identifiés</h2><p>Même étage ou même package ne signifie pas automatiquement contiguïté physique.</p></div></div>
        <div className="blocks-grid">{blocks.map((block) => <article key={block.name} className="block-card"><div><span className={`priority ${block.priority.toLowerCase()}`}>{block.priority}</span><span className="block-share">{number.format(block.tantiemes)} tantièmes</span></div><h3>{block.name}</h3><p>{block.levels}</p><dl><div><dt>Lots</dt><dd>{block.lots}</dd></div><div><dt>Propriétaire</dt><dd>{block.owner}</dd></div></dl><footer>{block.note}</footer></article>)}</div>
      </section>

      <section className="section final-section">
        <article className="spf-panel"><div><span className="eyebrow copper">PROCHAINE ACTION</span><h2>Compléter les 67 attributions manquantes</h2><p>Envoyer le 3233-SD au SPF Paris 1 pour obtenir le dernier propriétaire connu de chaque lot, puis injecter les références d’actes dans cette base.</p></div><ol><li><b>1</b>Signer le formulaire</li><li><b>2</b>Régler 12 €</li><li><b>3</b>Demander la réponse par e-mail</li></ol><a href="https://www.impots.gouv.fr/formulaire/3233-sd/demande-de-renseignements-pour-la-periode-compter-du-1er-janvier-1956" target="_blank" rel="noreferrer">Formulaire officiel DGFIP</a></article>
        <p className="footnote"><strong>Sources :</strong> règlement de copropriété et modificatifs, convocation AG 2026, actes notariés, diagnostic Carrez, rapport CBRE, DVF 2021–2025, RNE/INPI et formulaires DGFIP. Chaque donnée inconnue demeure vide.</p>
      </section>
    </main>
  );
}

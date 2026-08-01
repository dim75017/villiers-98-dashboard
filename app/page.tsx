const targets = [
  { priority: "P0", owner: "SARL IMMOVILLIERS", type: "Société", tantiemes: "1 243", share: "12,43 %", status: "Promesse en cours", action: "Finaliser avant le 30/11/2026" },
  { priority: "P1", owner: "SCI SC 98 BV", type: "SCI", tantiemes: "1 140", share: "11,40 %", status: "À qualifier", action: "Obtenir l’identité des lots via SPF" },
  { priority: "P1", owner: "ARMENGAUD Marie-Hélène", type: "Personne physique", tantiemes: "1 059", share: "10,59 %", status: "À contacter", action: "Approche directe prioritaire" },
  { priority: "P1", owner: "SCI SC 98 HV", type: "SCI", tantiemes: "835", share: "8,35 %", status: "À qualifier", action: "Identifier dirigeants et lots" },
  { priority: "P1", owner: "NIZARD Alexis / Brigitte", type: "Indivision", tantiemes: "646", share: "6,46 %", status: "À contacter", action: "Approche directe prioritaire" },
  { priority: "P1", owner: "VILLIERS PRESTIGE", type: "SCI", tantiemes: "604", share: "6,04 %", status: "Identifiée", action: "Lots 52 + 93 prouvés" },
];

const blocks = [
  { name: "Plateaux 1er + 2e", lots: "54 + 55", tantiemes: "1 670", note: "Deux grands plateaux de bureaux", priority: "P1" },
  { name: "Derniers niveaux", lots: "84 + 85", tantiemes: "1 606", note: "Lot 85 détenu ; lot 84 à cibler", priority: "P1" },
  { name: "5e étage", lots: "90 + 91 + 93 + 94", tantiemes: "930", note: "Regroupement horizontal à confirmer", priority: "P1" },
  { name: "Studios 3e + 4e", lots: "56 à 71", tantiemes: "1 684", note: "Deux campagnes groupées possibles", priority: "P2" },
];

const navigation = [
  ["⌂", "Vue d’ensemble", "overview"],
  ["◎", "Cibles prioritaires", "targets"],
  ["▦", "Blocs stratégiques", "blocks"],
  ["✓", "Données & SPF", "data"],
] as const;

export default function Home() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" aria-label="98 Villiers — accueil">
          <span className="brand-mark" aria-hidden="true">98</span>
          <span><strong>Villiers</strong><small>ACQUISITION · PARIS 17</small></span>
        </a>

        <nav aria-label="Navigation principale">
          <p className="nav-label">Pilotage</p>
          {navigation.map(([icon, label, id], index) => (
            <a className={index === 0 ? "nav-item active" : "nav-item"} href={`#${id}`} key={id}>
              <span aria-hidden="true">{icon}</span><b>{label}</b>
            </a>
          ))}
        </nav>

        <div className="sidebar-spacer" />
        <div className="source-stamp"><span>✓</span><div><strong>Base vérifiée</strong><small>10 000 / 10 000 tantièmes</small></div></div>
      </aside>

      <main>
        <header className="topbar">
          <div><span className="eyebrow">TABLEAU DE BORD</span><h1>98 avenue de Villiers</h1></div>
          <div className="top-actions">
            <span className="updated">Mise à jour · 1 août 2026</span>
            <span className="private-badge">Accès privé</span>
          </div>
        </header>

        <section id="overview" className="section hero-section">
          <div className="section-heading">
            <div><span className="eyebrow copper">SYNTHÈSE</span><h2>Progression de l’acquisition</h2></div>
            <span className="quality-pill">18 lots attribués avec preuve</span>
          </div>

          <div className="metrics-grid">
            <article className="metric-card featured"><span className="metric-icon">▣</span><div><small>Périmètre</small><strong>85 lots</strong><p>44 comptes copropriétaires</p></div></article>
            <article className="metric-card"><span className="metric-icon">%</span><div><small>Détenu aujourd’hui</small><strong>8,24 %</strong><p>824 tantièmes</p></div></article>
            <article className="metric-card"><span className="metric-icon">↗</span><div><small>Sous promesse</small><strong>12,43 %</strong><p>1 243 tantièmes</p></div></article>
            <article className="metric-card"><span className="metric-icon">€</span><div><small>Valeur indicative</small><strong>26,99 M€</strong><p>Modèle interne, pas une expertise</p></div></article>
          </div>

          <article className="progress-panel">
            <div className="progress-copy"><div><span className="eyebrow">APRÈS RÉALISATION DE LA PROMESSE</span><strong>20,67 %</strong></div><p>2 067 tantièmes détenus ou juridiquement engagés</p></div>
            <div className="progress-track" aria-label="20,67 % de l’immeuble détenu ou sous promesse">
              <span className="progress-owned" title="Détenu : 8,24 %" />
              <span className="progress-pending" title="Sous promesse : 12,43 %" />
            </div>
            <div className="progress-legend"><span><i className="dot owned" />Détenu 8,24 %</span><span><i className="dot pending" />Sous promesse 12,43 %</span><span><i className="dot remaining" />Reste 79,33 %</span></div>
          </article>
        </section>

        <section id="targets" className="section">
          <div className="section-heading">
            <div><span className="eyebrow copper">PROSPECTION</span><h2>Propriétaires à traiter en priorité</h2></div>
            <span className="summary-chip">P1 structurants · 42,84 %</span>
          </div>
          <div className="filter-row" aria-label="Indicateurs de priorité">
            <span className="filter-chip active">P0 · Transaction active</span><span className="filter-chip">P1 · Blocs structurants</span><span className="filter-chip">Données prouvées uniquement</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Priorité</th><th>Propriétaire</th><th>Type</th><th>Tantièmes</th><th>Part</th><th>Statut</th><th>Prochaine action</th></tr></thead>
              <tbody>{targets.map((target) => <tr key={target.owner}>
                <td><span className={`priority ${target.priority.toLowerCase()}`}>{target.priority}</span></td>
                <td><strong>{target.owner}</strong></td><td className="muted">{target.type}</td><td className="numeric">{target.tantiemes}</td><td className="numeric accent">{target.share}</td><td><span className="status">{target.status}</span></td><td className="action-cell">{target.action}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </section>

        <section id="blocks" className="section">
          <div className="section-heading"><div><span className="eyebrow copper">ASSEMBLAGE</span><h2>Blocs stratégiques</h2></div><span className="summary-chip">Contiguïté à valider par plans</span></div>
          <div className="blocks-grid">
            {blocks.map((block, index) => <article className="block-card" key={block.name}>
              <div className="block-top"><span className="block-number">0{index + 1}</span><span className={`priority ${block.priority.toLowerCase()}`}>{block.priority}</span></div>
              <h3>{block.name}</h3><p>{block.note}</p><div className="block-stats"><span><small>LOTS</small><strong>{block.lots}</strong></span><span><small>TANTIÈMES</small><strong>{block.tantiemes}</strong></span></div>
            </article>)}
          </div>
        </section>

        <section id="data" className="section data-section">
          <div className="section-heading"><div><span className="eyebrow copper">FIABILISATION</span><h2>Données et prochaine action</h2></div></div>
          <div className="data-grid">
            <article className="data-card quality-card"><span className="large-number">18</span><div><h3>Lots avec propriétaire prouvé</h3><p>Actes notariés ou rapprochement DVF + tantièmes.</p></div></article>
            <article className="data-card"><span className="large-number muted-number">67</span><div><h3>Lots encore à attribuer</h3><p>Les cellules restent vides tant qu’aucune pièce ne confirme l’information.</p></div></article>
            <article className="data-card"><span className="large-number">506</span><div><h3>Lignes de traçabilité</h3><p>Chaque champ utile renvoie vers le document source.</p></div></article>
          </div>

          <article className="spf-panel">
            <div className="spf-kicker">ACTION IMMÉDIATE</div><div className="spf-content"><div><h3>Envoyer le formulaire 3233-SD</h3><p>Demander au SPF Paris 1 le dernier propriétaire connu pour l’ensemble de l’immeuble.</p></div><ol><li><span>1</span>Signer le formulaire</li><li><span>2</span>Choisir le paiement de 12 €</li><li><span>3</span>Demander la réponse par e-mail</li></ol></div>
            <div className="spf-footer"><span>98 avenue de Villiers · Paris 17e · Section BH · Parcelle 21</span><a href="https://www.impots.gouv.fr/formulaire/3233-sd/demande-de-renseignements-pour-la-periode-compter-du-1er-janvier-1956" target="_blank" rel="noreferrer">Formulaire officiel DGFIP →</a></div>
          </article>

          <p className="method-note"><strong>Méthode :</strong> valeurs indicatives fondées sur les mutations DVF 2021–2025 du même immeuble et l’avis CBRE du 30 juillet 2026. Les propriétaires non rattachés à un lot restent volontairement non attribués.</p>
        </section>
      </main>
    </div>
  );
}

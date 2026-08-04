export const RNE_FINGERPRINT_PATHS = [
  "name",
  "etatAdministratif",
  "dateCreation",
  "natureJuridique",
  "activitePrincipale",
  "sectionActivitePrincipale",
  "siege.siret",
  "siege.etatAdministratif",
  "siege.dateDebutActivite"
];

export function buildRneUrl(config, siren) {
  const url = new URL(config.endpoint);
  url.searchParams.set("q", siren);
  url.searchParams.set("per_page", "1");
  url.searchParams.set("minimal", "true");
  url.searchParams.set("include", "siege");
  return url;
}

export function normalizeRne(result, company) {
  return {
    id: String(result.siren),
    siren: String(result.siren),
    label: company.label,
    name: result.nom_raison_sociale ?? result.nom_complet ?? null,
    etatAdministratif: result.etat_administratif ?? null,
    dateCreation: result.date_creation ?? null,
    dateMiseAJour: result.date_mise_a_jour ?? null,
    natureJuridique: result.nature_juridique ?? null,
    activitePrincipale: result.activite_principale ?? null,
    sectionActivitePrincipale: result.section_activite_principale ?? null,
    siege: {
      siret: result.siege?.siret ?? null,
      etatAdministratif: result.siege?.etat_administratif ?? null,
      dateDebutActivite: result.siege?.date_debut_activite ?? null,
    },
  };
}

async function fetchCompany(config, company, fetchImpl) {
  const response = await fetchImpl(buildRneUrl(config, company.siren), {
    headers: { accept: "application/json", "user-agent": "villiers-98-private-monitor/1.0" },
    signal: AbortSignal.timeout(config.timeoutMs ?? 30000),
  });
  if (!response.ok) throw new Error(`RNE ${response.status} ${response.statusText}`);
  const payload = await response.json();
  const match = (payload.results ?? []).find((result) => String(result.siren) === String(company.siren));
  if (!match) throw new Error(`SIREN ${company.siren} introuvable dans la réponse officielle.`);
  return normalizeRne(match, company);
}

export async function fetchRneCompanies(config, fetchImpl = fetch) {
  const settled = await Promise.allSettled(
    config.companies.map((company) => fetchCompany(config, company, fetchImpl)),
  );
  const records = [];
  const errors = [];

  settled.forEach((result, index) => {
    if (result.status === "fulfilled") records.push(result.value);
    else errors.push({
      label: config.companies[index].label,
      siren: config.companies[index].siren,
      error: result.reason instanceof Error ? result.reason.message : String(result.reason),
    });
  });

  return { records, errors };
}

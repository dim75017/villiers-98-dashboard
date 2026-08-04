const SELECTED_FIELDS = [
  "numero_dpe",
  "date_etablissement_dpe",
  "date_derniere_modification_dpe",
  "date_fin_validite_dpe",
  "numero_dpe_remplace",
  "numero_voie_ban",
  "nom_rue_ban",
  "code_postal_ban",
  "adresse_ban",
  "type_batiment",
  "numero_etage_appartement",
  "surface_habitable_logement",
  "surface_habitable_immeuble",
  "etiquette_dpe",
  "etiquette_ges",
  "conso_5_usages_par_m2_ep",
  "emission_ges_5_usages_par_m2"
];

export const DPE_FINGERPRINT_PATHS = [
  "dateEtablissement",
  "dateFinValidite",
  "numeroDpeRemplace",
  "typeBatiment",
  "etage",
  "surfaceLogementM2",
  "surfaceImmeubleM2",
  "etiquetteDpe",
  "etiquetteGes",
  "consommationKwhM2An",
  "emissionsKgCo2M2An"
];

function escapeLucene(value) {
  return String(value).replace(/[\\"]/g, "\\$&");
}

function normalizedStreet(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]/gi, "")
    .toUpperCase();
}

export function buildAdemeUrl(config, property) {
  const url = new URL(config.endpoint);
  const address = property.address;
  url.searchParams.set("size", String(config.pageSize ?? 100));
  url.searchParams.set(
    "qs",
    `numero_voie_ban:\"${escapeLucene(address.number)}\" AND nom_rue_ban:\"${escapeLucene(address.street)}\" AND code_postal_ban:\"${escapeLucene(address.postcode)}\"`,
  );
  url.searchParams.set("select", SELECTED_FIELDS.join(","));
  return url;
}

export function normalizeDpe(record) {
  return {
    id: String(record.numero_dpe),
    numeroDpe: String(record.numero_dpe),
    dateEtablissement: record.date_etablissement_dpe ?? null,
    dateDerniereModification: record.date_derniere_modification_dpe ?? null,
    dateFinValidite: record.date_fin_validite_dpe ?? null,
    numeroDpeRemplace: record.numero_dpe_remplace ?? null,
    adresse: record.adresse_ban ?? null,
    typeBatiment: record.type_batiment ?? null,
    etage: record.numero_etage_appartement ?? null,
    surfaceLogementM2: record.surface_habitable_logement ?? null,
    surfaceImmeubleM2: record.surface_habitable_immeuble ?? null,
    etiquetteDpe: record.etiquette_dpe ?? null,
    etiquetteGes: record.etiquette_ges ?? null,
    consommationKwhM2An: record.conso_5_usages_par_m2_ep ?? null,
    emissionsKgCo2M2An: record.emission_ges_5_usages_par_m2 ?? null,
  };
}

function isExactAddress(record, address) {
  return String(record.numero_voie_ban ?? "") === String(address.number)
    && String(record.code_postal_ban ?? "") === String(address.postcode)
    && normalizedStreet(record.nom_rue_ban) === normalizedStreet(address.street);
}

async function requestJson(url, timeoutMs, fetchImpl) {
  const response = await fetchImpl(url, {
    headers: { accept: "application/json", "user-agent": "villiers-98-private-monitor/1.0" },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`ADEME ${response.status} ${response.statusText}`);
  return response.json();
}

export async function fetchAdemeDpe(config, property, fetchImpl = fetch) {
  const firstUrl = buildAdemeUrl(config, property);
  const expectedOrigin = firstUrl.origin;
  const records = [];
  let nextUrl = firstUrl;
  let page = 0;

  while (nextUrl) {
    page += 1;
    if (page > 20) throw new Error("Pagination ADEME anormalement longue.");
    if (nextUrl.origin !== expectedOrigin) throw new Error("Pagination ADEME vers une origine inattendue.");
    const payload = await requestJson(nextUrl, config.timeoutMs ?? 30000, fetchImpl);
    for (const record of payload.results ?? []) {
      if (record.numero_dpe && isExactAddress(record, property.address)) records.push(normalizeDpe(record));
    }
    nextUrl = payload.next ? new URL(payload.next) : null;
  }

  return records;
}

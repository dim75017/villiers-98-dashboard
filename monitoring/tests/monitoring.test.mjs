import test from "node:test";
import assert from "node:assert/strict";
import { reconcileRecords } from "../lib/diff.mjs";
import { buildAdemeUrl, normalizeDpe, DPE_FINGERPRINT_PATHS } from "../lib/ademe.mjs";
import { normalizeRne, RNE_FINGERPRINT_PATHS } from "../lib/rne.mjs";
import { canonicalizeUrl, sanitizeAnnouncement, ANNOUNCEMENT_FINGERPRINT_PATHS } from "../lib/announcements.mjs";

test("la première observation crée une baseline sans alerte", () => {
  const current = [{ id: "one", label: "E" }];
  const result = reconcileRecords({
    currentRecords: current,
    keyOf: (record) => record.id,
    fingerprintPaths: ["label"],
    observedAt: "2026-08-04T00:00:00.000Z",
    suppressAlerts: true,
  });
  assert.equal(result.events.length, 0);
  assert.equal(Object.keys(result.records).length, 1);
});

test("seuls les enregistrements nouveaux ou substantiellement modifiés alertent", () => {
  const baseline = reconcileRecords({
    currentRecords: [{ id: "one", label: "E", metadataDate: "old" }],
    keyOf: (record) => record.id,
    fingerprintPaths: ["label"],
    observedAt: "2026-08-04T00:00:00.000Z",
    suppressAlerts: true,
  });
  const unchanged = reconcileRecords({
    previousRecords: baseline.records,
    currentRecords: [{ id: "one", label: "E", metadataDate: "new" }],
    keyOf: (record) => record.id,
    fingerprintPaths: ["label"],
    observedAt: "2026-08-05T00:00:00.000Z",
  });
  assert.equal(unchanged.events.length, 0);

  const changed = reconcileRecords({
    previousRecords: unchanged.records,
    currentRecords: [{ id: "one", label: "D" }, { id: "two", label: "E" }],
    keyOf: (record) => record.id,
    fingerprintPaths: ["label"],
    observedAt: "2026-08-06T00:00:00.000Z",
  });
  assert.deepEqual(changed.events.map((event) => event.kind).sort(), ["modified", "new"]);
});

test("la requête ADEME est strictement limitée à l'adresse", () => {
  const url = buildAdemeUrl(
    { endpoint: "https://data.ademe.fr/data-fair/api/v1/datasets/example/lines", pageSize: 100 },
    { address: { number: "98", street: "Avenue de Villiers", postcode: "75017" } },
  );
  assert.match(url.searchParams.get("qs"), /numero_voie_ban:\"98\"/);
  assert.match(url.searchParams.get("qs"), /nom_rue_ban:\"Avenue de Villiers\"/);
  assert.match(url.searchParams.get("qs"), /code_postal_ban:\"75017\"/);

  const normalized = normalizeDpe({
    numero_dpe: "2675E0000000A",
    etiquette_dpe: "E",
    etiquette_ges: "D",
    surface_habitable_logement: 42,
  });
  assert.equal(normalized.id, "2675E0000000A");
  assert.ok(!DPE_FINGERPRINT_PATHS.includes("dateDerniereModification"));
});

test("la normalisation RNE exclut dirigeants, contacts et adresse exacte", () => {
  const normalized = normalizeRne({
    siren: "123456789",
    nom_raison_sociale: "EXEMPLE",
    etat_administratif: "A",
    siege: { siret: "12345678900012", adresse: "adresse à ne pas conserver" },
    dirigeants: [{ nom: "PERSONNE" }],
    email: "contact@example.com",
  }, { label: "EXEMPLE" });
  assert.equal(normalized.siege.siret, "12345678900012");
  assert.equal("adresse" in normalized.siege, false);
  assert.equal("dirigeants" in normalized, false);
  assert.equal("email" in normalized, false);
  assert.ok(RNE_FINGERPRINT_PATHS.includes("etatAdministratif"));
});

test("les annonces sont dédoublonnées sans paramètres de suivi ni contacts", () => {
  const cleanUrl = canonicalizeUrl("https://example.com/a?utm_source=x&b=2&a=1#contact");
  assert.equal(cleanUrl, "https://example.com/a?a=1&b=2");
  const candidate = sanitizeAnnouncement({
    source: "Example",
    externalId: "123",
    url: "https://example.com/a?gclid=secret",
    title: "Appartement",
    phone: "0600000000",
    email: "person@example.com",
  });
  assert.equal(candidate.id, "Example::123");
  assert.equal("phone" in candidate, false);
  assert.equal("email" in candidate, false);
  assert.ok(ANNOUNCEMENT_FINGERPRINT_PATHS.includes("priceEuro"));
});

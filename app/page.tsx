"use client";

import { useEffect, useMemo, useState } from "react";
import lots from "./lots.json";
import owners from "./owners.json";

type Owner = (typeof owners)[number];
export type PrivateAddressEntry = {
  address: string | null;
  source: string | null;
  status: string | null;
  letterReady: boolean;
};
export type PrivateOutreachEntry = {
  stage: "to-send" | "sent" | "replied" | "declined" | "no-response" | "acquired";
  sentAt: string | null;
};

type HomeProps = {
  privateAddressData?: Record<string, PrivateAddressEntry>;
  privateOutreachData?: Record<string, PrivateOutreachEntry>;
  onLock?: () => void;
};

type PrivateRegistry = {
  schemaVersion?: number;
  privacy?: string;
  owners?: Array<{
    ownerKey?: string;
    correspondenceAddress?: string | null;
    addressSource?: string | null;
    addressStatus?: string | null;
  }>;
};

const ownerLots: Record<string, number[]> = {
  "SASU LOFI OFFICE": [12, 24, 29, 30, 31, 32, 33, 34, 44, 53],
  "SOMOGUY Dimitri": [7, 15, 40, 85],
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
  "CHENE-BERNARDIE Philippe": [],
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
  "SCI SC 98 BV": { name: "SCI 98BV + 98HV", type: "2 SCI liées", note: "2 SCI distinctes · 98BV : FGI depuis 05/2026 · 98HV : Roger Berdugo" },
  "SCI SC 98 HV": { name: "SCI 98BV + 98HV", type: "2 SCI liées", note: "2 SCI distinctes · 98BV : FGI depuis 05/2026 · 98HV : Roger Berdugo" },
};

type CorporateProfile = {
  entity: string;
  siren?: string;
  names?: string[];
  current?: string;
  people?: string;
  caveat?: string;
  sourceLabel: string;
  sourceUrl: string;
};

// Only names that are explicitly disclosed in public RCS/BODACC material are shown here.
// Beneficial-owner registers and full, current cap tables are not publicly available in all cases.
const corporateProfiles: Record<string, CorporateProfile[]> = {
  "SCI 98BV + 98HV": [
    {
      entity: "SCI 98BV",
      siren: "520 373 945",
      names: ["Linda Berdugo", "Roger Berdugo", "Gilbert Metoudi"],
      current: "Gérant actuel : FIDUCIA GESTION ET INFORMATIQUE (FGI), depuis le 01/05/2026",
      people: "Présidente de FGI : Linda Berdugo · ancien gérant : Roger Berdugo · associé personne physique publié : Gilbert Metoudi",
      caveat: "Les associés actuels complets ne sont pas publiquement accessibles.",
      sourceLabel: "RCS / annonce légale 2026",
      sourceUrl: "https://www.pappers.fr/entreprise/98bv-520373945",
    },
    {
      entity: "SCI 98HV",
      siren: "520 367 608",
      names: ["Roger Berdugo", "Gilbert Metoudi"],
      current: "Gérant et associé : Roger Berdugo",
      people: "Associé personne physique publié : Gilbert Metoudi",
      caveat: "Les associés actuels complets ne sont pas publiquement accessibles.",
      sourceLabel: "RCS / BODACC",
      sourceUrl: "https://www.pappers.fr/entreprise/98hv-520367608",
    },
  ],
  "Société VILLIERS PRESTIGE": [
    {
      entity: "SCI VILLIERS PRESTIGE",
      siren: "931 591 226",
      names: ["Richard Demirci", "Valérie Demirci", "Daniel Demirci"],
      current: "Gérants et associés : Richard Demirci · Valérie Demirci",
      people: "Autre associé public identifié : Daniel Demirci",
      sourceLabel: "RCS / annonces légales",
      sourceUrl: "https://entreprises.lefigaro.fr/villiers-prestige-75/entreprise-931591226",
    },
  ],
  "SCI 13ÈME SOUS SOL": [
    {
      entity: "SCI 13ème Sous Sol",
      siren: "519 413 561",
      names: ["Christophe Poujeol", "Alain N'Dong"],
      current: "Historique de constitution publié : gérant non associé Christophe Poujeol",
      people: "Associé publié : Alain N'Dong · CPH Christophe Poujeol Holding",
      caveat: "Rôles actuels à confirmer : l'annonce publique disponible porte sur la constitution.",
      sourceLabel: "BODACC de constitution",
      sourceUrl: "https://entreprises.lefigaro.fr/sol-sci-13-eme-sous-75/entreprise-519413561",
    },
  ],
  "SCI SODAIM": [
    {
      entity: "SCI SODAIM",
      caveat: "SIREN et dirigeants non rapprochés avec certitude : homonymes possibles, aucun nom n'est affiché sans preuve.",
      sourceLabel: "À consolider",
      sourceUrl: "https://annuaire-entreprises.data.gouv.fr/",
    },
  ],
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
const allowedPrivateOwnerKeys = new Set(Object.keys(ownerLots)
  .filter((ownerName) => ownerName !== "SASU LOFI OFFICE" && ownerName !== "SOMOGUY Dimitri")
  .map((ownerName) => commonControlPortfolios[ownerName]?.name ?? ownerName));

const ownerByLot = new Map<number, Owner>();
owners.forEach((owner) => ownerLots[owner.proprietaire]?.forEach((lot) => ownerByLot.set(lot, owner)));

const directLots = new Set(lots.filter((lot) => Boolean(lot.proprietaire)).map((lot) => lot.lot));
const officePackageLots = new Set([12, 24, 29, 30, 31, 32, 33, 34, 44, 53]);
const obsoleteOwnershipNote = /Rattachement au propriétaire non prouvé par les pièces disponibles: laisser vide jusqu'au retour SPF\.\s*/g;
const parkingSpacesByLot: Record<number, number> = {
  // Lot juridique unique observé comme huit places distinctes au 2e sous-sol.
  35: 8,
};
const parkingUnitValue = 30_000;
const valuationOverrides: Record<number, { value: number; note?: string }> = {
  35: { value: 240_000, note: "8 places de parking observées au 2e sous-sol · base indicative de 30 k€ / place, à confirmer par l’EDD ou les plans." },
  80: { value: 1600000 },
  84: { value: 3000000 },
};
const natureOverrides: Record<number, string> = {
  35: "Parking · 8 places",
};

const categoryForNature = (nature: string | null) => {
  if (nature?.startsWith("Parking")) return { categorie: "Parkings", categorieSlug: "parking", categorieEmoji: "🅿️" };
  if (nature === "Cave") return { categorie: "Caves", categorieSlug: "cave", categorieEmoji: "📦" };
  if (nature === "Appartement" || nature === "Studio" || nature === "Chambre") return { categorie: "Habitations", categorieSlug: "habitation", categorieEmoji: "🏠" };
  return { categorie: "Bureaux / commerces", categorieSlug: "bureau", categorieEmoji: "💼" };
};

const masterLots = lots.map((lot) => {
  const owner = ownerByLot.get(lot.lot);
  const direct = directLots.has(lot.lot);
  const displayedNature = natureOverrides[lot.lot] ?? lot.nature;
  const category = categoryForNature(displayedNature);
  const isOfficePackage = officePackageLots.has(lot.lot);
  const valuationOverride = valuationOverrides[lot.lot];
  const parkingValuation = category.categorie === "Parkings" ? (parkingSpacesByLot[lot.lot] ?? 1) * parkingUnitValue : null;
  const cleanedComment = lot.commentaires?.replace(obsoleteOwnershipNote, "").trim() || null;
  const packageComment = isOfficePackage
    ? lot.nature === "Parking" ? "Parking rattaché à l’ensemble de bureaux acquis." : "Lot principal de l’ensemble de bureaux acquis."
    : null;
  return {
    ...lot,
    nature: displayedNature,
    parkingSpaces: parkingSpacesByLot[lot.lot] ?? null,
    ...category,
    valeurEstimee: parkingValuation ?? valuationOverride?.value ?? lot.valeurEstimee,
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
// Estimation terrain Dim : les 8 places du lot 35 expliquent l'écart de tantièmes des deux plateaux SCI.
const surfaceOverrides: Record<number, number> = { 54: 200, 55: 200 };
// Étallonage bureaux réalisé sur les lots principaux uniquement : le lot 35 (8 places) reste hors surface.
const officeSurfacePerTantieme = 313 / (471 + 568);
const surfaceEstimateForLot = (lot: (typeof masterLots)[number]) => {
  if (typeof lot.surface === "number") return { value: lot.surface, documented: true };
  if (surfaceOverrides[lot.lot]) return { value: surfaceOverrides[lot.lot], documented: false };
  if (lot.lot === 84) return { value: 149.55, documented: false };
  if (lot.nature === "Studio") return { value: lot.tantiemes * studioSurfacePerTantieme, documented: false };
  if (lot.nature === "Chambre") return { value: lot.tantiemes * studioSurfacePerTantieme, documented: false };
  if (lot.nature === "Appartement") return { value: lot.tantiemes * apartmentSurfacePerTantieme, documented: false };
  if (lot.categorie === "Bureaux / commerces") return { value: lot.tantiemes * officeSurfacePerTantieme, documented: false };
  return null;
};
const habitationFormatForLot = (lot: (typeof masterLots)[number]) => {
  if (lot.categorie !== "Habitations") return null;
  if (lot.nature === "Studio") return "Studio";
  if (lot.nature === "Chambre") return "Chambre";
  const surface = surfaceEstimateForLot(lot)?.value;
  if (!surface) return "Configuration à confirmer";
  if (surface < 30) return "Studio";
  if (surface < 50) return "2 pièces";
  if (surface < 75) return "3 pièces";
  if (surface < 100) return "4 pièces";
  return "5 pièces +";
};

const ownedOwnerNames = new Set(["SASU LOFI OFFICE", "SOMOGUY Dimitri"]);
const prospectLots = masterLots.filter((lot) => !ownedOwnerNames.has(lot.proprietaire ?? ""));
const fundsCommittedToDate = 3_800_000 + 3_020_000 + 29_000;

const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const number = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });
const text = (value: unknown) => value === null || value === undefined || value === "" ? "—" : String(value);
const isNaturalPerson = (value: unknown) => String(value ?? "").startsWith("Personne physique");
const ownerIdentityEmoji = (value: unknown) => isNaturalPerson(value) ? "👤" : "🏬";
const ownerIdentityLabel = (value: unknown) => isNaturalPerson(value) ? "Personne physique" : "Société ou SCI";
const money = (value: unknown) => typeof value === "number" ? euro.format(value) : "—";
const pct = (value: unknown) => typeof value === "number" ? `${number.format(value * 100)} %` : "—";
const dateLabel = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
const acquisitionLabel = (value: string | null | undefined) => value ? `Acq. ${dateLabel.format(new Date(value))}` : null;

type OutreachStage = "to-send" | "sent" | "replied" | "declined" | "acquired";
type DashboardView = "home" | "owners" | "operations" | "rentals";
type OutreachRecord = { stage: OutreachStage; sentAt?: string; note?: string };
type OutreachBook = Record<string, OutreachRecord>;
const outreachStorageKey = "villiers-98-operational-follow-up-v1";
const outreachBackupStorageKey = "villiers-98-operational-follow-up-backup-v1";
const outreachBootstrapKey = "villiers-98-operational-follow-up-bootstrap-v3";
const outreachNoteRecoveryKey = "villiers-98-operational-follow-up-note-recovery-v1";
const dashboardViewStorageKey = "villiers-98-active-view-v1";
const dashboardFloorViewStorageKey = "villiers-98-floor-view-v1";
const outreachFilterStorageKey = "villiers-98-outreach-filter-v1";
const outreachStages: Array<{ value: OutreachStage; label: string; emoji: string }> = [
  { value: "to-send", label: "À envoyer", emoji: "✉️" },
  { value: "sent", label: "Envoyée", emoji: "📤" },
  { value: "replied", label: "Intéressé", emoji: "💬" },
  { value: "declined", label: "Refus / à recontacter", emoji: "🔁" },
  { value: "acquired", label: "Acquisition faite", emoji: "✅" },
];
const outreachStageDisplay = (stage: OutreachStage) => {
  const item = outreachStages.find((candidate) => candidate.value === stage);
  return item ? `${item.emoji} ${item.label}` : "✉️ À envoyer";
};
const localDate = () => new Date().toLocaleDateString("en-CA");
const isOutreachStage = (value: string | null | undefined): value is OutreachStage => outreachStages.some((item) => item.value === value);
const normalizeOutreachStage = (value: string | null | undefined): OutreachStage | null => value === "no-response" ? "sent" : isOutreachStage(value) ? value : null;
const dashboardLocation = () => {
  if (typeof window === "undefined") return { topView: "home" as const, outreachFilter: null, viewMode: null };
  const [section, detail] = window.location.hash.slice(1).split("/");
  if (section === "accueil") return { topView: "home" as const, outreachFilter: null, viewMode: null };
  if (section === "suivi") return { topView: "operations" as const, outreachFilter: isOutreachStage(detail) ? detail : null, viewMode: null };
  if (section === "locations") return { topView: "rentals" as const, outreachFilter: null, viewMode: null };
  if (section === "proprietaires") return { topView: "owners" as const, outreachFilter: null, viewMode: detail === "etage" ? "floor" as const : detail === "proprietaire" ? "owner" as const : null };
  return { topView: null, outreachFilter: null, viewMode: null };
};
const savedTopView = (): DashboardView => {
  if (typeof window === "undefined") return "home";
  const location = dashboardLocation();
  if (location.topView) return location.topView;
  const savedView = window.localStorage.getItem(dashboardViewStorageKey);
  return savedView === "owners" || savedView === "operations" || savedView === "rentals" || savedView === "home" ? savedView : "home";
};
const savedFloorView = (): "owner" | "floor" => {
  if (typeof window === "undefined") return "owner";
  return dashboardLocation().viewMode ?? (window.localStorage.getItem(dashboardFloorViewStorageKey) === "floor" ? "floor" : "owner");
};
const savedOutreachFilter = (): OutreachStage => {
  if (typeof window === "undefined") return "to-send";
  const routedStage = dashboardLocation().outreachFilter;
  if (routedStage) return routedStage;
  const stage = window.localStorage.getItem(outreachFilterStorageKey);
  return isOutreachStage(stage) ? stage : "to-send";
};
const savedOutreachBook = (): OutreachBook => {
  if (typeof window === "undefined") return {};
  try {
    for (const storageKey of [outreachStorageKey, outreachBackupStorageKey]) {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) continue;
      const records: OutreachBook = {};
      Object.entries(parsed).forEach(([ownerName, value]) => {
        if (!value || typeof value !== "object" || Array.isArray(value)) return;
        const record = value as Record<string, unknown>;
        const stage = normalizeOutreachStage(typeof record.stage === "string" ? record.stage : null);
        if (!stage) return;
        records[ownerName] = {
          stage,
          sentAt: typeof record.sentAt === "string" ? record.sentAt : undefined,
          note: typeof record.note === "string" ? record.note : undefined,
        };
      });
      return records;
    }
  } catch {
    // La copie de secours permet de poursuivre même après une écriture interrompue.
  }
  return {};
};

type MasterLot = (typeof masterLots)[number];
const categoryNames = ["Parkings", "Caves", "Bureaux / commerces", "Habitations"];
const primaryCategoryNames = ["Habitations", "Bureaux / commerces"];
const categoryEmoji: Record<string, string> = { Parkings: "🅿️", Caves: "📦", "Bureaux / commerces": "💼", Habitations: "🏠" };
const categoryShortName: Record<string, string> = { Parkings: "Parkings", Caves: "Caves", "Bureaux / commerces": "Bureaux / commerces", Habitations: "Habitations" };

const floorRank = (floor: string | null) => {
  const label = floor?.toLocaleLowerCase("fr") ?? "";
  const basement = label.match(/(\d+)(?:er|e) sous-sol/);
  if (basement) return -Number(basement[1]);
  if (label.includes("rez-de-jardin")) return -0.5;
  if (label.includes("rez-de-chaussée") || label.includes("rdc")) return 0;
  const level = label.match(/(\d+)(?:er|e) étage/);
  return level ? Number(level[1]) : 100;
};

export default function Home({ privateAddressData, privateOutreachData, onLock }: HomeProps = {}) {
  const [privateAddresses, setPrivateAddresses] = useState<Record<string, PrivateAddressEntry>>(privateAddressData ?? {});
  const [privateAddressStatus, setPrivateAddressStatus] = useState<"loading" | "loaded" | "error">(privateAddressData ? "loaded" : "loading");
  const [copiedOwner, setCopiedOwner] = useState<string | null>(null);
  const [revealedAddressOwner, setRevealedAddressOwner] = useState<string | null>(null);
  const [revealedCorporateOwner, setRevealedCorporateOwner] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"owner" | "floor">(savedFloorView);
  const [topView, setTopView] = useState<DashboardView>(savedTopView);
  const [outreach, setOutreach] = useState<OutreachBook>(savedOutreachBook);
  const [outreachReady] = useState(true);
  const [outreachFilter, setOutreachFilter] = useState<OutreachStage>(savedOutreachFilter);

  useEffect(() => {
    if (!outreachReady) return;
    try {
      const serialized = JSON.stringify(outreach);
      window.localStorage.setItem(outreachStorageKey, serialized);
      window.localStorage.setItem(outreachBackupStorageKey, serialized);
    } catch {
      // Le navigateur peut bloquer l'écriture en navigation privée stricte.
    }
  }, [outreach, outreachReady]);

  useEffect(() => {
    try {
      window.localStorage.setItem(dashboardViewStorageKey, topView);
      window.localStorage.setItem(dashboardFloorViewStorageKey, viewMode);
      window.localStorage.setItem(outreachFilterStorageKey, outreachFilter);
      const hash = topView === "home"
        ? "#accueil"
        : topView === "operations"
          ? `#suivi/${outreachFilter}`
          : topView === "rentals"
            ? "#locations"
            : `#proprietaires/${viewMode === "floor" ? "etage" : "proprietaire"}`;
      if (window.location.hash !== hash) {
        window.history.replaceState({ dashboardView: topView }, "", `${window.location.pathname}${window.location.search}${hash}`);
      }
    } catch { /* sans impact sur la vue */ }
  }, [topView, viewMode, outreachFilter]);
  useEffect(() => {
    const syncTopViewWithLocation = () => {
      const location = dashboardLocation();
      if (!location.topView) return;
      setTopView(location.topView);
      if (location.viewMode) setViewMode(location.viewMode);
      if (location.outreachFilter) setOutreachFilter(location.outreachFilter);
    };
    window.addEventListener("hashchange", syncTopViewWithLocation);
    window.addEventListener("popstate", syncTopViewWithLocation);
    syncTopViewWithLocation();
    return () => {
      window.removeEventListener("hashchange", syncTopViewWithLocation);
      window.removeEventListener("popstate", syncTopViewWithLocation);
    };
  }, []);
  useEffect(() => {
    if (privateAddressData) {
      return;
    }

    let active = true;

    const loadPrivateAddresses = async () => {
      try {
        const response = await fetch("/api/private-addresses", {
          cache: "no-store",
          credentials: "same-origin",
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error("Registre privé indisponible");
        const payload = await response.text();
        if (payload.length > 200_000) throw new Error("Registre privé trop volumineux");
        const registry = JSON.parse(payload) as PrivateRegistry;
        if (registry.schemaVersion !== 2 || registry.privacy !== "LOCAL_PRIVATE_DO_NOT_COMMIT_OR_PUBLISH" || !Array.isArray(registry.owners) || registry.owners.length > 100) {
          throw new Error("Registre privé non reconnu");
        }

        const seenKeys = new Set<string>();
        const entries: Record<string, PrivateAddressEntry> = {};
        for (const owner of registry.owners) {
          const ownerKey = typeof owner.ownerKey === "string" ? owner.ownerKey.trim() : "";
          if (!ownerKey || !allowedPrivateOwnerKeys.has(ownerKey) || seenKeys.has(ownerKey)) throw new Error("Propriétaire privé non reconnu");
          if (owner.correspondenceAddress !== null && owner.correspondenceAddress !== undefined && typeof owner.correspondenceAddress !== "string") throw new Error("Adresse privée invalide");
          if (owner.addressSource !== null && owner.addressSource !== undefined && typeof owner.addressSource !== "string") throw new Error("Source privée invalide");
          if (owner.addressStatus !== null && owner.addressStatus !== undefined && typeof owner.addressStatus !== "string") throw new Error("Statut privé invalide");
          const address = typeof owner.correspondenceAddress === "string" ? owner.correspondenceAddress.trim() : null;
          const source = typeof owner.addressSource === "string" ? owner.addressSource.trim() : null;
          const status = typeof owner.addressStatus === "string" ? owner.addressStatus.trim() : null;
          if ((address?.length ?? 0) > 300 || (source?.length ?? 0) > 200 || (status?.length ?? 0) > 200) throw new Error("Champ privé trop long");
          seenKeys.add(ownerKey);
          entries[ownerKey] = { address: address || null, source: source || null, status: status || null, letterReady: Boolean(address) };
        }

        if (active) {
          setPrivateAddresses(entries);
          setPrivateAddressStatus("loaded");
        }
      } catch {
        if (active) {
          setPrivateAddresses({});
          setPrivateAddressStatus("error");
        }
      }
    };

    loadPrivateAddresses();
    return () => { active = false; };
  }, [privateAddressData]);

  const copyPrivateAddress = async (ownerName: string, address: string) => {
    try {
      await navigator.clipboard.writeText(address);
    } catch {
      const field = document.createElement("textarea");
      field.value = address;
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    setCopiedOwner(ownerName);
    window.setTimeout(() => setCopiedOwner((current) => current === ownerName ? null : current), 1800);
  };

  const ownerGroups = useMemo(() => {
    const grouped = new Map<string, MasterLot[]>();
    masterLots.forEach((lot) => {
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
        corporateProfiles: corporateProfiles[ownerName] ?? null,
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

  const dynamicallyAcquiredOwnerNames = useMemo(() => {
    const names = new Set<string>();
    Object.entries(outreach).forEach(([ownerName, record]) => {
      if (record.stage === "acquired") names.add(ownerName);
    });
    Object.entries(privateOutreachData ?? {}).forEach(([ownerName, record]) => {
      if (record.stage === "acquired") names.add(ownerName);
    });
    return names;
  }, [outreach, privateOutreachData]);
  const ownerGroupName = (ownerName: string | null | undefined) => ownerName ? commonControlPortfolios[ownerName]?.name ?? ownerName : "À identifier";
  const isAcquiredLot = (lot: MasterLot) => ownedOwnerNames.has(lot.proprietaire ?? "") || dynamicallyAcquiredOwnerNames.has(ownerGroupName(lot.proprietaire));
  const activeOwnerGroups = ownerGroups.filter((group) => !ownedOwnerNames.has(group.ownerName) && !dynamicallyAcquiredOwnerNames.has(group.ownerName));
  const currentOwnedLots = masterLots.filter(isAcquiredLot);
  const currentProspectLots = masterLots.filter((lot) => !isAcquiredLot(lot));
  const currentOwnedShare = currentOwnedLots.reduce((sum, lot) => sum + (lot.tantiemes ?? 0), 0) / 10000;
  const currentEstimatedRemainingAcquisition = currentProspectLots.reduce((sum, lot) => sum + (lot.valeurEstimee ?? 0), 0);
  const propertyMix = useMemo(() => {
    const homes = masterLots.filter((lot) => lot.categorie === "Habitations");
    const formats = [
      { label: "5 pièces +", displayLabel: "5 pièces +", emoji: "🏡", className: "home-large" },
      { label: "3 pièces", displayLabel: "3 pièces", emoji: "🏠", className: "home-family" },
      { label: "Studio", displayLabel: "studios", emoji: "🛏️", className: "home-studio" },
      { label: "Chambre", displayLabel: "chambre", emoji: "🛌", className: "home-room" },
    ]
      .map((format) => ({ ...format, count: homes.filter((lot) => habitationFormatForLot(lot) === format.label).length }))
      .filter((item) => item.count > 0);
    const parkingSpaces = masterLots.filter((lot) => lot.categorie === "Parkings").reduce((sum, lot) => sum + (lot.parkingSpaces ?? 1), 0);
    return {
      homeCount: homes.length,
      formats,
      parkingSpaces,
      caveCount: masterLots.filter((lot) => lot.categorie === "Caves").length,
      officeCount: masterLots.filter((lot) => lot.categorie === "Bureaux / commerces").length,
    };
  }, []);

  const floorGroups = (() => {
    const grouped = new Map<string, MasterLot[]>();
    masterLots.forEach((lot) => {
      const floor = lot.etage ?? "Niveau à confirmer";
      const current = grouped.get(floor) ?? [];
      current.push(lot);
      grouped.set(floor, current);
    });

    return Array.from(grouped.entries())
      .map(([floor, floorLots]) => {
        const surfaceDetails = floorLots.reduce<Array<{ value: number; documented: boolean }>>((items, lot) => {
          const detail = surfaceEstimateForLot(lot);
          if (detail) items.push(detail);
          return items;
        }, []);

        return {
          floor,
          lots: [...floorLots].sort((a, b) => a.lot - b.lot),
          parkingSpaceCount: floorLots.reduce((sum, lot) => sum + (lot.parkingSpaces ?? 0), 0),
          value: floorLots.reduce((sum, lot) => sum + (lot.valeurEstimee ?? 0), 0),
          ownedLotCount: floorLots.filter(isAcquiredLot).length,
          surface: surfaceDetails.reduce((sum, detail) => sum + detail.value, 0),
          surfaceEstimated: surfaceDetails.some((detail) => !detail.documented),
        };
      })
      .sort((a, b) => floorRank(b.floor) - floorRank(a.floor));
  })();

  const addressReveal = (ownerName: string, isResident: boolean) => {
    const isOpen = revealedAddressOwner === ownerName;
    const entry = isResident ? null : privateAddresses[ownerName];
    const address = isResident ? "98 avenue de Villiers, 75017 Paris" : entry?.address;
    const isLoading = !isResident && privateAddressStatus === "loading";
    return <div className="address-reveal">
      <button
        type="button"
        className={`mailbox-status ${isResident ? "seen" : "not-seen"}`}
        aria-expanded={isOpen}
        aria-controls={`address-${ownerName.replace(/[^a-z0-9]/gi, "-")}`}
        onClick={() => setRevealedAddressOwner(isOpen ? null : ownerName)}
      >
        📍 {isResident ? "Résident" : "Non-résident"}
      </button>
      {isOpen && <div id={`address-${ownerName.replace(/[^a-z0-9]/gi, "-")}`} className={`address-popover${address ? "" : " missing"}`} role="status">
        <span>📮 {isLoading ? "Chargement de l’adresse…" : address ?? "Adresse à confirmer"}</span>
        {address && <button type="button" onClick={() => copyPrivateAddress(ownerName, address)} aria-label={`Copier l’adresse de ${ownerName}`}>
          {copiedOwner === ownerName ? "✓ Copiée" : "Copier"}
        </button>}
      </div>}
    </div>;
  };

  const corporateReveal = (ownerName: string, profiles: CorporateProfile[] | null) => {
    if (!profiles) return null;
    const names = Array.from(new Set(profiles.flatMap((profile) => profile.names ?? [])));
    const isOpen = revealedCorporateOwner === ownerName;
    return <div className="corporate-reveal">
      <button type="button" className="corporate-button" aria-expanded={isOpen} onClick={() => setRevealedCorporateOwner(isOpen ? null : ownerName)}>
        {names.length ? `👥 ${names.join(" · ")}` : "🏢 Informations SCI"}
      </button>
      {isOpen && <div className="corporate-popover" role="status">
        {profiles.map((profile) => <section key={profile.entity}><strong>{profile.entity}{profile.siren ? ` · SIREN ${profile.siren}` : ""}</strong>{profile.current && <span>{profile.current}</span>}{profile.people && <span>{profile.people}</span>}{profile.caveat && <small>{profile.caveat}</small>}<a href={profile.sourceUrl} target="_blank" rel="noreferrer">↗ {profile.sourceLabel}</a></section>)}
      </div>}
    </div>;
  };

  const trackedOwners = activeOwnerGroups.filter((group) => group.ownerName !== "À identifier");
  const outreachRecord = (ownerName: string, book: OutreachBook): OutreachRecord => {
    const record = book[ownerName];
    const storedStage = record ? normalizeOutreachStage(record.stage) : null;
    if (record && storedStage) return { ...record, stage: storedStage };
    const privateDefault = privateOutreachData?.[ownerName];
    const defaultStage = privateDefault ? normalizeOutreachStage(privateDefault.stage) : null;
    return privateDefault && defaultStage
      ? { stage: defaultStage, sentAt: privateDefault.sentAt ?? undefined }
      : { stage: "to-send" };
  };
  const outreachFor = (ownerName: string): OutreachRecord => outreachRecord(ownerName, outreach);
  useEffect(() => {
    if (!outreachReady || !privateOutreachData) return;
    try {
      if (window.localStorage.getItem(outreachBootstrapKey)) return;
      setOutreach((current) => {
        const next = { ...current };
        trackedOwners.forEach((group) => {
          const existing = next[group.ownerName];
          const defaultRecord = privateOutreachData[group.ownerName];
          if (!defaultRecord) return;
          const defaultStage = normalizeOutreachStage(defaultRecord.stage);
          if (defaultStage && (!existing || existing.stage === "to-send")) {
            next[group.ownerName] = { ...existing, stage: defaultStage, sentAt: existing?.sentAt ?? defaultRecord.sentAt ?? undefined };
          }
        });
        return next;
      });
      window.localStorage.setItem(outreachBootstrapKey, "1");
    } catch {
      // Le suivi reste utilisable même si le navigateur refuse le stockage local.
    }
  }, [outreachReady, privateOutreachData, trackedOwners]);

  useEffect(() => {
    if (!outreachReady) return;
    try {
      if (window.localStorage.getItem(outreachNoteRecoveryKey)) return;
      setOutreach((current) => {
        let changed = false;
        const next = { ...current };
        Object.entries(current).forEach(([ownerName, record]) => {
          if (record.stage !== "to-send" || !record.note?.trim()) return;
          const defaultRecord = privateOutreachData?.[ownerName];
          const defaultStage = defaultRecord ? normalizeOutreachStage(defaultRecord.stage) : null;
          next[ownerName] = { ...record, stage: defaultStage && defaultStage !== "to-send" ? defaultStage : "sent", sentAt: record.sentAt ?? defaultRecord?.sentAt ?? localDate() };
          changed = true;
        });
        return changed ? next : current;
      });
      window.localStorage.setItem(outreachNoteRecoveryKey, "1");
    } catch {
      // La récupération reste sans effet si le navigateur bloque le stockage local.
    }
  }, [outreachReady, privateOutreachData]);
  const updateOutreach = (ownerName: string, update: Partial<OutreachRecord>) => {
    setOutreach((current) => {
      const record = outreachRecord(ownerName, current);
      return { ...current, [ownerName]: { ...record, ...update } };
    });
  };
  const changeOutreachStage = (ownerName: string, stage: OutreachStage) => {
    setOutreach((current) => {
      const record = outreachRecord(ownerName, current);
      return { ...current, [ownerName]: { ...record, stage, sentAt: stage === "to-send" ? undefined : record.sentAt ?? localDate() } };
    });
    setOutreachFilter(stage);
  };
  const outreachCounts = outreachStages.reduce<Record<OutreachStage, number>>((counts, item) => {
    counts[item.value] = trackedOwners.filter((group) => {
      const record = outreachFor(group.ownerName);
      return record.stage === item.value;
    }).length;
    return counts;
  }, { "to-send": 0, sent: 0, replied: 0, declined: 0, acquired: 0 });
  const visibleTrackedOwners = trackedOwners.filter((group) => {
    const record = outreachFor(group.ownerName);
    return record.stage === outreachFilter;
  });
  const changeTopView = (nextView: DashboardView) => {
    setTopView(nextView);
    try {
      window.localStorage.setItem(dashboardViewStorageKey, nextView);
      const hash = nextView === "home"
        ? "#accueil"
        : nextView === "operations"
          ? `#suivi/${outreachFilter}`
          : nextView === "rentals"
            ? "#locations"
            : `#proprietaires/${viewMode === "floor" ? "etage" : "proprietaire"}`;
      window.history.replaceState({ dashboardView: nextView }, "", `${window.location.pathname}${window.location.search}${hash}`);
    } catch { /* la navigation reste utilisable */ }
  };
  const returnToMainView = () => {
    setViewMode("owner");
    setRevealedAddressOwner(null);
    setRevealedCorporateOwner(null);
    changeTopView("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="app-shell">
      <aside className="dashboard-sidebar">
        <button type="button" className="identity identity-home" onClick={returnToMainView} aria-label="Retour à l'accueil"><div><strong>🏢 98 avenue de Villiers</strong><small>Tableau de bord de suivi</small></div></button>
        <nav className="sidebar-nav" aria-label="Navigation principale">
          <button type="button" className={topView === "home" ? "active" : ""} aria-pressed={topView === "home"} onClick={() => changeTopView("home")}><span>🏠</span> Accueil</button>
          <button type="button" className={topView === "owners" ? "active" : ""} aria-pressed={topView === "owners"} onClick={() => changeTopView("owners")}><span>👥</span> Liste des propriétaires</button>
          <button type="button" className={topView === "operations" ? "active" : ""} aria-pressed={topView === "operations"} onClick={() => changeTopView("operations")}><span>🤝</span> Suivi acquisition</button>
          <button type="button" className={topView === "rentals" ? "active" : ""} aria-pressed={topView === "rentals"} onClick={() => changeTopView("rentals")}><span>🔑</span> Suivi location</button>
        </nav>
      </aside>

      <div className="dashboard-main">
      {topView === "home" && <section className="hero home-hero">
        <div className="metrics">
          <article><small>🧩 Lots à acquérir</small><strong>{currentProspectLots.length}</strong><p>Hors lots déjà maîtrisés</p></article>
          <article><small>👥 Propriétaires à approcher</small><strong>{activeOwnerGroups.length}</strong><p>Les positions déjà détenues sont retirées</p></article>
          <article><small>🧮 Tantièmes contrôlés</small><strong>10 000</strong><p>Rapprochés lot par lot et propriétaire par propriétaire</p></article>
        </div>
        <section className="property-mix"><header><div><span>🧱 COMPOSITION DE L’IMMEUBLE</span><strong>{propertyMix.homeCount} habitations</strong></div><small>Typologies estimées à partir de la nature et des surfaces reconstituées.</small></header><div className="property-mix-grid"><article className="office"><strong>{propertyMix.officeCount}</strong><span>💼 lots bureaux / commerces</span></article>{propertyMix.formats.map((item) => <article key={item.label} className={item.className}><strong>{item.count}</strong><span>{item.emoji} {item.count > 1 ? item.displayLabel : item.label === "Studio" ? "studio" : item.displayLabel}</span></article>)}<article className="parking"><strong>{propertyMix.parkingSpaces}</strong><span>🅿️ places de parking</span></article><article className="cave"><strong>{propertyMix.caveCount}</strong><span>📦 caves</span></article></div></section>
        <div className="ownership-progress"><div className="progress-copy"><span>📈 Progression de l’acquisition</span><strong>{pct(currentOwnedShare)} des tantièmes</strong></div><div className="progress-visual" aria-label={`${pct(currentOwnedShare)} des tantièmes déjà maîtrisés`}><div className="progress-track"><i style={{ width: `${currentOwnedShare * 100}%` }} /><b style={{ left: `${currentOwnedShare * 100}%` }}>{pct(currentOwnedShare)}</b></div><div className="progress-scale"><span>0 %</span><span>25 %</span><span>50 %</span><span>75 %</span><span>100 %</span></div></div><div className="progress-finance"><span><b>{money(fundsCommittedToDate)}</b> engagés à date</span><span><b>{money(currentEstimatedRemainingAcquisition)}</b> estimés pour le solde</span></div></div>
      </section>}

      {topView === "owners" && <section className="section lots-section">
        <div className="section-title"><div><span className="eyebrow copper">📋 COPROPRIÉTÉ</span><h2>Liste des propriétaires</h2></div><div className="section-actions"><div className="view-switch" role="group" aria-label="Mode d’affichage"><button type="button" className={viewMode === "owner" ? "active" : ""} aria-pressed={viewMode === "owner"} onClick={() => setViewMode("owner")}>👥 Par propriétaire</button><button type="button" className={viewMode === "floor" ? "active" : ""} aria-pressed={viewMode === "floor"} onClick={() => setViewMode("floor")}>🏢 Par étage</button></div></div></div>

        {viewMode === "owner" ? <><div className="portfolio-grid">
          {ownerGroups.filter((group) => group.primaryLotCount > 0).map((group) => <article key={group.ownerName} className={`portfolio-card${group.lots.every(isAcquiredLot) ? " owned" : ""}`}>
            <header><div><h3><span role="img" aria-label={ownerIdentityLabel(group.type)}>{ownerIdentityEmoji(group.type)}</span> {group.ownerName}{group.lots.every(isAcquiredLot) && <i className="owned-portfolio">✓ Déjà acquis</i>}</h3><div className="owner-badges">{addressReveal(group.ownerName, group.mailboxSeen)}{corporateReveal(group.ownerName, group.corporateProfiles)}</div></div><div className="portfolio-weight"><strong>{pct(group.ownerShare)}</strong><span>{number.format(group.ownerWeight)} tantièmes</span></div></header>
            <div className="primary-categories">{group.primaryCategories.map((category) => <section key={category.name} className={`primary-category ${category.name === "Habitations" ? "habitation" : "bureau"}`}><h4>{categoryEmoji[category.name]} {categoryShortName[category.name]}</h4><div>{category.lots.map((lot) => { const surfaceDetail = surfaceEstimateForLot(lot); const habitationFormat = habitationFormatForLot(lot); const acquisition = acquisitionLabel(lot.dateAcquisition); return <span key={lot.lot} className="primary-lot"><b>Lot {lot.lot}</b><small>{text(lot.etage)}{surfaceDetail ? ` · ${surfaceDetail.documented ? "" : "≈ "}${number.format(surfaceDetail.value)} m²` : ""}{habitationFormat ? ` · ${habitationFormat}` : ""}</small>{acquisition && <i>📅 {acquisition}</i>}{lot.valeurEstimee && <em>≈ {money(lot.valeurEstimee)}</em>}{lot.valuationNote && <i>{lot.valuationNote}</i>}</span>; })}</div></section>)}</div>
            {group.accessoryLots.length > 0 && <div className="accessory-line">{group.accessoryCategories.map((category) => { const categoryValue = category.lots.reduce((sum, lot) => sum + (lot.valeurEstimee ?? 0), 0); const acquisitions = category.lots.map((lot) => acquisitionLabel(lot.dateAcquisition) ? `L${lot.lot} · ${acquisitionLabel(lot.dateAcquisition)}` : null).filter(Boolean); const parkingSpaces = category.name === "Parkings" ? category.lots.reduce((sum, lot) => sum + (lot.parkingSpaces ?? 1), 0) : category.lots.length; const categoryLabel = category.name === "Parkings" ? `${parkingSpaces} place${parkingSpaces > 1 ? "s" : ""} de parking` : `${category.lots.length} ${categoryShortName[category.name].toLocaleLowerCase("fr")}`; return <span key={category.name}>{categoryEmoji[category.name]} {categoryLabel} · lot{category.lots.length > 1 ? "s" : ""} {category.lots.map((lot) => lot.lot).join(", ")}{categoryValue ? ` · ≈ ${money(categoryValue)}` : ""}{acquisitions.length ? ` · 📅 ${acquisitions.join(" · ")}` : ""}</span>; })}</div>}
            <footer><span>{group.estimatedPrimarySurface ? `📐 ${group.estimatedPrimarySurfaceCount ? "≈ " : ""}${number.format(group.estimatedPrimarySurface)} m²${group.documentedPrimarySurfaceCount ? ` · ${group.documentedPrimarySurfaceCount} mesuré${group.documentedPrimarySurfaceCount > 1 ? "s" : ""}` : ""}` : "📐 Surface non reconstituée"}</span><span>{group.value ? `💶 ≈ ${money(group.value)}` : ""}</span></footer>
          </article>)}</div>

        <section className="accessory-section"><div><span className="eyebrow">🅿️ 📦 ANNEXES SEULES</span><h3>Parkings et caves sans logement ni bureau associé</h3><p>Parkings : base de travail ≈ 30 k€ par place, recalibrée sur un loyer observé de 200 à 230 € / mois. À confirmer par dimensions, accès et comparables de vente.</p></div><div className="accessory-owner-list">{ownerGroups.filter((group) => group.primaryLotCount === 0).map((group) => <article key={group.ownerName} className={group.lots.every(isAcquiredLot) ? "owned" : ""}><div><strong><span role="img" aria-label={ownerIdentityLabel(group.type)}>{ownerIdentityEmoji(group.type)}</span> {group.ownerName}{group.lots.every(isAcquiredLot) && <i className="owned-portfolio">✓ Déjà acquis</i>}</strong><small>{number.format(group.ownerWeight)} tantièmes</small><div className="owner-badges">{addressReveal(group.ownerName, group.mailboxSeen)}{corporateReveal(group.ownerName, group.corporateProfiles)}</div></div><p>{group.accessoryCategories.map((category) => { const categoryValue = category.lots.reduce((sum, lot) => sum + (lot.valeurEstimee ?? 0), 0); const parkingSpaces = category.name === "Parkings" ? category.lots.reduce((sum, lot) => sum + (lot.parkingSpaces ?? 1), 0) : category.lots.length; const categoryLabel = category.name === "Parkings" ? `${parkingSpaces} place${parkingSpaces > 1 ? "s" : ""} de parking` : `${category.lots.length} ${categoryShortName[category.name].toLocaleLowerCase("fr")}`; return <span key={category.name}>{categoryEmoji[category.name]} {categoryLabel} : lot{category.lots.length > 1 ? "s" : ""} {category.lots.map((lot) => lot.lot).join(", ")}{categoryValue ? ` · ≈ ${money(categoryValue)}` : ""}</span>; })}</p></article>)}</div></section></> : <div className="floor-grid">{floorGroups.map((group) => <article key={group.floor} className="floor-card"><header><div><span className="floor-kicker">🏢 NIVEAU</span><h3>{group.floor}</h3></div><div className="floor-summary"><strong>{group.lots.length} lot{group.lots.length > 1 ? "s" : ""}{group.parkingSpaceCount ? ` · ${group.parkingSpaceCount} places` : ""}{group.ownedLotCount > 0 ? ` · ${group.ownedLotCount} acquis` : ""}</strong>{group.surface > 0 && <span>📐 {group.surfaceEstimated ? "≈ " : ""}{number.format(group.surface)} m²</span>}<span>≈ {money(group.value)}</span></div></header><div className="floor-lots">{group.lots.map((lot) => { const surfaceDetail = surfaceEstimateForLot(lot); const habitationFormat = habitationFormatForLot(lot); const ownerName = ownerGroupName(lot.proprietaire); const isOwned = isAcquiredLot(lot); const isResident = lot.proprietaire ? ownersSeenOnMailbox.has(ownerName) : null; const profiles = lot.proprietaire ? corporateProfiles[ownerName] ?? null : null; return <article key={lot.lot} className={`floor-lot${isOwned ? " owned" : ""}`}><span>{lot.categorie === "Parkings" && lot.parkingSpaces ? `🅿️ ${lot.parkingSpaces} places de parking` : `${categoryEmoji[lot.categorie]} ${categoryShortName[lot.categorie]}${habitationFormat ? ` · ${habitationFormat}` : ""}`}</span><b>Lot {lot.lot}</b><strong>{ownerName}</strong>{isOwned ? <div className="floor-status"><i className="owned-lot">✓ Déjà acquis</i></div> : isResident !== null && <div className="owner-badges floor-owner-badges"><i className={isResident ? "resident" : "non-resident"}>📍 {isResident ? "Résident" : "Non-résident"}</i>{corporateReveal(`floor-${lot.lot}`, profiles)}</div>}{surfaceDetail && <small>{surfaceDetail.documented ? "" : "≈ "}{number.format(surfaceDetail.value)} m²</small>}{lot.valeurEstimee && <em>≈ {money(lot.valeurEstimee)}</em>}</article>; })}</div></article>)}</div>}
      </section>}

      {topView === "operations" && <section className="section operations-section">
        <div className="section-title"><div><span className="eyebrow copper">🗂️ PILOTAGE DES APPROCHES</span><h2>Suivi opérationnel</h2></div><p className="operations-save">Enregistré uniquement sur cet appareil</p></div>
        <div className="operations-summary" role="tablist" aria-label="Étape de prospection">
          {outreachStages.map((stage) => <button key={stage.value} type="button" role="tab" aria-selected={outreachFilter === stage.value} className={`stage-${stage.value}${outreachFilter === stage.value ? " active" : ""}`} onClick={() => setOutreachFilter(stage.value)}><small>{stage.label}</small><strong>{outreachCounts[stage.value]}</strong></button>)}
        </div>
        <div className="operations-list">
          {visibleTrackedOwners.map((group) => {
            const record = outreachFor(group.ownerName);
            return <article key={group.ownerName} className={`portfolio-card operation-card stage-${record.stage}`}>
              <header><div><h3><span role="img" aria-label={ownerIdentityLabel(group.type)}>{ownerIdentityEmoji(group.type)}</span> {group.ownerName}</h3><div className="owner-badges">{addressReveal(group.ownerName, group.mailboxSeen)}{corporateReveal(`operation-${group.ownerName}`, group.corporateProfiles)}</div></div><div className="portfolio-weight"><strong>{pct(group.ownerShare)}</strong><span>{number.format(group.ownerWeight)} tantièmes</span></div></header>
              {group.primaryCategories.length > 0 && <div className="primary-categories">{group.primaryCategories.map((category) => <section key={category.name} className={`primary-category ${category.name === "Habitations" ? "habitation" : "bureau"}`}><h4>{categoryEmoji[category.name]} {categoryShortName[category.name]}</h4><div>{category.lots.map((lot) => { const surfaceDetail = surfaceEstimateForLot(lot); const habitationFormat = habitationFormatForLot(lot); const acquisition = acquisitionLabel(lot.dateAcquisition); return <span key={lot.lot} className="primary-lot"><b>Lot {lot.lot}</b><small>{text(lot.etage)}{surfaceDetail ? ` · ${surfaceDetail.documented ? "" : "≈ "}${number.format(surfaceDetail.value)} m²` : ""}{habitationFormat ? ` · ${habitationFormat}` : ""}</small>{acquisition && <i>📅 {acquisition}</i>}{lot.valeurEstimee && <em>≈ {money(lot.valeurEstimee)}</em>}{lot.valuationNote && <i>{lot.valuationNote}</i>}</span>; })}</div></section>)}</div>}
              {group.accessoryLots.length > 0 && <div className="accessory-line">{group.accessoryCategories.map((category) => { const categoryValue = category.lots.reduce((sum, lot) => sum + (lot.valeurEstimee ?? 0), 0); const acquisitions = category.lots.map((lot) => acquisitionLabel(lot.dateAcquisition) ? `L${lot.lot} · ${acquisitionLabel(lot.dateAcquisition)}` : null).filter(Boolean); const parkingSpaces = category.name === "Parkings" ? category.lots.reduce((sum, lot) => sum + (lot.parkingSpaces ?? 1), 0) : category.lots.length; const categoryLabel = category.name === "Parkings" ? `${parkingSpaces} place${parkingSpaces > 1 ? "s" : ""} de parking` : `${category.lots.length} ${categoryShortName[category.name].toLocaleLowerCase("fr")}`; return <span key={category.name}>{categoryEmoji[category.name]} {categoryLabel} · lot{category.lots.length > 1 ? "s" : ""} {category.lots.map((lot) => lot.lot).join(", ")}{categoryValue ? ` · ≈ ${money(categoryValue)}` : ""}{acquisitions.length ? ` · 📅 ${acquisitions.join(" · ")}` : ""}</span>; })}</div>}
              <div className="operation-controls">
                <label className={`status-field stage-${record.stage}`}><span>Statut</span><span className="status-select"><select aria-label={`Statut de ${group.ownerName}`} value={record.stage} onChange={(event) => changeOutreachStage(group.ownerName, event.target.value as OutreachStage)}>{outreachStages.map((stage) => <option key={stage.value} value={stage.value}>{stage.emoji} {stage.label}</option>)}</select></span></label>
                <label>Date d’envoi<input type="date" value={record.sentAt ?? ""} onChange={(event) => updateOutreach(group.ownerName, { sentAt: event.target.value || undefined })} /></label>
              </div>
              <label className="operation-note">Notes de suivi<textarea value={record.note ?? ""} placeholder="Réponse reçue, contexte de l'échange, point à retenir…" onChange={(event) => updateOutreach(group.ownerName, { note: event.target.value })} /></label>
              <footer><span>{group.estimatedPrimarySurface ? `📐 ${group.estimatedPrimarySurfaceCount ? "≈ " : ""}${number.format(group.estimatedPrimarySurface)} m²${group.documentedPrimarySurfaceCount ? ` · ${group.documentedPrimarySurfaceCount} mesuré${group.documentedPrimarySurfaceCount > 1 ? "s" : ""}` : ""}` : "📐 Surface non reconstituée"}</span><span>{group.value ? `💶 ≈ ${money(group.value)}` : ""}</span></footer>
            </article>;
          })}
          {visibleTrackedOwners.length === 0 && <p className="operations-empty">Aucun propriétaire dans cette étape.</p>}
        </div>
      </section>}

      {topView === "rentals" && <section className="section rentals-section">
        <div className="section-title"><div><span className="eyebrow copper">🅿️ PILOTAGE LOCATIF</span><h2>Suivi location</h2></div></div>
        <div className="rentals-empty"><span>🅿️</span><h3>Locations à organiser</h3><p>Les places disponibles, loyers, locataires et échéances apparaîtront ici au fur et à mesure des mises en location.</p></div>
      </section>}
      </div>
    </main>
  );
}

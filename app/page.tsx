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

type HomeProps = {
  privateAddressData?: Record<string, PrivateAddressEntry>;
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
  .filter((ownerName) => ownerName !== "SARL IMMOVILLIERS" && ownerName !== "SOMOGUY Dimitri")
  .map((ownerName) => commonControlPortfolios[ownerName]?.name ?? ownerName));

const ownerByLot = new Map<number, Owner>();
owners.forEach((owner) => ownerLots[owner.proprietaire]?.forEach((lot) => ownerByLot.set(lot, owner)));

const directLots = new Set(lots.filter((lot) => Boolean(lot.proprietaire)).map((lot) => lot.lot));
const officePackageLots = new Set([12, 24, 29, 30, 31, 32, 33, 34, 44, 53]);
const obsoleteOwnershipNote = /Rattachement au propriétaire non prouvé par les pièces disponibles: laisser vide jusqu'au retour SPF\.\s*/g;
const valuationOverrides: Record<number, { value: number; note?: string }> = {
  35: { value: 35_000, note: "Hypothèse Dimitri : parking en 2e sous-sol, à confirmer par l’EDD ou les plans." },
  80: { value: 1600000 },
  84: { value: 3000000 },
};
const natureOverrides: Record<number, string> = {
  35: "Parking",
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
  const displayedNature = natureOverrides[lot.lot] ?? lot.nature;
  const category = categoryForNature(displayedNature);
  const isOfficePackage = officePackageLots.has(lot.lot);
  const valuationOverride = valuationOverrides[lot.lot];
  const cleanedComment = lot.commentaires?.replace(obsoleteOwnershipNote, "").trim() || null;
  const packageComment = isOfficePackage
    ? lot.nature === "Parking" ? "Parking rattaché à l’ensemble de bureaux acquis." : "Lot principal de l’ensemble de bureaux acquis."
    : null;
  return {
    ...lot,
    nature: displayedNature,
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

type OutreachStage = "to-send" | "sent" | "replied" | "no-response" | "acquired";
type OutreachRecord = { stage: OutreachStage; sentAt?: string; note?: string };
type OutreachBook = Record<string, OutreachRecord>;
const outreachStorageKey = "villiers-98-operational-follow-up-v1";
const outreachStages: Array<{ value: OutreachStage; label: string }> = [
  { value: "to-send", label: "À envoyer" },
  { value: "sent", label: "Envoyée" },
  { value: "replied", label: "Réponse reçue" },
  { value: "no-response", label: "Sans réponse" },
  { value: "acquired", label: "Acquisition faite" },
];
const outreachStageLabel = (stage: OutreachStage) => outreachStages.find((item) => item.value === stage)?.label ?? "À envoyer";
const localDate = () => new Date().toLocaleDateString("en-CA");

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

export default function Home({ privateAddressData, onLock }: HomeProps = {}) {
  const [privateAddresses, setPrivateAddresses] = useState<Record<string, PrivateAddressEntry>>(privateAddressData ?? {});
  const [privateAddressStatus, setPrivateAddressStatus] = useState<"loading" | "loaded" | "error">(privateAddressData ? "loaded" : "loading");
  const [copiedOwner, setCopiedOwner] = useState<string | null>(null);
  const [revealedAddressOwner, setRevealedAddressOwner] = useState<string | null>(null);
  const [revealedCorporateOwner, setRevealedCorporateOwner] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"owner" | "floor">("owner");
  const [topView, setTopView] = useState<"owners" | "operations">("owners");
  const [outreach, setOutreach] = useState<OutreachBook>({});
  const [outreachReady, setOutreachReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(outreachStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as OutreachBook;
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) setOutreach(parsed);
      }
    } catch {
      // Le suivi reste utilisable même si le navigateur refuse le stockage local.
    } finally {
      setOutreachReady(true);
    }
  }, []);

  useEffect(() => {
    if (!outreachReady) return;
    try {
      window.localStorage.setItem(outreachStorageKey, JSON.stringify(outreach));
    } catch {
      // Le navigateur peut bloquer l'écriture en navigation privée stricte.
    }
  }, [outreach, outreachReady]);

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

  const floorGroups = useMemo(() => {
    const grouped = new Map<string, MasterLot[]>();
    prospectLots.forEach((lot) => {
      const floor = lot.etage ?? "Niveau à confirmer";
      const current = grouped.get(floor) ?? [];
      current.push(lot);
      grouped.set(floor, current);
    });

    return Array.from(grouped.entries())
      .map(([floor, floorLots]) => ({
        floor,
        lots: [...floorLots].sort((a, b) => a.lot - b.lot),
        value: floorLots.reduce((sum, lot) => sum + (lot.valeurEstimee ?? 0), 0),
      }))
      .sort((a, b) => floorRank(b.floor) - floorRank(a.floor));
  }, []);

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

  const trackedOwners = ownerGroups.filter((group) => group.ownerName !== "À identifier");
  const outreachFor = (ownerName: string): OutreachRecord => {
    const record = outreach[ownerName];
    return record && outreachStages.some((item) => item.value === record.stage) ? record : { stage: "to-send" };
  };
  const updateOutreach = (ownerName: string, update: Partial<OutreachRecord>) => {
    setOutreach((current) => {
      const stored = current[ownerName];
      const record = stored && outreachStages.some((item) => item.value === stored.stage) ? stored : { stage: "to-send" as OutreachStage };
      return { ...current, [ownerName]: { ...record, ...update } };
    });
  };
  const changeOutreachStage = (ownerName: string, stage: OutreachStage) => {
    setOutreach((current) => {
      const stored = current[ownerName];
      const record = stored && outreachStages.some((item) => item.value === stored.stage) ? stored : { stage: "to-send" as OutreachStage };
      return { ...current, [ownerName]: { ...record, stage, sentAt: stage === "sent" && !record.sentAt ? localDate() : record.sentAt } };
    });
  };
  const outreachCounts = outreachStages.reduce<Record<OutreachStage, number>>((counts, item) => {
    counts[item.value] = trackedOwners.filter((group) => outreachFor(group.ownerName).stage === item.value).length;
    return counts;
  }, { "to-send": 0, sent: 0, replied: 0, "no-response": 0, acquired: 0 });

  return (
    <main className="page-shell">
      <header className="simple-header">
        <div className="identity"><span className="identity-mark">98</span><div><strong>🏛️ 98 avenue de Villiers</strong><small>ACQUISITION PROGRESSIVE · PARIS 17</small></div></div>
        <div className="header-meta"><span>🗓️ Mise à jour · 4 août 2026</span><nav className="dashboard-nav" aria-label="Vue principale"><button type="button" className={topView === "owners" ? "active" : ""} aria-pressed={topView === "owners"} onClick={() => setTopView("owners")}>👥 Liste des propriétaires</button><button type="button" className={topView === "operations" ? "active" : ""} aria-pressed={topView === "operations"} onClick={() => setTopView("operations")}>🗂️ Suivi opérationnel</button></nav>{onLock && <button type="button" className="dashboard-lock" onClick={onLock}>💻 Oublier cet appareil</button>}</div>
      </header>

      {topView === "owners" ? <><section className="hero">
        <div className="metrics">
          <article><small>🧩 Lots à acquérir</small><strong>{prospectLots.length}</strong><p>Hors lots déjà maîtrisés</p></article>
          <article><small>👥 Propriétaires à approcher</small><strong>{ownerGroups.length}</strong><p>Les positions déjà détenues sont retirées</p></article>
          <article><small>🧮 Tantièmes contrôlés</small><strong>10 000</strong><p>Rapprochés lot par lot et propriétaire par propriétaire</p></article>
        </div>
        <div className="ownership-progress"><div className="progress-copy"><span>📈 Progression de l’acquisition</span><strong>{pct(ownedShare)} des tantièmes</strong></div><div className="progress-visual" aria-label={`${pct(ownedShare)} des tantièmes déjà maîtrisés`}><div className="progress-track"><i style={{ width: `${ownedShare * 100}%` }} /><b style={{ left: `${ownedShare * 100}%` }}>{pct(ownedShare)}</b></div><div className="progress-scale"><span>0 %</span><span>25 %</span><span>50 %</span><span>75 %</span><span>100 %</span></div></div><div className="progress-finance"><span><b>{money(fundsCommittedToDate)}</b> engagés à date</span><span><b>{money(estimatedRemainingAcquisition)}</b> estimés pour le solde</span></div></div>
      </section>

      <section className="section lots-section">
        <div className="section-title"><div><span className="eyebrow copper">📊 PORTEFEUILLES À ACQUÉRIR</span><h2>Propriétaires à contacter</h2></div><div className="section-actions"><div className="view-switch" role="group" aria-label="Mode d’affichage"><button type="button" className={viewMode === "owner" ? "active" : ""} aria-pressed={viewMode === "owner"} onClick={() => setViewMode("owner")}>👥 Par propriétaire</button><button type="button" className={viewMode === "floor" ? "active" : ""} aria-pressed={viewMode === "floor"} onClick={() => setViewMode("floor")}>🏢 Par étage</button></div></div></div>

        {viewMode === "owner" ? <><div className="portfolio-grid">
          {ownerGroups.filter((group) => group.primaryLotCount > 0).map((group) => <article key={group.ownerName} className="portfolio-card">
            <header><div><span className="portfolio-type">{text(group.type)}</span><h3>👤 {group.ownerName}</h3><div className="owner-badges">{addressReveal(group.ownerName, group.mailboxSeen)}{corporateReveal(group.ownerName, group.corporateProfiles)}</div></div><div className="portfolio-weight"><strong>{pct(group.ownerShare)}</strong><span>{number.format(group.ownerWeight)} tantièmes</span></div></header>
            <div className="primary-categories">{group.primaryCategories.map((category) => <section key={category.name} className={`primary-category ${category.name === "Habitations" ? "habitation" : "bureau"}`}><h4>{categoryEmoji[category.name]} {categoryShortName[category.name]}</h4><div>{category.lots.map((lot) => { const surfaceDetail = surfaceEstimateForLot(lot); const acquisition = acquisitionLabel(lot.dateAcquisition); return <span key={lot.lot} className="primary-lot"><b>Lot {lot.lot}</b><small>{text(lot.etage)}{surfaceDetail ? ` · ${surfaceDetail.documented ? "" : "≈ "}${number.format(surfaceDetail.value)} m²` : ""}</small>{acquisition && <i>📅 {acquisition}</i>}{lot.valeurEstimee && <em>≈ {money(lot.valeurEstimee)}</em>}{lot.valuationNote && <i>{lot.valuationNote}</i>}</span>; })}</div></section>)}</div>
            {group.accessoryLots.length > 0 && <div className="accessory-line">{group.accessoryCategories.map((category) => { const categoryValue = category.lots.reduce((sum, lot) => sum + (lot.valeurEstimee ?? 0), 0); const acquisitions = category.lots.map((lot) => acquisitionLabel(lot.dateAcquisition) ? `L${lot.lot} · ${acquisitionLabel(lot.dateAcquisition)}` : null).filter(Boolean); return <span key={category.name}>{categoryEmoji[category.name]} {category.lots.length} {categoryShortName[category.name].toLocaleLowerCase("fr")} · lots {category.lots.map((lot) => lot.lot).join(", ")}{categoryValue ? ` · ≈ ${money(categoryValue)}` : ""}{acquisitions.length ? ` · 📅 ${acquisitions.join(" · ")}` : ""}</span>; })}</div>}
            <footer><span>{group.estimatedPrimarySurface ? `📐 ${group.estimatedPrimarySurfaceCount ? "≈ " : ""}${number.format(group.estimatedPrimarySurface)} m²${group.documentedPrimarySurfaceCount ? ` · ${group.documentedPrimarySurfaceCount} mesuré${group.documentedPrimarySurfaceCount > 1 ? "s" : ""}` : ""}` : "📐 Surface non reconstituée"}</span><span>{group.value ? `💶 ≈ ${money(group.value)}` : ""}</span></footer>
          </article>)}</div>

        <section className="accessory-section"><div><span className="eyebrow">🅿️ 📦 ANNEXES SEULES</span><h3>Parkings et caves sans logement ni bureau associé</h3><p>Parkings : base de travail ≈ 35 k€ par place, recalibrée sur un loyer observé de 200 à 230 € / mois. À confirmer par dimensions, accès et comparables de vente.</p></div><div className="accessory-owner-list">{ownerGroups.filter((group) => group.primaryLotCount === 0).map((group) => <article key={group.ownerName}><div><strong>👤 {group.ownerName}</strong><small>{text(group.type)} · {number.format(group.ownerWeight)} tantièmes</small><div className="owner-badges">{addressReveal(group.ownerName, group.mailboxSeen)}{corporateReveal(group.ownerName, group.corporateProfiles)}</div></div><p>{group.accessoryCategories.map((category) => { const categoryValue = category.lots.reduce((sum, lot) => sum + (lot.valeurEstimee ?? 0), 0); const acquisitions = category.lots.map((lot) => acquisitionLabel(lot.dateAcquisition) ? `L${lot.lot} · ${acquisitionLabel(lot.dateAcquisition)}` : null).filter(Boolean); return <span key={category.name}>{categoryEmoji[category.name]} {category.lots.length} {categoryShortName[category.name].toLocaleLowerCase("fr")} : {category.lots.map((lot) => lot.lot).join(", ")}{categoryValue ? ` · ≈ ${money(categoryValue)}` : ""}{acquisitions.length ? ` · 📅 ${acquisitions.join(" · ")}` : ""}</span>; })}</p></article>)}</div></section></> : <div className="floor-grid">{floorGroups.map((group) => <article key={group.floor} className="floor-card"><header><div><span className="floor-kicker">🏢 NIVEAU</span><h3>{group.floor}</h3></div><strong>{group.lots.length} lot{group.lots.length > 1 ? "s" : ""} · ≈ {money(group.value)}</strong></header><div className="floor-lots">{group.lots.map((lot) => { const surfaceDetail = surfaceEstimateForLot(lot); const ownerName = lot.proprietaire ? commonControlPortfolios[lot.proprietaire]?.name ?? lot.proprietaire : "À identifier"; const isResident = lot.proprietaire ? ownersSeenOnMailbox.has(ownerName) : null; const profiles = lot.proprietaire ? corporateProfiles[ownerName] ?? null : null; return <article key={lot.lot} className="floor-lot"><span>{categoryEmoji[lot.categorie]} {categoryShortName[lot.categorie]}</span><b>Lot {lot.lot}</b><strong>{ownerName}</strong>{isResident !== null && <div className="owner-badges floor-owner-badges"><i className={isResident ? "resident" : "non-resident"}>📍 {isResident ? "Résident" : "Non-résident"}</i>{corporateReveal(`floor-${lot.lot}`, profiles)}</div>}{surfaceDetail && <small>{surfaceDetail.documented ? "" : "≈ "}{number.format(surfaceDetail.value)} m²</small>}{lot.valeurEstimee && <em>≈ {money(lot.valeurEstimee)}</em>}</article>; })}</div></article>)}</div>}
      </section></> : <section className="section operations-section">
        <div className="section-title"><div><span className="eyebrow copper">🗂️ PILOTAGE DES APPROCHES</span><h2>Suivi opérationnel</h2></div><p className="operations-save">Enregistré uniquement sur cet appareil</p></div>
        <div className="operations-summary">
          <article><small>À envoyer</small><strong>{outreachCounts["to-send"]}</strong></article>
          <article><small>Envoyées</small><strong>{outreachCounts.sent}</strong></article>
          <article><small>Réponses</small><strong>{outreachCounts.replied}</strong></article>
          <article><small>Acquisitions</small><strong>{outreachCounts.acquired}</strong></article>
        </div>
        <div className="operations-list">
          {trackedOwners.map((group) => {
            const record = outreachFor(group.ownerName);
            return <article key={group.ownerName} className={`operation-card stage-${record.stage}`}>
              <header><div><span>{group.mailboxSeen ? "📍 Résident" : "📍 Non-résident"}</span><h3>👤 {group.ownerName}</h3><small>Lots {group.lots.map((lot) => lot.lot).join(", ")} · {number.format(group.ownerWeight)} tantièmes</small></div><strong>{outreachStageLabel(record.stage)}</strong></header>
              <div className="operation-controls">
                <label>Statut<select value={record.stage} onChange={(event) => changeOutreachStage(group.ownerName, event.target.value as OutreachStage)}>{outreachStages.map((stage) => <option key={stage.value} value={stage.value}>{stage.label}</option>)}</select></label>
                <label>Date d’envoi<input type="date" value={record.sentAt ?? ""} onChange={(event) => updateOutreach(group.ownerName, { sentAt: event.target.value || undefined })} /></label>
              </div>
              <label className="operation-note">Note<textarea value={record.note ?? ""} placeholder="Ex. courrier déposé, réponse reçue, rappel à prévoir…" onChange={(event) => updateOutreach(group.ownerName, { note: event.target.value })} /></label>
            </article>;
          })}
        </div>
      </section>}
    </main>
  );
}

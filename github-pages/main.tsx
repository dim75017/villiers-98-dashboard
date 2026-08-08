/// <reference types="vite/client" />

import { StrictMode, useEffect, useState, type FormEvent } from "react";
import { createRoot } from "react-dom/client";
import Home, { type PrivateAddressEntry, type PrivateOutreachEntry } from "../app/page";
import ThemeToggle from "../app/theme-toggle";
import "../app/globals.css";

type EncryptedPayload = {
  version?: unknown;
  kdf?: {
    name?: unknown;
    hash?: unknown;
    iterations?: unknown;
    salt?: unknown;
  };
  cipher?: {
    name?: unknown;
    iv?: unknown;
    data?: unknown;
  };
};

type DecryptedPayload = {
  version?: unknown;
  owners?: unknown;
  outreach?: unknown;
};

type PrivateDashboardData = {
  addresses: Record<string, PrivateAddressEntry>;
  outreach: Record<string, PrivateOutreachEntry>;
};

type ValidatedArchive = {
  salt: Uint8Array<ArrayBuffer>;
  saltEncoded: string;
  iv: Uint8Array<ArrayBuffer>;
  ciphertext: Uint8Array<ArrayBuffer>;
};

type TrustedDeviceRecord = {
  id: string;
  version: 1;
  archiveVersion: 2;
  iterations: number;
  salt: string;
  key: CryptoKey;
  trustedAt: string;
};

const CONTEXT = "villiers-98-private-addresses-v2";
const ITERATIONS = 600_000;
const TRUSTED_DEVICE_DB = "villiers-98-trusted-device-v1";
const TRUSTED_DEVICE_STORE = "credentials";
const TRUSTED_DEVICE_ID = "dashboard-key";

const decodeBase64 = (value: string): Uint8Array<ArrayBuffer> => {
  const decoded = atob(value);
  const bytes = new Uint8Array(decoded.length);
  for (let index = 0; index < decoded.length; index += 1) bytes[index] = decoded.charCodeAt(index);
  return bytes;
};

const fetchArchive = async (): Promise<ValidatedArchive> => {
  const response = await fetch(`${import.meta.env.BASE_URL}villiers-private.enc.json`, { cache: "no-store" });
  if (!response.ok) throw new Error("archive");
  const archiveText = await response.text();
  if (archiveText.length > 200_000) throw new Error("archive");
  const encrypted = JSON.parse(archiveText) as EncryptedPayload;
  if (
    encrypted.version !== 2 ||
    encrypted.kdf?.name !== "PBKDF2" ||
    encrypted.kdf.hash !== "SHA-256" ||
    encrypted.kdf.iterations !== ITERATIONS ||
    typeof encrypted.kdf.salt !== "string" ||
    encrypted.cipher?.name !== "AES-GCM" ||
    typeof encrypted.cipher.iv !== "string" ||
    typeof encrypted.cipher.data !== "string"
  ) throw new Error("archive");

  const salt = decodeBase64(encrypted.kdf.salt);
  const iv = decodeBase64(encrypted.cipher.iv);
  const ciphertext = decodeBase64(encrypted.cipher.data);
  if (salt.length !== 16 || iv.length !== 12 || ciphertext.length < 17 || ciphertext.length > 150_000) throw new Error("archive");

  return { salt, saltEncoded: encrypted.kdf.salt, iv, ciphertext };
};

const deriveArchiveKey = async (password: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      iterations: ITERATIONS,
      salt,
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
};

const decryptArchive = async (archive: ValidatedArchive, key: CryptoKey): Promise<PrivateDashboardData> => {
  const encoder = new TextEncoder();
  const plaintext = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: archive.iv,
      additionalData: encoder.encode(CONTEXT),
      tagLength: 128,
    },
    key,
    archive.ciphertext,
  );
  const decrypted = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(plaintext)) as DecryptedPayload;
  if (decrypted.version !== 2 || !decrypted.owners || typeof decrypted.owners !== "object" || Array.isArray(decrypted.owners) || !decrypted.outreach || typeof decrypted.outreach !== "object" || Array.isArray(decrypted.outreach)) throw new Error("archive");
  const addressEntries = Object.entries(decrypted.owners);
  if (addressEntries.length !== 29) throw new Error("archive");

  const normalized: Record<string, PrivateAddressEntry> = Object.create(null);
  for (const [ownerKey, rawEntry] of addressEntries) {
    if (!ownerKey || ownerKey.length > 200 || ownerKey === "__proto__" || ownerKey === "constructor" || !rawEntry || typeof rawEntry !== "object" || Array.isArray(rawEntry)) throw new Error("archive");
    const { address, source, status, letterReady } = rawEntry as Record<string, unknown>;
    if ((address !== null && typeof address !== "string") || (source !== null && typeof source !== "string") || (status !== null && typeof status !== "string") || typeof letterReady !== "boolean") throw new Error("archive");
    const cleanAddress = typeof address === "string" ? address.trim() || null : null;
    const cleanSource = typeof source === "string" ? source.trim() || null : null;
    const cleanStatus = typeof status === "string" ? status.trim() || null : null;
    if ((cleanAddress?.length ?? 0) > 300 || (cleanSource?.length ?? 0) > 200 || (cleanStatus?.length ?? 0) > 200 || letterReady !== Boolean(cleanAddress)) throw new Error("archive");
    normalized[ownerKey] = { address: cleanAddress, source: cleanSource, status: cleanStatus, letterReady };
  }
  const outreachEntries = Object.entries(decrypted.outreach);
  if (outreachEntries.length !== 41) throw new Error("archive");
  const outreach: Record<string, PrivateOutreachEntry> = Object.create(null);
  for (const [ownerKey, rawEntry] of outreachEntries) {
    if (!ownerKey || ownerKey.length > 200 || ownerKey === "__proto__" || ownerKey === "constructor" || !rawEntry || typeof rawEntry !== "object" || Array.isArray(rawEntry)) throw new Error("archive");
    const { stage, sentAt, updatedAt, lotIds, sourceKind, confidence } = rawEntry as Record<string, unknown>;
    if (stage !== "to-send" && stage !== "sent" && stage !== "replied" && stage !== "declined" && stage !== "no-response" && stage !== "in-progress" && stage !== "acquired") throw new Error("archive");
    if (sentAt !== null && typeof sentAt !== "string") throw new Error("archive");
    const cleanSentAt = typeof sentAt === "string" ? sentAt.trim() || null : null;
    if ((cleanSentAt?.length ?? 0) > 20 || (cleanSentAt !== null && !/^\d{4}-\d{2}-\d{2}$/.test(cleanSentAt))) throw new Error("archive");
    if (updatedAt !== undefined && updatedAt !== null && (typeof updatedAt !== "string" || updatedAt.length > 64 || !Number.isFinite(Date.parse(updatedAt)))) throw new Error("archive");
    if (lotIds !== undefined && (!Array.isArray(lotIds) || lotIds.length > 20 || lotIds.some((lotId) => !Number.isInteger(lotId) || Number(lotId) < 1 || Number(lotId) > 999))) throw new Error("archive");
    if (sourceKind !== undefined && sourceKind !== null && (typeof sourceKind !== "string" || sourceKind.length > 40)) throw new Error("archive");
    if (confidence !== undefined && confidence !== null && confidence !== "confirmed" && confidence !== "strong" && confidence !== "weak") throw new Error("archive");
    outreach[ownerKey] = {
      stage,
      sentAt: cleanSentAt,
      updatedAt: typeof updatedAt === "string" ? updatedAt : null,
      lotIds: Array.isArray(lotIds) ? lotIds as number[] : undefined,
      sourceKind: typeof sourceKind === "string" ? sourceKind : null,
      confidence: typeof confidence === "string" ? confidence : null,
    };
  }
  return { addresses: normalized, outreach };
};

const openTrustedDeviceDatabase = () => new Promise<IDBDatabase>((resolve, reject) => {
  if (!globalThis.indexedDB) {
    reject(new Error("trusted-device"));
    return;
  }
  const request = indexedDB.open(TRUSTED_DEVICE_DB, 1);
  request.onupgradeneeded = () => {
    const database = request.result;
    if (!database.objectStoreNames.contains(TRUSTED_DEVICE_STORE)) {
      database.createObjectStore(TRUSTED_DEVICE_STORE, { keyPath: "id" });
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error ?? new Error("trusted-device"));
  request.onblocked = () => reject(new Error("trusted-device"));
});

const readTrustedDevice = async (): Promise<TrustedDeviceRecord | null> => {
  const database = await openTrustedDeviceDatabase();
  try {
    return await new Promise<TrustedDeviceRecord | null>((resolve, reject) => {
      const transaction = database.transaction(TRUSTED_DEVICE_STORE, "readonly");
      const request = transaction.objectStore(TRUSTED_DEVICE_STORE).get(TRUSTED_DEVICE_ID);
      request.onsuccess = () => resolve((request.result as TrustedDeviceRecord | undefined) ?? null);
      request.onerror = () => reject(request.error ?? new Error("trusted-device"));
      transaction.onabort = () => reject(transaction.error ?? new Error("trusted-device"));
    });
  } finally {
    database.close();
  }
};

const rememberTrustedDevice = async (archive: ValidatedArchive, key: CryptoKey) => {
  const database = await openTrustedDeviceDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(TRUSTED_DEVICE_STORE, "readwrite");
      transaction.objectStore(TRUSTED_DEVICE_STORE).put({
        id: TRUSTED_DEVICE_ID,
        version: 1,
        archiveVersion: 2,
        iterations: ITERATIONS,
        salt: archive.saltEncoded,
        key,
        trustedAt: new Date().toISOString(),
      } satisfies TrustedDeviceRecord);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("trusted-device"));
      transaction.onabort = () => reject(transaction.error ?? new Error("trusted-device"));
    });
  } finally {
    database.close();
  }
};

const forgetTrustedDevice = async () => {
  const database = await openTrustedDeviceDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(TRUSTED_DEVICE_STORE, "readwrite");
      transaction.objectStore(TRUSTED_DEVICE_STORE).delete(TRUSTED_DEVICE_ID);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("trusted-device"));
      transaction.onabort = () => reject(transaction.error ?? new Error("trusted-device"));
    });
  } finally {
    database.close();
  }
};

const isUsableTrustedDevice = (record: TrustedDeviceRecord | null, archive: ValidatedArchive): record is TrustedDeviceRecord => Boolean(
  record &&
  record.version === 1 &&
  record.archiveVersion === 2 &&
  record.iterations === ITERATIONS &&
  record.salt === archive.saltEncoded &&
  record.key &&
  record.key.type === "secret" &&
  record.key.extractable === false &&
  record.key.algorithm.name === "AES-GCM" &&
  record.key.usages.includes("decrypt"),
);

function ProtectedDashboard() {
  const [password, setPassword] = useState("");
  const [privateDashboardData, setPrivateDashboardData] = useState<PrivateDashboardData | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const restoreTrustedDevice = async () => {
      try {
        const record = await readTrustedDevice();
        if (!record) return;
        const archive = await fetchArchive();
        if (!isUsableTrustedDevice(record, archive)) {
          await forgetTrustedDevice();
          return;
        }
        try {
          const dashboardData = await decryptArchive(archive, record.key);
          if (active) setPrivateDashboardData(dashboardData);
        } catch {
          await forgetTrustedDevice();
        }
      } catch {
        // IndexedDB can be unavailable in hardened/private browser modes.
      } finally {
        if (active) setIsRestoring(false);
      }
    };
    void restoreTrustedDevice();
    return () => { active = false; };
  }, []);

  const unlock = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!password || isLoading) return;
    setIsLoading(true);
    setError("");
    let dashboardData: PrivateDashboardData;
    let archive: ValidatedArchive;
    let key: CryptoKey;
    try {
      archive = await fetchArchive();
      key = await deriveArchiveKey(password, archive.salt);
      dashboardData = await decryptArchive(archive, key);
    } catch {
      setError("Mot de passe incorrect.");
      setIsLoading(false);
      return;
    }
    try {
      await rememberTrustedDevice(archive, key);
      void navigator.storage?.persist?.().catch(() => undefined);
      setPrivateDashboardData(dashboardData);
      setPassword("");
    } catch {
      setError("Mot de passe correct, mais ce navigateur bloque la mémorisation de l’appareil. Autorisez le stockage du site puis réessayez.");
    } finally {
      setIsLoading(false);
    }
  };

  const forgetDevice = async () => {
    try {
      await forgetTrustedDevice();
      setPrivateDashboardData(null);
      setPassword("");
      setError("");
      window.scrollTo({ top: 0, behavior: "instant" });
    } catch {
      window.alert("Impossible d’oublier cet appareil pour le moment. Les données de confiance n’ont pas été supprimées.");
    }
  };

  if (privateDashboardData) return <Home privateAddressData={privateDashboardData.addresses} privateOutreachData={privateDashboardData.outreach} onLock={forgetDevice} />;

  if (isRestoring) return <><div className="unlock-theme-switch"><ThemeToggle /></div><main className="unlock-page">
      <section className="unlock-card" aria-live="polite">
        <div className="unlock-mark">98</div>
        <small>💻 Appareil de confiance</small>
        <h1>98 avenue de Villiers</h1>
        <p>Reconnaissance de cet appareil…</p>
      </section>
    </main></>;

  return <><div className="unlock-theme-switch"><ThemeToggle /></div><main className="unlock-page">
      <section className="unlock-card" aria-labelledby="private-title">
        <div className="unlock-mark">98</div>
        <small>🔒 Accès privé</small>
        <h1 id="private-title">98 avenue de Villiers</h1>
        <p>Le tableau d’acquisition et les adresses de correspondance sont protégés.</p>
        <form className="unlock-form" onSubmit={unlock}>
          <label htmlFor="dashboard-password">Mot de passe</label>
          <input id="dashboard-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" autoFocus minLength={8} required />
          <button type="submit" disabled={isLoading}>{isLoading ? "Déverrouillage…" : "Ouvrir le dashboard"}</button>
        </form>
        <p className="unlock-error" role="alert" aria-live="polite">{error}</p>
        <p className="unlock-footnote">Après cette première ouverture, ce navigateur sera reconnu sans limite de durée. Le mot de passe n’est jamais enregistré en clair.</p>
      </section>
    </main></>;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ProtectedDashboard />
  </StrictMode>,
);

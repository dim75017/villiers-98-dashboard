import { StrictMode, useState, type FormEvent } from "react";
import { createRoot } from "react-dom/client";
import Home, { type PrivateAddressEntry } from "../app/page";
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
};

const CONTEXT = "villiers-98-private-addresses-v2";
const ITERATIONS = 600_000;

const decodeBase64 = (value: string) => Uint8Array.from(atob(value), (character) => character.charCodeAt(0));

const decryptAddresses = async (password: string): Promise<Record<string, PrivateAddressEntry>> => {
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

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey(
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
  const plaintext = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: encoder.encode(CONTEXT),
      tagLength: 128,
    },
    key,
    ciphertext,
  );
  const decrypted = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(plaintext)) as DecryptedPayload;
  if (decrypted.version !== 2 || !decrypted.owners || typeof decrypted.owners !== "object" || Array.isArray(decrypted.owners)) throw new Error("archive");
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
  return normalized;
};

function ProtectedDashboard() {
  const [password, setPassword] = useState("");
  const [privateAddresses, setPrivateAddresses] = useState<Record<string, PrivateAddressEntry> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const unlock = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!password || isLoading) return;
    setIsLoading(true);
    setError("");
    try {
      const addresses = await decryptAddresses(password);
      setPrivateAddresses(addresses);
      setPassword("");
    } catch {
      setError("Mot de passe incorrect.");
    } finally {
      setIsLoading(false);
    }
  };

  const lock = () => {
    setPrivateAddresses(null);
    setPassword("");
    setError("");
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  if (privateAddresses) return <Home privateAddressData={privateAddresses} onLock={lock} />;

  return <main className="unlock-page">
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
      <p className="unlock-footnote">Les adresses restent chiffrées tant que le mot de passe n’est pas saisi.</p>
    </section>
  </main>;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ProtectedDashboard />
  </StrictMode>,
);

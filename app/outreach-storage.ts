export type PersistedOutreachRecord = {
  stage: string;
  sentAt?: string;
  note?: string;
  updatedAt?: string;
};

export type PersistedOutreachBook = Record<string, PersistedOutreachRecord>;

const databaseName = "villiers-98-operational-follow-up-idb-v1";
const storeName = "state";
const recordId = "outreach-book";
const maximumSerializedLength = 2_000_000;

type StoredOutreachBook = {
  id: typeof recordId;
  version: 1;
  serialized: string;
  savedAt: string;
};

const recordTimestamp = (record: PersistedOutreachRecord | undefined) => {
  const timestamp = record?.updatedAt ? Date.parse(record.updatedAt) : Number.NaN;
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const mergeRecord = (preferred: PersistedOutreachRecord, alternate: PersistedOutreachRecord): PersistedOutreachRecord => {
  const alternateIsNewer = recordTimestamp(alternate) > recordTimestamp(preferred);
  const newer = alternateIsNewer ? alternate : preferred;
  const older = alternateIsNewer ? preferred : alternate;
  return {
    ...older,
    ...newer,
    sentAt: newer.sentAt !== undefined ? newer.sentAt : older.sentAt,
    note: newer.note !== undefined ? newer.note : older.note,
    updatedAt: newer.updatedAt ?? older.updatedAt,
  };
};

// `preferred` wins timestamp ties, while missing optional fields are recovered from
// the alternate copy. This preserves legacy notes that predate updatedAt timestamps.
export const mergeOutreachBooks = <T extends PersistedOutreachBook>(preferred: T, alternate: T): T => {
  const merged: PersistedOutreachBook = {};
  const ownerNames = new Set([...Object.keys(alternate), ...Object.keys(preferred)]);
  ownerNames.forEach((ownerName) => {
    const preferredRecord = preferred[ownerName];
    const alternateRecord = alternate[ownerName];
    if (preferredRecord && alternateRecord) merged[ownerName] = mergeRecord(preferredRecord, alternateRecord);
    else if (preferredRecord) merged[ownerName] = { ...preferredRecord };
    else if (alternateRecord) merged[ownerName] = { ...alternateRecord };
  });
  return merged as T;
};

let databasePromise: Promise<IDBDatabase> | null = null;
let writeQueue: Promise<void> = Promise.resolve();

const openDatabase = () => {
  if (!globalThis.indexedDB) return Promise.reject(new Error("indexeddb-unavailable"));
  if (databasePromise) return databasePromise;
  databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(storeName)) database.createObjectStore(storeName, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("indexeddb-open"));
    request.onblocked = () => reject(new Error("indexeddb-blocked"));
  }).catch((error) => {
    databasePromise = null;
    throw error;
  });
  return databasePromise;
};

export const readOutreachBookFromIndexedDb = async (): Promise<string | null> => {
  const database = await openDatabase();
  return new Promise<string | null>((resolve, reject) => {
    const transaction = database.transaction(storeName, "readonly");
    const request = transaction.objectStore(storeName).get(recordId);
    request.onsuccess = () => {
      const value = request.result as StoredOutreachBook | undefined;
      if (!value) {
        resolve(null);
        return;
      }
      if (value.id !== recordId || value.version !== 1 || typeof value.serialized !== "string" || value.serialized.length > maximumSerializedLength) {
        reject(new Error("indexeddb-record"));
        return;
      }
      resolve(value.serialized);
    };
    request.onerror = () => reject(request.error ?? new Error("indexeddb-read"));
    transaction.onabort = () => reject(transaction.error ?? new Error("indexeddb-read-abort"));
  });
};

const writeOutreachBookTransaction = async (serialized: string) => {
  if (serialized.length > maximumSerializedLength) throw new Error("indexeddb-record-too-large");
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).put({ id: recordId, version: 1, serialized, savedAt: new Date().toISOString() } satisfies StoredOutreachBook);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("indexeddb-write"));
    transaction.onabort = () => reject(transaction.error ?? new Error("indexeddb-write-abort"));
  });
};

export const writeOutreachBookToIndexedDb = (serialized: string) => {
  writeQueue = writeQueue.catch(() => undefined).then(() => writeOutreachBookTransaction(serialized));
  return writeQueue;
};

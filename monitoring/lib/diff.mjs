import { createHash } from "node:crypto";

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, stableValue(child)]),
    );
  }
  return value ?? null;
}

export function stableStringify(value) {
  return JSON.stringify(stableValue(value));
}

export function getPath(value, path) {
  return path.split(".").reduce((current, key) => current?.[key], value);
}

export function selectPaths(value, paths) {
  return Object.fromEntries(paths.map((path) => [path, getPath(value, path) ?? null]));
}

export function fingerprint(value, paths) {
  return createHash("sha256").update(stableStringify(selectPaths(value, paths))).digest("hex");
}

export function changedFields(previous, current, paths) {
  return paths.flatMap((path) => {
    const before = getPath(previous, path) ?? null;
    const after = getPath(current, path) ?? null;
    return stableStringify(before) === stableStringify(after) ? [] : [{ field: path, before, after }];
  });
}

export function reconcileRecords({
  previousRecords = {},
  currentRecords,
  keyOf,
  fingerprintPaths,
  observedAt,
  suppressAlerts = false,
}) {
  const nextRecords = { ...previousRecords };
  const events = [];
  const deduped = new Map();

  for (const record of currentRecords) {
    const key = String(keyOf(record) ?? "").trim();
    if (!key) throw new Error("Une source a retourné un enregistrement sans identifiant stable.");
    deduped.set(key, record);
  }

  for (const [key, record] of deduped) {
    const previous = previousRecords[key];
    const recordFingerprint = fingerprint(record, fingerprintPaths);
    const envelope = {
      value: record,
      fingerprint: recordFingerprint,
      firstSeenAt: previous?.firstSeenAt ?? observedAt,
      lastSeenAt: observedAt,
    };

    if (!suppressAlerts && !previous) {
      events.push({ kind: "new", key, value: record, changes: [] });
    } else if (!suppressAlerts && previous && previous.fingerprint !== recordFingerprint) {
      events.push({
        kind: "modified",
        key,
        value: record,
        changes: changedFields(previous.value, record, fingerprintPaths),
      });
    }

    nextRecords[key] = envelope;
  }

  return { records: nextRecords, events, observedCount: deduped.size };
}

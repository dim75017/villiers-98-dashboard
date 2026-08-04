#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { fetchAdemeDpe, DPE_FINGERPRINT_PATHS } from "./lib/ademe.mjs";
import { fetchRneCompanies, RNE_FINGERPRINT_PATHS } from "./lib/rne.mjs";
import { loadAnnouncementCandidates, ANNOUNCEMENT_FINGERPRINT_PATHS } from "./lib/announcements.mjs";
import { reconcileRecords } from "./lib/diff.mjs";
import { appendNdjson, ensurePrivateStateDir, readJsonIfExists, writeJsonAtomic } from "./lib/io.mjs";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

function parseArguments(argv) {
  const args = { baseline: false, dryRun: false, json: false, only: null, config: null };
  for (const token of argv) {
    if (token === "--baseline") args.baseline = true;
    else if (token === "--dry-run") args.dryRun = true;
    else if (token === "--json") args.json = true;
    else if (token.startsWith("--only=")) args.only = new Set(token.slice(7).split(",").filter(Boolean));
    else if (token.startsWith("--config=")) args.config = token.slice(9);
    else throw new Error(`Option inconnue : ${token}`);
  }
  return args;
}

function sourceEnabled(args, name, configSection) {
  return configSection?.enabled !== false && (!args.only || args.only.has(name));
}

function summaryForEvent(source, event) {
  if (source === "ademe") {
    const dpe = event.value;
    return `${event.kind === "new" ? "Nouveau" : "DPE modifié"} ${dpe.numeroDpe} · ${dpe.etiquetteDpe ?? "?"}/${dpe.etiquetteGes ?? "?"} · ${dpe.surfaceLogementM2 ?? "?"} m²`;
  }
  if (source === "rne") {
    return `${event.kind === "new" ? "Société ajoutée" : "RNE modifié"} · ${event.value.label} · SIREN ${event.value.siren}`;
  }
  return `${event.kind === "new" ? "Nouvelle annonce" : "Annonce modifiée"} · ${event.value.title}`;
}

function decorateEvents(source, events, runId, observedAt) {
  return events.map((event) => ({
    runId,
    observedAt,
    source,
    kind: event.kind,
    key: event.key,
    summary: summaryForEvent(source, event),
    changes: event.changes,
    value: event.value,
  }));
}

async function main() {
  const args = parseArguments(process.argv.slice(2));
  const configPath = path.resolve(args.config ?? path.join(moduleDir, "config.json"));
  const configDir = path.dirname(configPath);
  const config = await readJsonIfExists(configPath);
  if (!config) throw new Error(`Configuration introuvable : ${configPath}`);

  const stateDir = await ensurePrivateStateDir(configDir, config.privacy?.stateDir);
  const statePath = path.join(stateDir, config.privacy?.stateFile ?? "state.json");
  const previousState = await readJsonIfExists(statePath);
  const observedAt = new Date().toISOString();
  const runId = randomUUID();
  const firstRun = !previousState;
  const suppressAlerts = firstRun || args.baseline;
  const state = previousState ?? {
    version: 1,
    property: config.property.label,
    createdAt: observedAt,
    updatedAt: observedAt,
    sources: {},
  };
  const alerts = [];
  const errors = [];
  const sourceSummary = {};

  if (sourceEnabled(args, "ademe", config.ademe)) {
    try {
      const current = await fetchAdemeDpe(config.ademe, config.property);
      const reconciled = reconcileRecords({
        previousRecords: state.sources.ademe?.records,
        currentRecords: current,
        keyOf: (record) => record.id,
        fingerprintPaths: DPE_FINGERPRINT_PATHS,
        observedAt,
        suppressAlerts,
      });
      state.sources.ademe = { records: reconciled.records, lastSuccessAt: observedAt };
      alerts.push(...decorateEvents("ademe", reconciled.events, runId, observedAt));
      sourceSummary.ademe = { observed: reconciled.observedCount, alerts: reconciled.events.length };
    } catch (error) {
      errors.push({ source: "ademe", error: error instanceof Error ? error.message : String(error) });
    }
  }

  if (sourceEnabled(args, "rne", config.rne)) {
    try {
      const fetched = await fetchRneCompanies(config.rne);
      const reconciled = reconcileRecords({
        previousRecords: state.sources.rne?.records,
        currentRecords: fetched.records,
        keyOf: (record) => record.id,
        fingerprintPaths: RNE_FINGERPRINT_PATHS,
        observedAt,
        suppressAlerts,
      });
      state.sources.rne = { records: reconciled.records, lastSuccessAt: observedAt };
      alerts.push(...decorateEvents("rne", reconciled.events, runId, observedAt));
      sourceSummary.rne = {
        observed: reconciled.observedCount,
        alerts: reconciled.events.length,
        unresolved: config.rne.unresolvedCompanies?.length ?? 0,
        queryErrors: fetched.errors,
      };
      for (const queryError of fetched.errors) errors.push({ source: "rne", ...queryError });
    } catch (error) {
      errors.push({ source: "rne", error: error instanceof Error ? error.message : String(error) });
    }
  }

  if (sourceEnabled(args, "announcements", config.announcements)) {
    try {
      const candidatesPath = path.resolve(configDir, config.announcements.candidatesFile);
      const current = await loadAnnouncementCandidates(candidatesPath);
      const reconciled = reconcileRecords({
        previousRecords: state.sources.announcements?.records,
        currentRecords: current,
        keyOf: (record) => record.id,
        fingerprintPaths: ANNOUNCEMENT_FINGERPRINT_PATHS,
        observedAt,
        suppressAlerts,
      });
      state.sources.announcements = { records: reconciled.records, lastSuccessAt: observedAt };
      alerts.push(...decorateEvents("announcements", reconciled.events, runId, observedAt));
      sourceSummary.announcements = { observed: reconciled.observedCount, alerts: reconciled.events.length };
    } catch (error) {
      errors.push({ source: "announcements", error: error instanceof Error ? error.message : String(error) });
    }
  }

  state.updatedAt = observedAt;
  const report = {
    runId,
    observedAt,
    baseline: suppressAlerts,
    dryRun: args.dryRun,
    sources: sourceSummary,
    alertCount: alerts.length,
    alerts,
    errors,
  };

  if (!args.dryRun) {
    await writeJsonAtomic(statePath, state);
    await appendNdjson(path.join(stateDir, config.privacy?.journalFile ?? "journal.ndjson"), [{
      runId,
      observedAt,
      baseline: suppressAlerts,
      sources: sourceSummary,
      alertCount: alerts.length,
      errorCount: errors.length,
    }]);
    await appendNdjson(path.join(stateDir, config.privacy?.alertsFile ?? "alerts.ndjson"), alerts);
    await writeJsonAtomic(path.join(stateDir, config.privacy?.latestReportFile ?? "latest-report.json"), report);
  }

  if (args.json) console.log(JSON.stringify(report));
  else {
    console.log(`98 Villiers · ${observedAt}`);
    console.log(`Baseline : ${suppressAlerts ? "oui" : "non"} · alertes : ${alerts.length} · erreurs : ${errors.length}`);
    for (const [source, summary] of Object.entries(sourceSummary)) {
      console.log(`${source} : ${summary.observed ?? 0} observé(s), ${summary.alerts ?? 0} alerte(s)`);
    }
    for (const alert of alerts) console.log(`ALERTE · ${alert.summary}`);
    for (const error of errors) console.error(`ERREUR · ${error.source} · ${error.error}`);
  }

  if (errors.length) process.exitCode = 2;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});

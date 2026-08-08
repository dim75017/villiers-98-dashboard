import assert from "node:assert/strict";
import test from "node:test";
import { mergeOutreachBooks } from "../app/outreach-storage.ts";

test("keeps the newer status and recovers a note missing from that copy", () => {
  const merged = mergeOutreachBooks(
    { Owner: { stage: "replied", updatedAt: "2026-08-08T12:00:00Z" } },
    { Owner: { stage: "sent", note: "Note locale", updatedAt: "2026-08-07T12:00:00Z" } },
  );
  assert.deepEqual(merged.Owner, { stage: "replied", note: "Note locale", updatedAt: "2026-08-08T12:00:00Z", sentAt: undefined });
});

test("lets a newer IndexedDB record replace an older localStorage status", () => {
  const merged = mergeOutreachBooks(
    { Owner: { stage: "sent", sentAt: "2026-08-05", updatedAt: "2026-08-07T12:00:00Z" } },
    { Owner: { stage: "declined", note: "À revoir plus tard", updatedAt: "2026-08-08T12:00:00Z" } },
  );
  assert.deepEqual(merged.Owner, {
    stage: "declined",
    sentAt: "2026-08-05",
    note: "À revoir plus tard",
    updatedAt: "2026-08-08T12:00:00Z",
  });
});

test("prefers localStorage on a timestamp tie without dropping the alternate note", () => {
  const merged = mergeOutreachBooks(
    { Owner: { stage: "replied", updatedAt: "2026-08-08T12:00:00Z" } },
    { Owner: { stage: "sent", note: "Note de secours", updatedAt: "2026-08-08T12:00:00Z" } },
  );
  assert.equal(merged.Owner.stage, "replied");
  assert.equal(merged.Owner.note, "Note de secours");
});

test("respects an explicitly cleared note on the newer record", () => {
  const merged = mergeOutreachBooks(
    { Owner: { stage: "sent", note: "Ancienne note", updatedAt: "2026-08-07T12:00:00Z" } },
    { Owner: { stage: "sent", note: "", updatedAt: "2026-08-08T12:00:00Z" } },
  );
  assert.equal(merged.Owner.note, "");
});

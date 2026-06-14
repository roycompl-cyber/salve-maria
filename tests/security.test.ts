import test from "node:test";
import assert from "node:assert/strict";
import { isPermanentPushFailure, safeInternalUrl, warsawParts } from "../src/lib/security";

test("safeInternalUrl accepts only local application paths", () => {
  assert.equal(safeInternalUrl("/articles/test"), "/articles/test");
  assert.equal(safeInternalUrl("https://evil.example", "/fallback"), "/fallback");
  assert.equal(safeInternalUrl("//evil.example", "/fallback"), "/fallback");
  assert.equal(safeInternalUrl(null, "/fallback"), "/fallback");
});

test("safeInternalUrl limits excessively long paths", () => {
  const result = safeInternalUrl(`/${"a".repeat(800)}`);
  assert.equal(result.length, 500);
});

test("isPermanentPushFailure recognizes expired subscriptions", () => {
  assert.equal(isPermanentPushFailure({ statusCode: 404 }), true);
  assert.equal(isPermanentPushFailure({ statusCode: 410 }), true);
  assert.equal(isPermanentPushFailure({ statusCode: 500 }), false);
  assert.equal(isPermanentPushFailure(null), false);
});

test("warsawParts uses Europe/Warsaw time including daylight saving", () => {
  assert.deepEqual(warsawParts(new Date("2026-01-15T11:30:00Z")), {
    date: "2026-01-15", month: 1, hour: 12, minute: 30,
  });
  assert.deepEqual(warsawParts(new Date("2026-07-15T10:45:00Z")), {
    date: "2026-07-15", month: 7, hour: 12, minute: 45,
  });
});

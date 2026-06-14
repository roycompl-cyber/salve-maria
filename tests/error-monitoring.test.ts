import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeErrorReport } from "../src/lib/error-monitoring";

test("sanitizeErrorReport accepts and normalizes a valid report", () => {
  const report = sanitizeErrorReport({
    message: "Nie udało się pobrać danych",
    path: "/articles/example?token=sekret",
    source: "promise",
    digest: "abc-123",
    userAgent: "Test Browser",
  });

  assert.ok(report);
  assert.equal(report.path, "/articles/example");
  assert.equal(report.source, "promise");
  assert.equal(report.digest, "abc-123");
  assert.match(report.occurredAt, /^\d{4}-\d{2}-\d{2}T/);
});

test("sanitizeErrorReport removes email addresses and query values", () => {
  const report = sanitizeErrorReport({
    message: "Błąd dla jan@example.com pod /api?a=sekret&b=inne",
    path: "/settings?email=jan@example.com",
    source: "window",
  });

  assert.ok(report);
  assert.equal(report.message.includes("jan@example.com"), false);
  assert.equal(report.message.includes("sekret"), false);
  assert.equal(report.path, "/settings");
});

test("sanitizeErrorReport rejects empty and invalid reports", () => {
  assert.equal(sanitizeErrorReport(null), null);
  assert.equal(sanitizeErrorReport({ path: "/", source: "window" }), null);
});

test("sanitizeErrorReport replaces invalid paths and sources", () => {
  const report = sanitizeErrorReport({
    message: "Błąd",
    path: "https://evil.example",
    source: "other",
  });

  assert.ok(report);
  assert.equal(report.path, "/");
  assert.equal(report.source, "window");
});

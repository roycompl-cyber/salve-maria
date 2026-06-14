export interface ClientErrorReport {
  message: string;
  path: string;
  source: "boundary" | "window" | "promise";
  digest?: string;
  userAgent?: string;
  occurredAt: string;
}

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const URL_QUERY_PATTERN = /([?&][^=\s]+)=([^&\s]+)/g;

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value
    .replace(EMAIL_PATTERN, "[email]")
    .replace(URL_QUERY_PATTERN, "$1=[ukryte]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeErrorReport(value: unknown): ClientErrorReport | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  const message = cleanText(input.message, 500);
  const rawPath = cleanText(input.path, 300);
  const path = rawPath.startsWith("/") && !rawPath.startsWith("//")
    ? rawPath.split("?")[0]
    : "/";
  const source = ["boundary", "window", "promise"].includes(String(input.source))
    ? input.source as ClientErrorReport["source"]
    : "window";

  if (!message) return null;

  return {
    message,
    path,
    source,
    digest: cleanText(input.digest, 120) || undefined,
    userAgent: cleanText(input.userAgent, 300) || undefined,
    occurredAt: new Date().toISOString(),
  };
}

export function reportClientError(report: Omit<ClientErrorReport, "occurredAt">) {
  if (typeof window === "undefined") return;
  window.fetch("/api/errors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(report),
    keepalive: true,
  }).catch(() => {});
}

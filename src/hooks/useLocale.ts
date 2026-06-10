"use client";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const messages = require("@/messages/pl.json");

function resolve(obj: Record<string, unknown>, key: string): string {
  return (
    (key.split(".").reduce((o: unknown, k) => {
      if (o && typeof o === "object") return (o as Record<string, unknown>)[k];
      return undefined;
    }, obj) as string) ?? key
  );
}

export function useLocale() {
  return {
    locale: "pl" as const,
    t: (key: string) => resolve(messages, key),
  };
}

export const locales = ["pl", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "pl";

export function getTranslations(locale: Locale) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require(`@/messages/${locale}.json`);
}

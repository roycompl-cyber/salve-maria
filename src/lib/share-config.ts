export interface ShareConfig {
  subject: string;
  body: string;
}

export const DEFAULT_SHARE_CONFIG: ShareConfig = {
  subject: "Polecam aplikację Salve Maria",
  body: `Chcę Ci polecić bezpłatną aplikację Salve Maria, Fundacji Instytutu im. Ks. Piotra Skargi.

Aplikacja działa jako PWA — wystarczy ją zainstalować na ekranie głównym telefonu (po otwarciu w przeglądarce zobaczysz instrukcję - to proste):

https://salve-maria.vercel.app

Otwórz powyższy link na telefonie i dodaj do ekranu głównego.

Serdecznie pozdrawiam.`,
};

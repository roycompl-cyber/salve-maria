"use client";
import AppShell from "@/components/AppShell";
import { ExternalLink } from "lucide-react";
import ArticlePlayer from "@/components/ArticlePlayer";

const sections = [
  {
    heading: "Kim jesteśmy",
    paragraphs: [
      "Instytut im. ks. Piotra Skargi został założony w 2001 roku. Działa jako część międzynarodowej sieci katolickich stowarzyszeń, których celem jest odpowiedź na kryzys moralny zagrażający cywilizacji chrześcijańskiej.",
      "Jesteśmy przekonani, że różne kryzysy zagrażające społeczeństwu i Kościołowi nie mogą być traktowane osobno — wypływają z jednego źródła. Tym źródłem jest Rewolucja, a odpowiedzią — Kontrrewolucja obejmująca każdą dziedzinę ludzkiej działalności: sztukę, idee, kulturę i życie publiczne.",
    ],
  },
  {
    heading: "Nasza misja",
    paragraphs: [
      "Prowadzimy kampanię Polska Katolicka, nie laicka — ogólnopolską inicjatywę na rzecz obrony wartości chrześcijańskich w życiu publicznym. Organizujemy demonstracje w największych miastach Polski, zbieramy podpisy pod petycjami i wydajemy publikacje formacyjne.",
      "Wysłaliśmy milion medalików na Ukrainę. Organizowaliśmy modlitwę różańcową pod kinami wyświetlającymi bluźniercze filmy. Stajemy w obronie nienarodzonych i sprzeciwiamy się ideologii gender.",
    ],
  },
  {
    heading: "Nasze korzenie",
    paragraphs: [
      "Organizacja macierzysta powstała w Brazylii w 1960 roku. Polski oddział jest jednym z wielu autonomicznych oddziałów na całym świecie, z których każdy poświęca się walce o te same ideały i służbie cywilizacji chrześcijańskiej.",
      "Patron naszego instytutu — ksiądz Piotr Skarga, jezuita, urodzony w roku 1536, zmarły w 1612 — był królewskim kaznodzieją, obrońcą wiary katolickiej i jednym z największych pisarzy polskiego renesansu. Jego Kazania sejmowe to ponadczasowe wezwanie do nawrócenia narodu.",
    ],
  },
  {
    heading: "Jak działamy",
    paragraphs: [
      "Nasze działania obejmują publikacje i książki, publiczne kampanie i demonstracje w największych miastach, petycje i inicjatywy obywatelskie oraz formację katolicką przez aplikację Salve Maria.",
      "Każda wpłata, każdy podpis pod petycją i każda modlitwa ma znaczenie. Razem budujemy Polskę Katolicką.",
    ],
  },
];

const PLAYER_CONTENT = sections
  .map(s => `${s.heading}.\n\n${s.paragraphs.join("\n\n")}`)
  .join("\n\n");

export default function AboutPage() {
  return (
    <AppShell>
      <div className="max-w-lg md:max-w-3xl mx-auto px-4 md:px-8 py-4 md:py-6 space-y-6 animate-fade-in">

        {/* Hero */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(160deg,#3d0a0a,#1a0505)" }}>
          <div style={{ height: 2, background: "linear-gradient(90deg,transparent,#c8922a 30%,#e2b86a 50%,#c8922a 70%,transparent)" }} />
          <div className="px-6 py-6">
            <p className="text-yellow-400/70 text-xs uppercase tracking-widest mb-2">Instytut im. ks. Piotra Skargi</p>
            <h1 className="text-2xl font-bold text-white leading-tight" style={{ fontFamily: "Georgia, serif" }}>
              O fundacji
            </h1>
            <p className="text-red-300/70 text-sm mt-2 leading-relaxed">
              Katolicka organizacja w służbie cywilizacji chrześcijańskiej od 2001 roku.
            </p>
          </div>
          <div style={{ height: 1, background: "linear-gradient(90deg,transparent,#c8922a33 40%,#c8922a33 60%,transparent)" }} />
        </div>

        {/* Player */}
        <ArticlePlayer title="O fundacji — Instytut im. ks. Piotra Skargi" content={PLAYER_CONTENT} lang="pl" />

        {/* Zdjęcie */}
        <div className="rounded-2xl overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://polskakatolicka.org/file/uploads/banery/pknl.jpg"
            alt="Polska Katolicka, nie laicka"
            className="w-full object-cover"
            style={{ maxHeight: 220 }}
          />
        </div>

        {/* Sections */}
        {sections.map((s) => (
          <section key={s.heading} className="space-y-3">
            <h2 className="text-yellow-400 text-xs uppercase tracking-widest font-semibold">{s.heading}</h2>
            <div className="bg-slate-800/60 rounded-2xl px-5 py-4 space-y-3">
              {s.paragraphs.map((p, i) => (
                <p key={i} className="text-slate-300 text-sm leading-relaxed">{p}</p>
              ))}
            </div>
          </section>
        ))}

        {/* CTA */}
        <div className="bg-slate-800/60 rounded-2xl px-5 py-5 flex flex-col gap-3">
          <p className="text-white font-semibold text-sm" style={{ fontFamily: "Georgia, serif" }}>
            Wesprzyj naszą misję
          </p>
          <p className="text-slate-400 text-xs leading-relaxed">
            Twoja darowizna pozwala nam organizować kampanie, wydawać publikacje i szerzyć wiarę katolicką w Polsce i na świecie.
          </p>
          <a
            href={`/viewer?url=${encodeURIComponent("https://polskakatolicka.org/pl/o-nas")}`}
            className="inline-flex items-center gap-2 text-xs text-amber-400 hover:text-amber-300 transition-colors"
          >
            <ExternalLink size={13} /> Czytaj więcej na polskakatolicka.org
          </a>
        </div>

      </div>
    </AppShell>
  );
}

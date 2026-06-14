"use client";
import AppShell from "@/components/AppShell";
import { useState } from "react";
import { createPortal } from "react-dom";
import { Play, X } from "lucide-react";

const VIDEOS = [
  { id: "zrjKbXAoVXg", title: "Stań w obronie najbardziej niewinnych" },
  { id: "d0nxU7jQTCc", title: "Historia bł. Natalii Tułasiewicz" },
  { id: "37qL-p08ZOY", title: "Abby Johnson niszczy argumenty proaborcyjne podczas rozprawy sądowej" },
  { id: "kyZfRcT_gVE", title: "Dr Miriam Grossman obala ideologię gender w 5 minut" },
  { id: "_2NCk5xEVeg", title: "Módl się i działaj przeciwko grzechowi aborcji" },
  { id: "LbL-GHFC0jA", title: "Rewolucja największym zagrożeniem dla cywilizacji chrześcijańskiej" },
  { id: "jp6fos3_pUQ", title: "Co się stało z Polską, przedmurzem chrześcijaństwa..." },
  { id: "JhXlqGeiFIA", title: "Nie możemy dopuścić do bluźnierczych koncertów" },
  { id: "rZNry9e1blE", title: "Jak modlić się za nienarodzonych w lewicowym Amsterdamie?" },
  { id: "a-YbmhQC-to", title: "Wolontariusze Kampanii byli w Fatimie" },
  { id: "tKO2sIl-oa8", title: "Dlaczego wysłaliśmy milion medalików na Ukrainę?" },
  { id: "1_zCjni1zTg", title: "Krucjata Przeciw Aborcji — kampanie Pro-Life w Europie Zachodniej" },
  { id: "nzHkeLQbGaw", title: "Zwolenniczka aborcji oblała nas keczupem" },
  { id: "vIO9cdfAGUg", title: "Film Fatima — orędzie tragedii czy nadziei?" },
  { id: "gyXdRkwPv24", title: "Kolejny atak środowisk sodomskich na bazylikę św. Krzyża" },
  { id: "h5szIqteRKY", title: "Czy katolicy powinni publicznie protestować przeciw bluźnierczym filmom?" },
  { id: "gn_giAamVrE", title: "Czy bluźnierstwo to sztuka? Zapytaliśmy warszawiaków" },
  { id: "aw0Tp75v_V0", title: "Uliczny protest przeciwko bluźnierczemu filmowi Benedetta" },
  { id: "LG0nSckoKEQ", title: "Modliliśmy się na Różańcu pod kinami w Warszawie, Lublinie i Białymstoku" },
];

function thumb(id: string) {
  return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
}

export default function WatchPage() {
  const [playing, setPlaying] = useState<string | null>(null);

  return (
    <AppShell>
      <div className="max-w-lg md:max-w-3xl mx-auto px-4 md:px-8 py-4 md:py-6 space-y-5 animate-fade-in">

        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-white" style={{ fontFamily: "Georgia, serif" }}>Zobacz</h1>
          <p className="text-slate-400 text-xs mt-0.5">Polecane filmy — Polska Katolicka</p>
        </div>

        {/* Player modal — portal poza brightness-wrap żeby fixed działał poprawnie */}
        {playing && createPortal(
          <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4" onClick={() => setPlaying(null)}>
            <div className="w-full max-w-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex justify-end mb-2">
                <button onClick={() => setPlaying(null)} className="text-white/60 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
                  <X size={22} />
                </button>
              </div>
              <div className="relative w-full rounded-2xl overflow-hidden bg-black" style={{ paddingTop: "56.25%" }}>
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${playing}?autoplay=1&rel=0`}
                  title="YouTube video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <p className="text-white/70 text-sm mt-3 text-center leading-snug px-2">
                {VIDEOS.find(v => v.id === playing)?.title}
              </p>
            </div>
          </div>,
          document.body
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {VIDEOS.map((v) => (
            <button
              key={v.id}
              onClick={() => setPlaying(v.id)}
              className="flex gap-3 bg-slate-800/70 rounded-2xl p-3 hover:bg-slate-700/70 transition-colors text-left group"
            >
              {/* Thumbnail */}
              <div className="relative flex-shrink-0 w-28 h-16 rounded-xl overflow-hidden bg-slate-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumb(v.id)}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-red-600/90 flex items-center justify-center shadow-lg">
                    <Play size={14} className="text-white ml-0.5" fill="white" />
                  </div>
                </div>
              </div>
              {/* Title */}
              <div className="flex-1 min-w-0 flex items-center">
                <p className="text-white text-xs font-medium leading-snug line-clamp-3" style={{ fontFamily: "Georgia, serif" }}>
                  {v.title}
                </p>
              </div>
            </button>
          ))}
        </div>

      </div>
    </AppShell>
  );
}

"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, Square, Volume2 } from "lucide-react";

// Use the native WakeLockSentinel if available, otherwise define a minimal type
type WakeLockSentinelLike = { release(): Promise<void> };
type NavigatorWakeLock = { request(type: "screen"): Promise<WakeLockSentinelLike> };

interface Props {
  title: string;
  content: string;
  lang?: string; // "pl" | "la" | inne — domyślnie "pl"
  onParagraphChange?: (idx: number) => void;
}

/** Zamienia skróty i wyrażenia trudne dla syntezatora na pełne formy.
 *  Przypadek "ks." zależy od następującego imienia:
 *  jeśli imię kończy się na -a (Jana, Piotra…) → dopełniacz, inaczej → mianownik. */
function normalizeTTS(text: string): string {
  return text
    // Specyficzne wyrażenie stałe z dopełniaczem
    .replace(/im\.\s*ks\.\s*Piotra\s*Skargi/gi, "imienia księdza Piotra Skargi")
    .replace(/im\.\s*ks\./gi, "imienia księdza")
    // ks. + imię — dopełniacz gdy imię kończy się na -a (Jana, Piotra, Pawła…)
    .replace(/\bks\.\s*([A-ZŁŚŻŹĆŃÓ][a-złśżźćńóą]*a\b)/g, "księdza $1")
    // ks. + imię w mianowniku (Jan, Piotr, Paweł…)
    .replace(/\bks\.\s*([A-ZŁŚŻŹĆŃÓ])/g, "ksiądz $1")
    // Tytuły kościelne — mianownik domyślny
    .replace(/\bkard\./gi, "kardynał")
    .replace(/\bbp\./gi, "biskup")
    .replace(/\babp\./gi, "arcybiskup")
    .replace(/\bśw\./gi, "święty")
    .replace(/\bbł\./gi, "błogosławiony")
    .replace(/\bbl\./gi, "błogosławiony")
    // Inne skróty
    .replace(/\bdr\./gi, "doktor")
    .replace(/\bprof\./gi, "profesor")
    .replace(/\bpl\./gi, "plac")
    .replace(/\bul\./gi, "ulica")
    .replace(/\bnr\s+(\d)/gi, "numer $1")
    .replace(/(\d+)\s*r\./gi, "$1 roku");
}

/** Szuka najlepszego głosu dla podanego języka.
 *  Dla łaciny: la → włoski (kościelna wymowa) → hiszpański → domyślny.
 *  Dla polskiego: pl-PL lokalny → pl-PL sieciowy → pl-* → null. */
function findVoice(lang: string): { voice: SpeechSynthesisVoice | null; label: string; bcp: string } {
  const voices = window.speechSynthesis.getVoices();

  if (lang === "la") {
    const la   = voices.find(v => v.lang.startsWith("la"));
    const itL  = voices.find(v => v.lang === "it-IT" && v.localService);
    const it   = voices.find(v => v.lang === "it-IT");
    const esL  = voices.find(v => v.lang === "es-ES" && v.localService);
    const es   = voices.find(v => v.lang === "es-ES");
    if (la)  return { voice: la,  label: "Lektor łaciński",        bcp: "la" };
    if (itL) return { voice: itL, label: "Lektor włoski (łacina)", bcp: "it-IT" };
    if (it)  return { voice: it,  label: "Lektor włoski (łacina)", bcp: "it-IT" };
    if (esL) return { voice: esL, label: "Lektor hiszpański",      bcp: "es-ES" };
    if (es)  return { voice: es,  label: "Lektor hiszpański",      bcp: "es-ES" };
    return { voice: null, label: "Lektor systemowy", bcp: "la" };
  }

  // polski (domyślny)
  const plL = voices.find(v => v.lang === "pl-PL" && v.localService);
  const pl  = voices.find(v => v.lang === "pl-PL");
  const plA = voices.find(v => v.lang.startsWith("pl"));
  const best = plL ?? pl ?? plA ?? null;
  return { voice: best, label: "Lektor polski", bcp: "pl-PL" };
}

export default function ArticlePlayer({ title, content, lang = "pl", onParagraphChange }: Props) {
  const [supported, setSupported] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [currentPara, setCurrentPara] = useState(-1);
  const [voiceReady, setVoiceReady] = useState(false);
  const [voiceLabel, setVoiceLabel] = useState("");
  const [wakeLockSupported, setWakeLockSupported] = useState(true);
  const utterancesRef = useRef<SpeechSynthesisUtterance[]>([]);
  const currentIdxRef = useRef(0);
  const wakeLockRef = useRef<WakeLockSentinelLike | null>(null);
  const silentIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const isLatin = lang === "la";
  const accentColor = isLatin ? "#d97706" : "#3b82f6"; // bursztyn dla łaciny, niebieski dla PL

  const paragraphs = [title, ...content.split("\n\n").filter(p => p.trim().length > 10)];

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    setSupported(true);
    if (!("wakeLock" in navigator)) {
      setWakeLockSupported(false);
    }
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setVoiceReady(true);
        setVoiceLabel(findVoice(lang).label);
      }
    };
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, [lang]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
      if (silentIntervalRef.current !== null) {
        clearInterval(silentIntervalRef.current);
        silentIntervalRef.current = null;
      }
    };
  }, []);

  // Silent audio keep-alive when page is hidden and TTS is playing
  useEffect(() => {
    const playSilentTone = () => {
      try {
        if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
          audioCtxRef.current = new AudioContext();
        }
        const ctx = audioCtxRef.current;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        gainNode.gain.value = 0.001;
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.1);
      } catch {
        // ignore audio errors
      }
    };

    const startSilentInterval = () => {
      if (silentIntervalRef.current !== null) return;
      silentIntervalRef.current = setInterval(playSilentTone, 20000);
    };

    const stopSilentInterval = () => {
      if (silentIntervalRef.current !== null) {
        clearInterval(silentIntervalRef.current);
        silentIntervalRef.current = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && playing) {
        startSilentInterval();
      } else {
        stopSilentInterval();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    // If already hidden when playing starts, begin interval
    if (document.visibilityState === "hidden" && playing) {
      startSilentInterval();
    } else if (!playing) {
      stopSilentInterval();
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (!playing) stopSilentInterval();
    };
  }, [playing]);

  const speakFrom = useCallback((startIdx: number) => {
    window.speechSynthesis.cancel();
    utterancesRef.current = [];
    currentIdxRef.current = startIdx;

    const { voice, bcp } = findVoice(lang);

    paragraphs.slice(startIdx).forEach((para, relIdx) => {
      const absIdx = startIdx + relIdx;
      const utt = new SpeechSynthesisUtterance(normalizeTTS(para));
      utt.lang = bcp;
      utt.rate = isLatin ? 0.88 : 1; // łacina czytana wolniej dla wyraźności
      if (voice) utt.voice = voice;

      utt.onstart = () => {
        setCurrentPara(absIdx);
        currentIdxRef.current = absIdx;
        onParagraphChange?.(absIdx);
        document.getElementById(`para-${absIdx}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      };
      utt.onend = () => {
        if (absIdx === paragraphs.length - 1) {
          setPlaying(false); setPaused(false);
          setCurrentPara(-1); onParagraphChange?.(-1);
        }
      };
      utt.onerror = () => { setPlaying(false); setPaused(false); };

      utterancesRef.current.push(utt);
      window.speechSynthesis.speak(utt);
    });

    setPlaying(true);
    setPaused(false);
  }, [paragraphs, lang, isLatin]); // eslint-disable-line react-hooks/exhaustive-deps

  const acquireWakeLock = async () => {
    const wl = (navigator as Navigator & { wakeLock?: NavigatorWakeLock }).wakeLock;
    if (!wl) return;
    try {
      wakeLockRef.current = await wl.request("screen");
    } catch {
      // ignore wake lock errors
    }
  };

  const releaseWakeLock = () => {
    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
  };

  function handlePlay() {
    if (!voiceReady) return;
    if (paused) {
      window.speechSynthesis.resume();
      setPlaying(true);
      setPaused(false);
      acquireWakeLock();
    } else {
      speakFrom(0);
      acquireWakeLock();
    }
  }
  function handlePause() {
    window.speechSynthesis.pause();
    setPlaying(false);
    setPaused(true);
    releaseWakeLock();
  }
  function handleStop() {
    window.speechSynthesis.cancel();
    setPlaying(false); setPaused(false);
    setCurrentPara(-1); onParagraphChange?.(-1);
    currentIdxRef.current = 0;
    releaseWakeLock();
  }

  if (!supported) return null;

  return (
    <>
      <div className="sticky top-[112px] z-20 mx-0 mb-4">
        <div className="backdrop-blur-md border rounded-2xl shadow-xl overflow-hidden"
          style={{ background: "rgba(15,23,42,0.97)", borderColor: `${accentColor}33` }}>
          {/* cienka linia akcentu na górze */}
          {isLatin && (
            <div style={{ height: 2, background: `linear-gradient(90deg,transparent,${accentColor}88 40%,${accentColor}88 60%,transparent)` }} />
          )}
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${accentColor}22` }}>
              <Volume2 size={16} style={{ color: accentColor }} className={playing ? "animate-pulse" : ""} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">
                {playing ? `Akapit ${currentPara + 1} / ${paragraphs.length}` : paused ? "Wstrzymano" : "Czytaj"}
              </p>
              {!playing && !paused && voiceLabel && (
                <p className="text-[10px] truncate mt-0.5" style={{ color: accentColor }}>
                  {voiceLabel}
                </p>
              )}
            </div>

            {!playing ? (
              <button onClick={handlePlay} disabled={!voiceReady}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 disabled:opacity-40"
                style={{ background: voiceReady ? accentColor : "#334155" }}>
                <Play size={16} className="text-white ml-0.5" fill="white" />
              </button>
            ) : (
              <button onClick={handlePause}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                style={{ background: "#d97706" }}>
                <Pause size={16} className="text-white" fill="white" />
              </button>
            )}

            <button onClick={handleStop} disabled={!playing && !paused}
              className="w-9 h-9 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
              <Square size={14} className="text-slate-300" fill="currentColor" />
            </button>
          </div>
        </div>
        {playing && !wakeLockSupported && (
          <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 mt-2">
            Aby słuchać przy wygaszonym ekranie, wyłącz automatyczne wygaszanie w ustawieniach telefonu.
          </div>
        )}
      </div>

      <style>{`
        .para-highlight { transition: background-color 0.3s ease, padding 0.3s ease, border-radius 0.3s ease; }
        .para-highlight.active {
          background-color: ${isLatin ? "rgba(217,119,6,0.10)" : "rgba(59,130,246,0.12)"};
          padding: 8px 10px; border-radius: 10px; color: #e2e8f0;
        }
      `}</style>
    </>
  );
}

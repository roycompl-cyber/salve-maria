"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, Square, Volume2, ChevronUp, ChevronDown } from "lucide-react";

interface Props {
  title: string;
  content: string;
  onParagraphChange?: (idx: number) => void;
}

export default function ArticlePlayer({ title, content, onParagraphChange }: Props) {
  const [supported, setSupported] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [currentPara, setCurrentPara] = useState(-1);
  const [rate, setRate] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const [voiceReady, setVoiceReady] = useState(false);
  const utterancesRef = useRef<SpeechSynthesisUtterance[]>([]);
  const currentIdxRef = useRef(0);

  // Split into paragraphs, prepend title
  const paragraphs = [title, ...content.split("\n\n").filter((p) => p.trim().length > 10)];

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    setSupported(true);

    // Voices load async — wait for them
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) setVoiceReady(true);
    };
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  function getPolishVoice(): SpeechSynthesisVoice | null {
    const voices = window.speechSynthesis.getVoices();
    return (
      voices.find((v) => v.lang === "pl-PL" && v.localService) ||
      voices.find((v) => v.lang === "pl-PL") ||
      voices.find((v) => v.lang.startsWith("pl")) ||
      null
    );
  }

  const speakFrom = useCallback((startIdx: number) => {
    window.speechSynthesis.cancel();
    utterancesRef.current = [];
    currentIdxRef.current = startIdx;

    const voice = getPolishVoice();

    paragraphs.slice(startIdx).forEach((para, relIdx) => {
      const absIdx = startIdx + relIdx;
      const utt = new SpeechSynthesisUtterance(para);
      utt.lang = "pl-PL";
      utt.rate = rate;
      if (voice) utt.voice = voice;

      utt.onstart = () => {
        setCurrentPara(absIdx);
        currentIdxRef.current = absIdx;
        onParagraphChange?.(absIdx);
        // Scroll paragraph into view
        document.getElementById(`para-${absIdx}`)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      };

      utt.onend = () => {
        if (absIdx === paragraphs.length - 1) {
          setPlaying(false);
          setPaused(false);
          setCurrentPara(-1);
          onParagraphChange?.(-1);
        }
      };

      utt.onerror = () => {
        setPlaying(false);
        setPaused(false);
      };

      utterancesRef.current.push(utt);
      window.speechSynthesis.speak(utt);
    });

    setPlaying(true);
    setPaused(false);
  }, [paragraphs, rate]);

  function handlePlay() {
    if (!voiceReady) return;
    if (paused) {
      window.speechSynthesis.resume();
      setPlaying(true);
      setPaused(false);
    } else {
      speakFrom(0);
    }
  }

  function handlePause() {
    window.speechSynthesis.pause();
    setPlaying(false);
    setPaused(true);
  }

  function handleStop() {
    window.speechSynthesis.cancel();
    setPlaying(false);
    setPaused(false);
    setCurrentPara(-1);
    onParagraphChange?.(-1);
    currentIdxRef.current = 0;
  }

  function handleRateChange(newRate: number) {
    setRate(newRate);
    if (playing || paused) {
      const idx = currentIdxRef.current;
      window.speechSynthesis.cancel();
      setTimeout(() => speakFrom(idx), 100);
    }
  }

  if (!supported) return null;

  const polishVoice = voiceReady ? getPolishVoice() : null;

  return (
    <>
      {/* Floating player bar */}
      <div className="sticky top-[112px] z-20 mx-0 mb-4">
        <div className="bg-slate-800/95 backdrop-blur-md border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
          {/* Main controls row */}
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 bg-blue-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Volume2 size={16} className={`text-blue-400 ${playing ? "animate-pulse" : ""}`} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">
                {playing
                  ? `Czyta: akapit ${currentPara + 1} / ${paragraphs.length}`
                  : paused
                  ? "Wstrzymano"
                  : "Synteza mowy"}
              </p>
              <p className="text-slate-500 text-[10px]">
                {polishVoice ? `Głos: ${polishVoice.name}` : "Brak głosu polskiego — używam domyślnego"}
              </p>
            </div>

            {/* Play / Pause */}
            {!playing ? (
              <button
                onClick={handlePlay}
                disabled={!voiceReady}
                className="w-9 h-9 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
              >
                <Play size={16} className="text-white ml-0.5" fill="white" />
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="w-9 h-9 bg-amber-600 hover:bg-amber-500 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
              >
                <Pause size={16} className="text-white" fill="white" />
              </button>
            )}

            {/* Stop */}
            <button
              onClick={handleStop}
              disabled={!playing && !paused}
              className="w-9 h-9 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
            >
              <Square size={14} className="text-slate-300" fill="currentColor" />
            </button>

            {/* Expand toggle */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-9 h-9 bg-slate-700 hover:bg-slate-600 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
            >
              {expanded ? (
                <ChevronUp size={16} className="text-slate-300" />
              ) : (
                <ChevronDown size={16} className="text-slate-300" />
              )}
            </button>
          </div>

          {/* Expanded — speed & progress */}
          {expanded && (
            <div className="px-4 pb-3 border-t border-slate-700 pt-3 space-y-3">
              {/* Speed selector */}
              <div>
                <p className="text-slate-400 text-xs mb-2">Prędkość czytania</p>
                <div className="flex gap-2">
                  {[0.75, 1, 1.25, 1.5, 1.75].map((r) => (
                    <button
                      key={r}
                      onClick={() => handleRateChange(r)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        rate === r
                          ? "bg-blue-600 text-white"
                          : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                      }`}
                    >
                      {r}×
                    </button>
                  ))}
                </div>
              </div>

              {/* Progress bar */}
              {(playing || paused) && (
                <div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{
                        width: `${Math.round(((currentPara + 1) / paragraphs.length) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-slate-500 text-[10px] mt-1 text-right">
                    {Math.round(((currentPara + 1) / paragraphs.length) * 100)}%
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Paragraph highlights rendered separately — injected via data-para-id */}
      <style>{`
        .para-highlight {
          transition: background-color 0.3s ease, padding 0.3s ease, border-radius 0.3s ease;
        }
        .para-highlight.active {
          background-color: rgba(59, 130, 246, 0.12);
          padding: 8px 10px;
          border-radius: 10px;
          color: #e2e8f0;
        }
      `}</style>
    </>
  );
}


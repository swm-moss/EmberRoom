"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CloudRain, Flame, Keyboard, Music4, Volume2, X, type LucideIcon } from "lucide-react";
import { AmbientEngine, type AmbientLayer } from "@/lib/ambient";
import { trackEvent } from "@/lib/analytics";

type LayerMeta = {
  key: AmbientLayer;
  label: string;
  hint: string;
  icon: LucideIcon;
};

const layerMeta: LayerMeta[] = [
  { key: "rain", label: "빗소리", hint: "비 오는 창가", icon: CloudRain },
  { key: "fire", label: "난로", hint: "겨울 자습실", icon: Flame },
  { key: "keyboard", label: "키보드", hint: "코딩룸", icon: Keyboard }
];

export function AmbientSoundDock() {
  const shouldReduceMotion = useReducedMotion();
  const engineRef = useRef<AmbientEngine | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Record<AmbientLayer, boolean>>({
    rain: false,
    fire: false,
    keyboard: false
  });
  const [volume, setVolume] = useState(55);

  useEffect(() => {
    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  function getEngine(): AmbientEngine {
    if (!engineRef.current) {
      engineRef.current = new AmbientEngine();
      engineRef.current.setMasterVolume(volume / 100);
    }
    return engineRef.current;
  }

  function handleToggleLayer(layer: AmbientLayer) {
    const isOn = getEngine().toggle(layer);
    setActive((prev) => ({ ...prev, [layer]: isOn }));
    trackEvent("ambient_sound_toggle", { layer, on: isOn });
  }

  function handleVolume(next: number) {
    setVolume(next);
    engineRef.current?.setMasterVolume(next / 100);
  }

  const activeCount = Object.values(active).filter(Boolean).length;
  const playing = activeCount > 0;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {open ? (
          <motion.div
            key="panel"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="pointer-events-auto w-[16.5rem] rounded-3xl border border-[#dfbc8a] bg-[#fffaf0]/95 p-4 shadow-[0_26px_90px_rgba(117,78,34,0.24)] backdrop-blur"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-[#3b281d]">환경음 믹서</p>
                <p className="mt-0.5 text-xs text-[#8a674b]">방의 분위기를 미리 들어보세요</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="환경음 믹서 닫기"
                className="focus-ring flex h-8 w-8 items-center justify-center rounded-full bg-[#f2dfbd] text-[#5b3b24] transition hover:bg-ember-400"
              >
                <X aria-hidden className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid gap-2">
              {layerMeta.map(({ key, label, hint, icon: Icon }) => {
                const on = active[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleToggleLayer(key)}
                    aria-pressed={on}
                    className={`focus-ring flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition ${
                      on
                        ? "border-ember-400 bg-[#f5d59c] text-[#2d190f] shadow-lamp"
                        : "border-[#d7b98d] bg-[#fffdf6] text-[#6e4f38] hover:border-ember-400"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
                        on ? "bg-ember-400 text-[#2b160f]" : "bg-[#f2dfbd] text-[#8a4617]"
                      }`}
                    >
                      <Icon aria-hidden className="h-4 w-4" />
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-semibold">{label}</span>
                      <span className="block text-xs opacity-70">{hint}</span>
                    </span>
                    {on ? <Equalizer reduce={Boolean(shouldReduceMotion)} /> : null}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Volume2 aria-hidden className="h-4 w-4 shrink-0 text-[#8a674b]" />
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(event) => handleVolume(Number(event.target.value))}
                aria-label="환경음 볼륨"
                className="ambient-slider h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#e7cda3]"
              />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={open ? "환경음 믹서 접기" : "환경음 믹서 열기"}
        className="focus-ring pointer-events-auto inline-flex items-center gap-2 rounded-full border border-[#dfbc8a] bg-[#fffaf0]/95 px-4 py-3 text-sm font-bold text-[#3b281d] shadow-[0_18px_60px_rgba(117,78,34,0.22)] backdrop-blur transition hover:border-ember-400"
      >
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
            playing ? "bg-ember-400 text-[#2b160f]" : "bg-[#f2dfbd] text-[#8a4617]"
          }`}
        >
          <Music4 aria-hidden className="h-4 w-4" />
        </span>
        {playing ? <Equalizer reduce={Boolean(shouldReduceMotion)} /> : <span>환경음</span>}
      </button>
    </div>
  );
}

function Equalizer({ reduce }: { reduce: boolean }) {
  const bars = [0, 1, 2, 3];
  return (
    <span aria-hidden className="flex h-4 items-end gap-0.5">
      {bars.map((index) => (
        <motion.span
          key={index}
          className="w-1 rounded-full bg-[#8a4617]"
          initial={{ height: 5 }}
          animate={reduce ? { height: 9 } : { height: [5, 15, 7, 13, 5] }}
          transition={
            reduce
              ? undefined
              : { duration: 0.9 + index * 0.18, repeat: Infinity, ease: "easeInOut" }
          }
        />
      ))}
    </span>
  );
}

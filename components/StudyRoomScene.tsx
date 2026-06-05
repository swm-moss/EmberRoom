"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Coffee, Film, PenLine, Phone, Play, RotateCcw, Sparkles, Timer, X, type LucideIcon } from "lucide-react";

type SceneState = "study" | "phone" | "break" | "complete";

type StateConfig = {
  label: string;
  asset: string;
  fallback: string;
  bubble: string;
  caption: string;
  icon: LucideIcon;
  dim: number; // 앱 밖일수록 살짝 포근하게 어두워짐 (고양이 스프처럼 과하지 않게)
};

const STATE_CONFIG: Record<SceneState, StateConfig> = {
  study: {
    label: "공부 중",
    asset: "/assets/character/me_study.png",
    fallback: "/images/character-study.png",
    bubble: "32분째 집중 중!",
    caption: "방 안 — 같이 집중 중",
    icon: PenLine,
    dim: 0
  },
  phone: {
    label: "폰 보는 중",
    asset: "/assets/character/me_phone.png",
    fallback: "/images/character-phone.png",
    bubble: "앱 밖으로 나갔어요…",
    caption: "앱 밖 — 캐릭터도 폰 보는 중",
    icon: Phone,
    dim: 0.24
  },
  break: {
    label: "휴식 중",
    asset: "/assets/character/me_break.png",
    fallback: "/images/character-break.png",
    bubble: "따뜻한 거 한 모금.",
    caption: "잠깐 숨 고르는 중",
    icon: Coffee,
    dim: 0.08
  },
  complete: {
    label: "완료",
    asset: "/assets/character/me_complete.png",
    fallback: "/images/character-complete.png",
    bubble: "오늘도 해냈어요!",
    caption: "세션 완료 — 방이 환해졌어요",
    icon: Sparkles,
    dim: 0
  }
};

const STATE_ORDER: SceneState[] = ["study", "phone", "break", "complete"];

const MOTES = [
  { left: "16%", top: "30%", size: 4, delay: 0, duration: 9 },
  { left: "30%", top: "18%", size: 3, delay: 2.2, duration: 11 },
  { left: "62%", top: "24%", size: 5, delay: 1.1, duration: 10 },
  { left: "74%", top: "14%", size: 3, delay: 3.0, duration: 12 },
  { left: "46%", top: "12%", size: 4, delay: 1.7, duration: 10.5 }
];

// 에셋 → 기존 이미지(임시) → 카드형 플레이스홀더 순으로 폴백.
function SceneImage({
  asset,
  fallback,
  alt,
  fit = "cover",
  position = "object-center",
  placeholderLabel,
  placeholderIcon: Icon,
  priority = false
}: {
  asset: string;
  fallback?: string;
  alt: string;
  fit?: "cover" | "contain";
  position?: string;
  placeholderLabel: string;
  placeholderIcon: LucideIcon;
  priority?: boolean;
}) {
  const [stage, setStage] = useState<"asset" | "fallback" | "card">("asset");

  useEffect(() => {
    setStage("asset");
  }, [asset]);

  if (stage === "card" || (stage === "fallback" && !fallback)) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#e9dcc2]/70 text-center text-[#7c6a4a]">
        <Icon aria-hidden className="h-7 w-7 opacity-70" />
        <p className="px-2 text-xs font-semibold leading-4">{placeholderLabel}</p>
        <p className="text-[10px] opacity-70">에셋 넣으면 교체</p>
      </div>
    );
  }

  const isAsset = stage === "asset";
  return (
    <Image
      src={isAsset ? asset : (fallback as string)}
      alt={alt}
      fill
      priority={priority}
      sizes="(max-width: 768px) 100vw, 520px"
      className={`${fit === "cover" ? "object-cover" : "object-contain"} ${position}`}
      onError={() => setStage((prev) => (prev === "asset" ? "fallback" : "card"))}
    />
  );
}

export function StudyRoomScene() {
  const shouldReduceMotion = useReducedMotion();
  const [state, setState] = useState<SceneState>("study");
  const [playing, setPlaying] = useState(false);
  const [recordMode, setRecordMode] = useState(false);
  const [returnToast, setReturnToast] = useState(false);
  const timeoutsRef = useRef<number[]>([]);
  const playingRef = useRef(false);

  const config = STATE_CONFIG[state];

  const clearTimers = useCallback(() => {
    timeoutsRef.current.forEach((id) => window.clearTimeout(id));
    timeoutsRef.current = [];
  }, []);

  // 자동 데모: 공부 → (앱 이탈) 폰 → 복귀 → 완료. 깔끔한 한 컷 촬영용.
  const playDemo = useCallback(() => {
    clearTimers();
    setReturnToast(false);
    setPlaying(true);
    playingRef.current = true;
    setState("study");

    const steps: Array<{ at: number; run: () => void }> = [
      { at: 3000, run: () => setState("phone") },
      {
        at: 6000,
        run: () => {
          setState("study");
          setReturnToast(true);
          window.setTimeout(() => setReturnToast(false), 2600);
        }
      },
      { at: 8200, run: () => setState("complete") },
      {
        at: 10400,
        run: () => {
          setState("study");
          setPlaying(false);
          playingRef.current = false;
        }
      }
    ];
    steps.forEach(({ at, run }) => timeoutsRef.current.push(window.setTimeout(run, at)));
  }, [clearTimers]);

  const stopDemo = useCallback(() => {
    clearTimers();
    setPlaying(false);
    playingRef.current = false;
  }, [clearTimers]);

  // 실제 앱 이탈 감지: 탭 전환/창 blur 시 캐릭터가 폰을 보게. 데모 재생 중엔 무시.
  useEffect(() => {
    function onVisibility() {
      if (playingRef.current) {
        return;
      }
      if (document.visibilityState === "hidden") {
        setState("phone");
      } else {
        setState("study");
        setReturnToast(true);
        window.setTimeout(() => setReturnToast(false), 2600);
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      clearTimers();
    };
  }, [clearTimers]);

  // 녹화 모드: Esc 로 종료.
  useEffect(() => {
    if (!recordMode) {
      return;
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setRecordMode(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [recordMode]);

  return (
    <main
      className={`flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-[#efe6d2] px-4 ${
        recordMode ? "py-0" : "py-6"
      }`}
    >
      {/* ───────── 9:16 무대 ───────── */}
      <div
        className={`relative aspect-[9/16] overflow-hidden rounded-[2rem] border border-[#d9c8a6] bg-[#f4ead6] shadow-[0_40px_140px_rgba(120,96,55,0.35)] ${
          recordMode ? "h-screen rounded-none border-0" : "h-[88svh] max-h-[860px]"
        }`}
      >
        {/* Layer 1 — 배경 (아주 느린 숨쉬기) */}
        <motion.div
          className="absolute inset-0"
          animate={shouldReduceMotion ? undefined : { scale: [1.02, 1.045, 1.02] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        >
          <SceneImage
            asset="/assets/scene/library_bg_portrait.png"
            fallback="/images/night-study-room.png"
            alt="포근한 수채 공부방 배경"
            placeholderLabel="공부방 배경"
            placeholderIcon={Timer}
            priority
          />
        </motion.div>

        {/* Layer 2 — 창가 햇살 (은은하게 호흡) */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(255,240,200,0.5),transparent_46%)] mix-blend-screen"
          animate={shouldReduceMotion ? undefined : { opacity: [0.45, 0.7, 0.45] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Layer 3 — 부드러운 먼지 입자 */}
        {!shouldReduceMotion ? (
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            {MOTES.map((mote, index) => (
              <motion.span
                key={index}
                className="absolute rounded-full bg-[#fff3d6] blur-[1px]"
                style={{ left: mote.left, top: mote.top, width: mote.size, height: mote.size }}
                animate={{ y: [0, 26, 0], x: [0, 10, 0], opacity: [0.15, 0.6, 0.15] }}
                transition={{ duration: mote.duration, delay: mote.delay, repeat: Infinity, ease: "easeInOut" }}
              />
            ))}
          </div>
        ) : null}

        {/* Layer 4 — 메인 캐릭터(여우+책상 vignette): 숨쉬기 + 상태 크로스페이드 + 머그 김 */}
        <div className="absolute inset-x-0 bottom-[2%] mx-auto aspect-square w-[92%]">
          <motion.div
            className="absolute inset-0"
            animate={shouldReduceMotion ? undefined : { y: [0, -7, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <AnimatePresence mode="popLayout">
              <motion.div
                key={state}
                className="absolute inset-0"
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
                transition={{ duration: 0.55, ease: "easeInOut" }}
              >
                <SceneImage
                  asset={config.asset}
                  fallback={config.fallback}
                  alt={`내 캐릭터: ${config.label}`}
                  fit="contain"
                  position="object-bottom"
                  placeholderLabel={`내 캐릭터 · ${config.label}`}
                  placeholderIcon={config.icon}
                  priority
                />
              </motion.div>
            </AnimatePresence>

            {/* 머그 김 (vignette 안 머그 위치에 맞춰 살짝) */}
            {!shouldReduceMotion ? <Steam /> : null}
          </motion.div>
        </div>

        {/* Layer 5 — 앱 밖일 때 포근하게 어두워짐 + 깊이감 */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[#3a2a16]"
          animate={{ opacity: config.dim }}
          transition={{ duration: 0.6 }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#5a431f]/25 via-transparent to-[#5a431f]/12"
        />

        {/* ── 씬 UI (말풍선/타이머/캡션) — 녹화에 포함 ── */}
        <div className="pointer-events-none absolute left-4 right-4 top-4 flex items-start justify-between gap-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={config.bubble}
              initial={{ opacity: 0, y: -8, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.92 }}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
              className="max-w-[62%] rounded-2xl rounded-tl-sm bg-[#fffaf0]/95 px-3.5 py-2 text-sm font-bold text-[#5a4327] shadow-[0_10px_30px_rgba(120,96,55,0.25)]"
            >
              {state === "phone" ? (
                <Phone aria-hidden className="mb-0.5 mr-1 inline h-4 w-4 text-[#b07b3a]" />
              ) : null}
              {config.bubble}
            </motion.div>
          </AnimatePresence>

          <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-[#e0cba0] bg-[#fffaf0]/85 px-3 py-2 text-[#5a4327] backdrop-blur">
            <Timer aria-hidden className="h-4 w-4 text-[#b07b3a]" />
            <span className="text-base font-black tabular-nums">25:00</span>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex flex-col items-center gap-1.5 text-center">
          <p className="rounded-full bg-[#fffaf0]/85 px-3 py-1 text-xs font-semibold text-[#7c6038] backdrop-blur">
            {config.caption}
          </p>
          <p className="text-base font-black text-[#43331c] drop-shadow-[0_1px_6px_rgba(255,250,240,0.7)] sm:text-lg">
            앱을 나가면, 내 캐릭터도 폰을 봅니다.
          </p>
        </div>

        {/* 복귀 토스트 */}
        <AnimatePresence>
          {returnToast ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="pointer-events-none absolute bottom-[15%] left-1/2 -translate-x-1/2 rounded-full bg-[#5b6b4a]/95 px-4 py-2 text-sm font-bold text-[#f3f6ea] shadow-[0_10px_30px_rgba(80,70,40,0.3)]"
            >
              조교: “다시 와주셨네요.”
            </motion.div>
          ) : null}
        </AnimatePresence>

        {recordMode ? (
          <button
            type="button"
            onClick={() => setRecordMode(false)}
            aria-label="녹화 모드 종료 (Esc)"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white/80 transition hover:bg-black/50"
          >
            <X aria-hidden className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {/* ───────── 컨트롤 (녹화 모드에선 숨김) ───────── */}
      {!recordMode ? (
        <div className="flex w-full max-w-[420px] flex-col gap-3">
          <div className="grid grid-cols-4 gap-2">
            {STATE_ORDER.map((key) => {
              const item = STATE_CONFIG[key];
              const Icon = item.icon;
              const active = state === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    stopDemo();
                    setState(key);
                  }}
                  className={`flex min-h-11 flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-2 text-xs font-bold transition ${
                    active
                      ? "border-[#c79a52] bg-[#e9c987] text-[#4a3618]"
                      : "border-[#d9c8a6] bg-[#fffaf0] text-[#7c6038] hover:border-[#c79a52]"
                  }`}
                >
                  <Icon aria-hidden className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={playing ? stopDemo : playDemo}
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#d99a4e] px-4 text-sm font-bold text-[#3a2a12] transition hover:bg-[#e4a85f]"
            >
              {playing ? (
                <>
                  <RotateCcw aria-hidden className="h-4 w-4" />
                  멈추기
                </>
              ) : (
                <>
                  <Play aria-hidden className="h-4 w-4" />
                  데모 재생 (촬영용)
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setRecordMode(true)}
              className="flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[#d9c8a6] bg-[#fffaf0] px-4 text-sm font-bold text-[#7c6038] transition hover:border-[#c79a52]"
            >
              <Film aria-hidden className="h-4 w-4" />
              녹화 모드
            </button>
          </div>

          <p className="text-center text-xs leading-5 text-[#9a8763]">
            탭을 전환하거나 창을 벗어나면 캐릭터가 실제로 폰을 봐요. ·{" "}
            <span className="text-[#b39a6f]">에셋을 `public/assets/`에 덮어쓰면 자동 교체됩니다.</span>
          </p>
        </div>
      ) : null}
    </main>
  );
}

// 머그에서 모락모락 올라오는 김 (vignette 좌측 하단 머그 위치 근사).
function Steam() {
  const wisps = [
    { left: "23%", delay: 0 },
    { left: "26%", delay: 1.2 },
    { left: "20%", delay: 2.1 }
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {wisps.map((wisp, index) => (
        <motion.span
          key={index}
          className="absolute h-8 w-1.5 rounded-full bg-[#fff7e8] blur-[3px]"
          style={{ left: wisp.left, top: "52%" }}
          animate={{ y: [0, -34], opacity: [0, 0.5, 0], scaleX: [1, 1.6, 2.2] }}
          transition={{ duration: 4.5, delay: wisp.delay, repeat: Infinity, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

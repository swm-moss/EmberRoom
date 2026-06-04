"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Coffee,
  Film,
  GraduationCap,
  PenLine,
  Phone,
  Play,
  RotateCcw,
  Sparkles,
  Timer,
  UsersRound,
  X,
  type LucideIcon
} from "lucide-react";

type SceneState = "study" | "phone" | "break" | "complete";

type StateConfig = {
  label: string;
  asset: string; // 최종 에셋(투명 PNG) 슬롯
  fallback: string; // 에셋 없을 때 임시로 보여줄 기존 이미지
  bubble: string;
  caption: string;
  icon: LucideIcon;
  dim: number; // 방을 얼마나 어둡게 할지 (0~1)
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
    dim: 0.5
  },
  break: {
    label: "휴식 중",
    asset: "/assets/character/me_break.png",
    fallback: "/images/character-break.png",
    bubble: "따뜻한 거 한 모금.",
    caption: "잠깐 숨 고르는 중",
    icon: Coffee,
    dim: 0.16
  },
  complete: {
    label: "완료",
    asset: "/assets/character/me_complete.png",
    fallback: "/images/character-complete.png",
    bubble: "오늘도 해냈어요!",
    caption: "세션 완료 — 방이 밝아졌어요",
    icon: Sparkles,
    dim: 0
  }
};

const STATE_ORDER: SceneState[] = ["study", "phone", "break", "complete"];

const PARTICLES = [
  { left: "14%", size: 5, delay: 0, duration: 8 },
  { left: "28%", size: 4, delay: 1.6, duration: 10 },
  { left: "44%", size: 7, delay: 0.7, duration: 9 },
  { left: "58%", size: 4, delay: 2.3, duration: 11 },
  { left: "70%", size: 6, delay: 1.1, duration: 8.5 },
  { left: "84%", size: 4, delay: 0.4, duration: 10.5 }
];

// 에셋 → 기존 이미지(임시) → 카드형 플레이스홀더 순으로 우아하게 폴백.
function SceneImage({
  asset,
  fallback,
  alt,
  fitAsset = "cover",
  fitFallback = "cover",
  position = "object-center",
  placeholderLabel,
  placeholderIcon: Icon,
  priority = false
}: {
  asset: string;
  fallback?: string;
  alt: string;
  fitAsset?: "cover" | "contain";
  fitFallback?: "cover" | "contain";
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
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#2a201a]/80 text-center text-[#f3d9a5]">
        <Icon aria-hidden className="h-7 w-7 opacity-80" />
        <p className="px-2 text-xs font-semibold leading-4">{placeholderLabel}</p>
        <p className="text-[10px] text-[#caa97a]">에셋 넣으면 교체</p>
      </div>
    );
  }

  const isAsset = stage === "asset";
  const src = isAsset ? asset : (fallback as string);
  const fit = isAsset ? fitAsset : fitFallback;

  return (
    <Image
      src={src}
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

  const goTo = useCallback((next: SceneState) => {
    setState(next);
  }, []);

  // 자동 데모: 공부 → (앱 이탈) 폰 → 복귀 → 완료. 깔끔한 한 컷 촬영용.
  const playDemo = useCallback(() => {
    clearTimers();
    setReturnToast(false);
    setPlaying(true);
    playingRef.current = true;
    setState("study");

    const steps: Array<{ at: number; run: () => void }> = [
      { at: 2800, run: () => setState("phone") },
      {
        at: 5600,
        run: () => {
          setState("study");
          setReturnToast(true);
          window.setTimeout(() => setReturnToast(false), 2600);
        }
      },
      { at: 7600, run: () => setState("complete") },
      {
        at: 9800,
        run: () => {
          setState("study");
          setPlaying(false);
          playingRef.current = false;
        }
      }
    ];

    steps.forEach(({ at, run }) => {
      timeoutsRef.current.push(window.setTimeout(run, at));
    });
  }, [clearTimers]);

  const stopDemo = useCallback(() => {
    clearTimers();
    setPlaying(false);
    playingRef.current = false;
  }, [clearTimers]);

  // 실제 앱 이탈 감지: 탭 전환/창 blur 시 캐릭터가 폰을 보게. 데모 재생 중엔 무시.
  useEffect(() => {
    function handleHidden() {
      if (playingRef.current) {
        return;
      }
      if (document.visibilityState === "hidden") {
        setState("phone");
      }
    }
    function handleVisible() {
      if (playingRef.current) {
        return;
      }
      if (document.visibilityState === "visible") {
        setState("study");
        setReturnToast(true);
        window.setTimeout(() => setReturnToast(false), 2600);
      }
    }
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        handleHidden();
      } else {
        handleVisible();
      }
    });
    return () => clearTimers();
  }, [clearTimers]);

  // 녹화 모드: Esc 로 빠져나오기.
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
      className={`flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-[#15110d] px-4 ${
        recordMode ? "py-0" : "py-6"
      }`}
    >
      {/* ───────── 9:16 무대 ───────── */}
      <div
        className={`relative aspect-[9/16] overflow-hidden rounded-[2rem] border border-[#3a2b1d] bg-[#0f0b08] shadow-[0_40px_140px_rgba(0,0,0,0.6)] ${
          recordMode ? "h-screen rounded-none border-0" : "h-[88svh] max-h-[860px]"
        }`}
      >
        {/* Layer 1 — 배경 플레이트 */}
        <motion.div
          className="absolute inset-0"
          animate={shouldReduceMotion ? undefined : { scale: [1.04, 1.07, 1.04] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        >
          <SceneImage
            asset="/assets/scene/library_bg_portrait.png"
            fallback="/images/night-study-room.png"
            alt="아늑한 도서관 배경"
            placeholderLabel="도서관 배경"
            placeholderIcon={Timer}
            priority
          />
        </motion.div>

        {/* Layer 2 — 햇살/램프 글로우 */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,rgba(255,214,140,0.45),transparent_52%)] mix-blend-screen"
          animate={shouldReduceMotion ? undefined : { opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Layer 3 — 빛 입자 */}
        {!shouldReduceMotion ? (
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            {PARTICLES.map((particle, index) => (
              <motion.span
                key={index}
                className="absolute bottom-[-12px] rounded-full bg-[#ffe7b0] blur-[1px]"
                style={{ left: particle.left, width: particle.size, height: particle.size }}
                animate={{ y: [0, -640], opacity: [0, 0.8, 0] }}
                transition={{
                  duration: particle.duration,
                  delay: particle.delay,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            ))}
          </div>
        ) : null}

        {/* Layer 4 — 옆자리 NPC (책상 vignette, 메인 캐릭터보다 깊고 작게 좌우 배치) */}
        <SceneSlot className="left-[1%] top-[39%] h-[27%] w-[31%]" depthFloat={shouldReduceMotion ? 0 : 0.8}>
          <SceneImage
            asset="/assets/npc/npc_01.png"
            alt="옆자리 NPC 1"
            fitAsset="contain"
            position="object-bottom"
            placeholderLabel="NPC"
            placeholderIcon={UsersRound}
          />
        </SceneSlot>
        <SceneSlot className="right-[1%] top-[42%] h-[25%] w-[29%]" depthFloat={shouldReduceMotion ? 0 : 1}>
          <SceneImage
            asset="/assets/npc/npc_02.png"
            alt="옆자리 NPC 2"
            fitAsset="contain"
            position="object-bottom"
            placeholderLabel="NPC"
            placeholderIcon={UsersRound}
          />
        </SceneSlot>

        {/* Layer 5 — 조교(올빼미, 좌우로 천천히 순찰) */}
        <motion.div
          className="absolute top-[40%] h-[17%] w-[15%]"
          animate={shouldReduceMotion ? { left: "8%" } : { left: ["6%", "76%", "6%"] }}
          transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
        >
          <SceneImage
            asset="/assets/assistant/assistant_walk.png"
            alt="조교 올빼미"
            fitAsset="contain"
            position="object-bottom"
            placeholderLabel="조교"
            placeholderIcon={GraduationCap}
          />
        </motion.div>

        {/* Layer 6 — 메인 캐릭터 (상태별 크로스페이드 + 숨쉬기) */}
        <div className="absolute inset-x-0 bottom-[8%] mx-auto h-[52%] w-[78%]">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={state}
              className="absolute inset-0"
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.98 }}
              animate={
                shouldReduceMotion
                  ? { opacity: 1 }
                  : { opacity: 1, y: [0, -8, 0], scale: 1 }
              }
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }}
              transition={{
                opacity: { duration: 0.5 },
                scale: { duration: 0.5 },
                y: { duration: 4.5, repeat: Infinity, ease: "easeInOut" }
              }}
            >
              <SceneImage
                asset={config.asset}
                fallback={config.fallback}
                alt={`내 캐릭터: ${config.label}`}
                fitAsset="contain"
                fitFallback="contain"
                position="object-bottom"
                placeholderLabel={`내 캐릭터 · ${config.label}`}
                placeholderIcon={config.icon}
                priority
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Layer 7 — 전경 소품 */}
        <SceneSlot className="bottom-[3%] left-[4%] h-[18%] w-[18%]" depthFloat={0}>
          <SceneImage
            asset="/assets/props/prop_plant.png"
            alt="전경 화분"
            fitAsset="contain"
            placeholderLabel="소품"
            placeholderIcon={Sparkles}
          />
        </SceneSlot>

        {/* Layer 8 — 어두워짐(앱 밖) + 깊이감 비네트 */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[#0a0712]"
          animate={{ opacity: config.dim }}
          transition={{ duration: 0.5 }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0c0805]/70 via-transparent to-[#0c0805]/30"
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
              className="max-w-[62%] rounded-2xl rounded-tl-sm bg-[#fff3dd]/95 px-3.5 py-2 text-sm font-bold text-[#352116] shadow-[0_14px_40px_rgba(0,0,0,0.35)]"
            >
              {state === "phone" ? (
                <Phone aria-hidden className="mb-0.5 mr-1 inline h-4 w-4 text-ember-700" />
              ) : null}
              {config.bubble}
            </motion.div>
          </AnimatePresence>

          <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-[#dfbc8a]/40 bg-[#1d1510]/80 px-3 py-2 text-[#fff2dc] backdrop-blur">
            <Timer aria-hidden className="h-4 w-4 text-ember-300" />
            <span className="text-base font-black tabular-nums">25:00</span>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex flex-col items-center gap-1.5 text-center">
          <p className="rounded-full bg-[#1d1510]/80 px-3 py-1 text-xs font-semibold text-[#f5e1bf] backdrop-blur">
            {config.caption}
          </p>
          <p className="text-base font-black text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)] sm:text-lg">
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
              className="pointer-events-none absolute bottom-[16%] left-1/2 -translate-x-1/2 rounded-full bg-[#22372f]/95 px-4 py-2 text-sm font-bold text-teal-100 shadow-lamp"
            >
              조교: “다시 와주셨네요.”
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* 녹화 모드 종료 버튼 */}
        {recordMode ? (
          <button
            type="button"
            onClick={() => setRecordMode(false)}
            aria-label="녹화 모드 종료 (Esc)"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white/80 transition hover:bg-black/60"
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
                    goTo(key);
                  }}
                  className={`flex min-h-11 flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-2 text-xs font-bold transition ${
                    active
                      ? "border-ember-300 bg-ember-400 text-[#2a1710]"
                      : "border-[#3a2b1d] bg-[#1d1510] text-[#e7cda3] hover:border-ember-400"
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
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-ember-400 px-4 text-sm font-bold text-[#28170f] transition hover:bg-ember-300"
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
              className="flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[#3a2b1d] bg-[#1d1510] px-4 text-sm font-bold text-[#e7cda3] transition hover:border-ember-400"
            >
              <Film aria-hidden className="h-4 w-4" />
              녹화 모드
            </button>
          </div>

          <p className="text-center text-xs leading-5 text-[#8a7459]">
            탭을 전환하거나 창을 벗어나면 캐릭터가 실제로 폰을 봐요. ·{" "}
            <span className="text-[#b9a07f]">에셋을 `public/assets/`에 넣으면 자동 교체됩니다.</span>
          </p>
        </div>
      ) : null}
    </main>
  );
}

// 미세하게 떠 있는 슬롯 래퍼.
function SceneSlot({
  className,
  depthFloat,
  children
}: {
  className: string;
  depthFloat: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className={`absolute overflow-hidden ${className}`}
      animate={depthFloat ? { y: [0, -depthFloat * 6, 0] } : undefined}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}

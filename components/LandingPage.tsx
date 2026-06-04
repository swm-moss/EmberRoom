"use client";

import {
  type CSSProperties,
  FormEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { animate, AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import Image from "next/image";
import {
  Bell,
  BookOpen,
  Check,
  ChevronDown,
  Coffee,
  Flame,
  Hand,
  Heart,
  Laptop,
  LogOut,
  Moon,
  MousePointerClick,
  PenLine,
  Phone,
  RotateCcw,
  Send,
  Sparkles,
  Timer,
  Trees,
  Umbrella,
  UsersRound,
  type LucideIcon
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { ScrollProgress } from "@/components/ScrollProgress";
import { AmbientSoundDock } from "@/components/AmbientSoundDock";
import { Magnetic } from "@/components/Magnetic";

type SyncState = "studying" | "phone" | "break" | "complete";

type Choice = {
  value: string;
  label: string;
};

type Theme = {
  title: string;
  description: string;
  image: string;
  fallback: string;
  icon: LucideIcon;
};

type SyncVisual = {
  label: string;
  bubble: string;
  bubbles: string[];
  status: string;
  helper: string;
  image: string;
  icon: LucideIcon;
  fallback: string;
};

const syncStateCopy: Record<SyncState, SyncVisual> = {
  studying: {
    label: "공부 중",
    bubble: "32분째 집중 중!",
    bubbles: ["32분째 집중 중!", "이 페이지만 끝내고 쉴게요.", "오늘 목표까지 조금 남았어요.", "새벽 공부, 생각보다 할 만해요."],
    status: "스탠드 아래에서 조용히 필기 중",
    helper: "내가 모닥방에 머무는 동안 캐릭터도 책상 앞에 앉아 같은 시간을 보내요.",
    image: "/images/character-study.png",
    icon: PenLine,
    fallback: "from-[#43281f] via-[#70513b] to-[#d39a62]"
  },
  phone: {
    label: "폰 보는 중",
    bubble: "앱 밖으로 나갔어요.",
    bubbles: ["앱 밖으로 나갔어요.", "잠깐만 보고 돌아올게요…", "알림 하나만 확인할게요.", "음… 다시 책상으로 가야겠죠?"],
    status: "캐릭터도 슬쩍 폰을 봄",
    helper: "세션 중 앱을 나가면, 방 안의 캐릭터도 고개를 숙이고 폰을 봅니다.",
    image: "/images/character-phone.png",
    icon: Phone,
    fallback: "from-[#1a2432] via-[#4a342a] to-[#d08a47]"
  },
  break: {
    label: "휴식 중",
    bubble: "5분만 따뜻하게 쉬어요.",
    bubbles: ["5분만 따뜻하게 쉬어요.", "따뜻한 거 한 모금.", "스트레칭 한 번 하고 올게요.", "잠깐 숨 고르는 중이에요."],
    status: "따뜻한 컵을 들고 잠깐 쉬는 중",
    helper: "휴식도 방의 리듬이에요. 잠깐 숨을 고르고 다시 작은 불빛 앞으로 돌아옵니다.",
    image: "/images/character-break.png",
    icon: Coffee,
    fallback: "from-[#2c241f] via-[#6f4a31] to-[#f1b66f]"
  },
  complete: {
    label: "완료",
    bubble: "오늘도 한 세션 해냈어요!",
    bubbles: ["오늘도 한 세션 해냈어요!", "방이 조금 더 밝아졌어요.", "내일도 같은 자리에서 만나요.", "스트릭이 하루 늘었어요!"],
    status: "방 안의 불빛이 조금 더 밝아짐",
    helper: "완료한 시간은 점수판보다 책상 위 작은 흔적과 방의 온도로 남습니다.",
    image: "/images/character-complete.png",
    icon: Sparkles,
    fallback: "from-[#2b211d] via-[#7d4f2d] to-[#ffd58a]"
  }
};

const presenceStats = [
  { label: "공부방 테마", value: 6, suffix: "+" },
  { label: "캐릭터 상태 연출", value: 7, suffix: "가지" },
  { label: "옆자리 NPC 친구", value: 5, suffix: "명" },
  { label: "환경음 레이어", value: 3, suffix: "종" }
];

const problemItems = [
  "타이머만 켜두면 방 안이 너무 비어 있다",
  "잠깐 앱을 나갔을 뿐인데 흐름이 끊긴다",
  "실제 사람과 연결되는 공부방은 괜히 부담스럽다",
  "유튜브 Study With Me는 좋지만 나는 화면 밖에 있다",
  "숫자 기록보다 다시 앉고 싶어지는 장면이 필요하다"
];

const solutionCards = [
  {
    title: "앱 밖까지 이어지는 싱크",
    description: "세션 중 앱을 나가면 캐릭터도 책상 앞에서 슬쩍 폰을 봐요.",
    icon: Phone
  },
  {
    title: "혼자 켜도 비지 않는 독서실",
    description: "옆자리 NPC와 조교 NPC가 조용히 머물러 실제 연결 없이도 방이 살아 있어요.",
    icon: UsersRound
  },
  {
    title: "Study With Me 안으로 들어가기",
    description: "새벽 조명, 빗소리, 코딩룸의 키보드 리듬 위에 내 캐릭터가 앉습니다.",
    icon: BookOpen
  }
];

const syncExamples = [
  { label: "집중 시작", description: "스탠드가 켜지고 캐릭터가 앉음", icon: Timer },
  { label: "공부 중", description: "필기와 노트북 작업이 이어짐", icon: PenLine },
  { label: "앱 이탈", description: "캐릭터도 폰을 들여다봄", icon: Phone },
  { label: "휴식", description: "커피를 들고 잠깐 쉬기", icon: Coffee },
  { label: "세션 완료", description: "방 안 불빛이 조금 밝아짐", icon: Sparkles },
  { label: "새벽 시간", description: "조명이 낮아지고 졸린 표정", icon: Moon }
];

const roomThemes: Theme[] = [
  {
    title: "햇살 공부방",
    description: "가볍게 하루를 시작하는 밝은 집중 공간",
    image: "/images/hero-day-study-room.png",
    fallback: "from-[#fff4c8] via-[#d9e8b4] to-[#f0a85f]",
    icon: Trees
  },
  {
    title: "카페 공부방",
    description: "오후 작업과 독서에 어울리는 따뜻한 공간",
    image: "/images/room-cafe.png",
    fallback: "from-[#f7dfb6] via-[#b9d6a2] to-[#c78445]",
    icon: Coffee
  },
  {
    title: "코딩룸",
    description: "노트북 작업에 몰입하기 좋은 저녁 방",
    image: "/images/room-coding.png",
    fallback: "from-[#d7e7c5] via-[#8a7c5e] to-[#c2773e]",
    icon: Laptop
  },
  {
    title: "비 오는 창가",
    description: "차분하게 집중하고 싶은 날",
    image: "/images/room-rain.png",
    fallback: "from-[#bccfd0] via-[#77694d] to-[#d29456]",
    icon: Umbrella
  },
  {
    title: "새벽 독서실",
    description: "늦은 밤에도 혼자 같지 않은 공간",
    image: "/images/room-dawn.png",
    fallback: "from-[#171d2a] via-[#4c372b] to-[#c98a4a]",
    icon: Moon
  }
];

const purposeOptions: Choice[] = [
  { value: "exam", label: "시험공부" },
  { value: "certificate", label: "자격증" },
  { value: "coding", label: "코딩" },
  { value: "reading", label: "독서" },
  { value: "writing", label: "글쓰기" },
  { value: "other", label: "기타" }
];

const expectedFeatureOptions: Choice[] = [
  { value: "character-sync", label: "캐릭터 싱크" },
  { value: "cozy-background", label: "감성 배경" },
  { value: "app-return", label: "앱 이탈 방지" },
  { value: "npc-assistant", label: "조교 NPC" },
  { value: "friend-room", label: "친구방" },
  { value: "study-record", label: "공부 기록" }
];

const roomOptions: Choice[] = [
  { value: "sunny-room", label: "햇살 공부방" },
  { value: "cafe-room", label: "카페 공부방" },
  { value: "coding-room", label: "코딩룸" },
  { value: "rainy-window", label: "비 오는 창가" },
  { value: "dawn-library", label: "새벽 독서실" },
  { value: "winter-room", label: "겨울 자습실" }
];

const paidFeatureOptions: Choice[] = [
  { value: "premium-backgrounds", label: "프리미엄 배경" },
  { value: "desk-custom", label: "캐릭터/책상 꾸미기" },
  { value: "assistant-custom", label: "조교 커스터마이징" },
  { value: "friend-room", label: "친구방" },
  { value: "asmr", label: "환경음/ASMR" },
  { value: "advanced-stats", label: "고급 통계" }
];

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0 }
};

type PointerMotion = {
  active: boolean;
  x: number;
  y: number;
};

const restingPointer: PointerMotion = {
  active: false,
  x: 0,
  y: 0
};

function getRelativePointer(event: ReactPointerEvent<HTMLElement>): PointerMotion {
  const rect = event.currentTarget.getBoundingClientRect();

  return {
    active: true,
    x: ((event.clientX - rect.left) / rect.width - 0.5) * 2,
    y: ((event.clientY - rect.top) / rect.height - 0.5) * 2
  };
}

export function LandingPage() {
  const [syncState, setSyncState] = useState<SyncState>("studying");
  const [selectedTheme, setSelectedTheme] = useState<string>("");
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState("");
  const [leaveDemo, setLeaveDemo] = useState<"idle" | "left" | "returned">("idle");

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("emberroom_selected_theme");
    if (storedTheme) {
      setSelectedTheme(storedTheme);
    }
  }, []);

  useEffect(() => {
    if (leaveDemo !== "returned") {
      return;
    }
    const timer = window.setTimeout(() => setLeaveDemo("idle"), 3200);
    return () => window.clearTimeout(timer);
  }, [leaveDemo]);

  const syncCopy = syncStateCopy[syncState];
  const stateButtons = useMemo(() => Object.keys(syncStateCopy) as SyncState[], []);

  function scrollToId(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleThemeLike(themeTitle: string) {
    window.localStorage.setItem("emberroom_selected_theme", themeTitle);
    setSelectedTheme(themeTitle);
    trackEvent("theme_like_click", { theme: themeTitle });
  }

  function handleSyncStateClick(nextState: SyncState) {
    setSyncState(nextState);
    setLeaveDemo("idle");
    trackEvent("sync_state_click", { state: nextState });
  }

  function handleLeaveApp() {
    setSyncState("phone");
    setLeaveDemo("left");
    trackEvent("leave_app_demo", { source: "button" });
  }

  function handleReturnApp() {
    setSyncState("studying");
    setLeaveDemo("returned");
    trackEvent("return_app_demo", { source: "button" });
  }

  async function handleWaitlistSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitState("submitting");
    setSubmitError("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      email: String(formData.get("email") ?? ""),
      purpose: String(formData.get("purpose") ?? ""),
      expectedFeature: String(formData.get("expectedFeature") ?? ""),
      preferredRoom: String(formData.get("preferredRoom") ?? ""),
      paidFeatures: formData.getAll("paidFeatures").map(String),
      createdAt: new Date().toISOString()
    };

    try {
      const endpoint = process.env.NEXT_PUBLIC_WAITLIST_ENDPOINT;

      if (endpoint) {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error("Waitlist endpoint rejected the request.");
        }
      } else {
        const existing = window.localStorage.getItem("emberroom_waitlist");
        const waitlist = existing ? (JSON.parse(existing) as typeof payload[]) : [];
        waitlist.push(payload);
        window.localStorage.setItem("emberroom_waitlist", JSON.stringify(waitlist));
      }

      trackEvent("waitlist_submit", {
        purpose: payload.purpose,
        expectedFeature: payload.expectedFeature,
        preferredRoom: payload.preferredRoom,
        paidFeatures: payload.paidFeatures
      });
      setSubmitState("success");
      event.currentTarget.reset();
    } catch {
      setSubmitState("error");
      setSubmitError("잠시 후 다시 시도해주세요. endpoint 설정을 확인해도 좋아요.");
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#fff7e8] text-[#3b281d]">
      <ScrollProgress />
      <ReturnToast />
      <AmbientSoundDock />
      <HeroSection scrollToId={scrollToId} />

      <MotionSection id="problem" className="bg-[#fff7e8] pb-14 pt-8 sm:pb-20 sm:pt-12">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 md:grid-cols-[0.9fr_1.1fr] md:items-start">
          <div>
            <p className="text-sm font-semibold text-ember-700">왜 금방 꺼버릴까요?</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight text-[#3b281d] sm:text-4xl">
              혼자 공부할 때 필요한 건 감시보다 곁에 있는 장면입니다.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {problemItems.map((item, index) => (
              <motion.div
                key={item}
                variants={fadeUp}
                className="rounded-2xl border border-[#e4c79f] bg-[#fffdf5] p-4 text-sm leading-6 text-[#6d503b] shadow-[0_18px_50px_rgba(117,78,34,0.12)]"
              >
                <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#f5dbad] text-ember-800">
                  {index + 1}
                </span>
                {item}
              </motion.div>
            ))}
          </div>
        </div>
      </MotionSection>

      <MotionSection className="bg-[#f7ebd7] py-16 sm:py-20">
        <SectionIntro
          eyebrow="모닥방의 다른 점"
          title="공부 앱이 아니라, 켜두는 공부 장면."
          description="마을을 키우거나 누군가와 매칭되는 경험보다, 내 행동과 함께 흔들리는 작은 독서실에 집중했어요."
        />
        <div className="mx-auto mt-10 grid w-full max-w-6xl gap-4 px-5 md:grid-cols-3">
          {solutionCards.map(({ title, description, icon: Icon }) => (
            <motion.article
              whileHover={{ y: -4 }}
              variants={fadeUp}
              key={title}
              className="rounded-3xl border border-[#e2c298] bg-[#fffaf0] p-6 shadow-[0_26px_90px_rgba(117,78,34,0.14)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f2d59c] text-[#8a4617]">
                <Icon aria-hidden className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-xl font-bold text-[#3b281d]">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#7a5a41]">{description}</p>
            </motion.article>
          ))}
        </div>
      </MotionSection>

      <MotionSection id="sync" className="bg-[#fff7e8] py-16 sm:py-20">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-ember-700">앱 밖까지 싱크</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight text-[#3b281d] sm:text-4xl">
              나가면 캐릭터도 흐트러지고, 돌아오면 다시 앉아요.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-8 text-[#715139]">
              모닥방의 차별점은 “차단”이 아니라 장면의 반응입니다. 내가 공부방을 떠난 순간,
              캐릭터도 책상에서 살짝 멀어지고 폰을 봅니다. 다시 돌아오면 방의 리듬도 돌아와요.
            </p>
            <div className="mt-7 grid gap-2 sm:grid-cols-2">
              {syncExamples.map(({ label, description, icon: Icon }) => (
                <div
                  key={label}
                  className="flex items-start gap-3 rounded-2xl border border-[#e1c398] bg-[#fffdf5] p-3 shadow-[0_14px_38px_rgba(117,78,34,0.1)]"
                >
                  <Icon aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-ember-700" />
                  <div>
                    <p className="text-sm font-semibold text-[#3b281d]">{label}</p>
                    <p className="mt-1 text-xs leading-5 text-[#87674b]">{description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-3xl border border-dashed border-ember-400 bg-[#fff3dd] p-5 shadow-[0_18px_50px_rgba(234,111,22,0.12)]">
              <p className="flex items-center gap-2 text-sm font-bold text-ember-800">
                <MousePointerClick aria-hidden className="h-4 w-4" />
                직접 해보기
              </p>
              <p className="mt-2 text-sm leading-6 text-[#6e4f38]">
                버튼을 눌러 앱을 나갔다 와보세요. 오른쪽 캐릭터가 바로 반응합니다.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {leaveDemo === "left" ? (
                  <button
                    type="button"
                    onClick={handleReturnApp}
                    className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full bg-ember-400 px-5 text-sm font-bold text-[#28170f] shadow-lamp transition hover:bg-ember-300"
                  >
                    <RotateCcw aria-hidden className="h-4 w-4" />
                    모닥방으로 돌아가기
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleLeaveApp}
                    className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full border border-[#d4b082] bg-[#fffdf6] px-5 text-sm font-bold text-[#5b3b24] transition hover:border-ember-400"
                  >
                    <LogOut aria-hidden className="h-4 w-4" />
                    앱 나가보기
                  </button>
                )}
                <AnimatePresence mode="wait">
                  {leaveDemo === "left" ? (
                    <motion.span
                      key="left"
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-xs font-semibold text-[#8a674b]"
                    >
                      지금 캐릭터는 책상에서 슬쩍 폰을 보고 있어요.
                    </motion.span>
                  ) : null}
                  {leaveDemo === "returned" ? (
                    <motion.span
                      key="returned"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#22372f] px-3 py-1.5 text-xs font-semibold text-teal-100"
                    >
                      <Sparkles aria-hidden className="h-3.5 w-3.5" />
                      조교: “다시 와주셨네요.”
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#dfbc8a] bg-[#fffaf0] p-3 shadow-[0_30px_100px_rgba(117,78,34,0.18)] sm:p-4">
            <SyncArtwork state={syncState} />
            <div className="mt-5 flex flex-wrap gap-2">
              {stateButtons.map((state) => (
                <button
                  key={state}
                  type="button"
                  onClick={() => handleSyncStateClick(state)}
                  className={`focus-ring min-h-11 rounded-full border px-4 text-sm font-semibold transition ${
                    syncState === state
                      ? "border-ember-200 bg-ember-300 text-[#2a1710] shadow-lamp"
                      : "border-[#d4b082] bg-[#fff7e8] text-[#5b3d29] hover:border-ember-400"
                  }`}
                >
                  {syncStateCopy[state].label}
                </button>
              ))}
            </div>
            <div className="mt-5 rounded-3xl bg-[#f7ead5] p-5">
              <p className="text-sm font-bold text-[#3b281d]">{syncCopy.status}</p>
              <p className="mt-2 text-sm leading-6 text-[#78583f]">{syncCopy.helper}</p>
            </div>
          </div>
        </div>
      </MotionSection>

      <MotionSection id="themes" className="bg-[#f8edd9] py-16 sm:py-20">
        <SectionIntro
          eyebrow="하루의 공부방"
          title="하루의 기분에 맞는 공부방"
          description="아침에는 산뜻하게, 밤에는 포근하게. 오늘의 시간과 기분에 맞는 공부방을 골라보세요."
        />
        <div className="mx-auto mt-10 grid w-full max-w-6xl gap-4 px-5 md:grid-cols-2 lg:grid-cols-5">
          {roomThemes.map((theme) => (
            <motion.article
              variants={fadeUp}
              whileHover={{ y: -4 }}
              key={theme.title}
              className="group flex min-h-[340px] flex-col overflow-hidden rounded-[1.7rem] border border-[#dfbc8a] bg-[#fffaf0] shadow-[0_24px_80px_rgba(117,78,34,0.14)]"
            >
              <ThemeArtwork theme={theme} />
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-lg font-bold text-[#3b281d]">{theme.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-[#76573f]">{theme.description}</p>
                <button
                  type="button"
                  onClick={() => handleThemeLike(theme.title)}
                  className="focus-ring mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#f2dfbd] px-4 text-sm font-semibold text-[#5b3b24] transition hover:bg-ember-400 hover:text-[#2b170e]"
                >
                  {selectedTheme === theme.title ? (
                    <>
                      <Check aria-hidden className="h-4 w-4" />
                      선택 완료
                    </>
                  ) : (
                    <>
                      <Heart aria-hidden className="h-4 w-4" />
                      이 방이 좋아요
                    </>
                  )}
                </button>
              </div>
            </motion.article>
          ))}
        </div>
        {selectedTheme ? (
          <p className="mx-auto mt-5 max-w-6xl px-5 text-sm font-semibold text-ember-800">
            선택 완료: {selectedTheme}
          </p>
        ) : null}
      </MotionSection>

      <NightMoodSection />

      <MotionSection className="bg-[#fff7e8] py-16 sm:py-20">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 lg:grid-cols-[1fr_0.95fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-teal-700">사람 없이도 살아 있는 방</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight text-[#3b281d] sm:text-4xl">
              혼자 켜도 방이 비어 보이지 않아요.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-8 text-[#715139]">
              모닥방의 기본값은 실제 사람 연결이 아니라 NPC 독서실입니다. 옆자리는 조용히
              움직이고, 조교는 가끔 지나가고, 나는 부담 없이 내 책상에 앉아 있으면 됩니다.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "실제 사람과 연결하지 않아도 방이 살아 있다",
              "옆자리 NPC들이 조용히 필기하고 타이핑한다",
              "조교 NPC가 가끔 지나가며 분위기를 잡아준다",
              "빈 화면이 아니라 새벽 독서실 장면이 계속 흐른다",
              "캠스터디보다 덜 부담스럽게 혼자 켤 수 있다"
            ].map((text) => (
              <div
                key={text}
                className="flex items-start gap-3 rounded-2xl border border-[#ddc39e] bg-[#fffdf5] p-4 shadow-[0_14px_38px_rgba(117,78,34,0.1)]"
              >
                <UsersRound aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
                <p className="text-sm leading-6 text-[#76573f]">{text}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mx-auto mt-10 grid w-full max-w-6xl grid-cols-2 gap-3 px-5 sm:grid-cols-4">
          {presenceStats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              className="rounded-3xl border border-[#ddc39e] bg-[#fffaf0] p-5 text-center shadow-[0_14px_38px_rgba(117,78,34,0.1)]"
            >
              <p className="text-3xl font-black text-ember-700 sm:text-4xl">
                <CountUp value={stat.value} suffix={stat.suffix} />
              </p>
              <p className="mt-1.5 text-xs font-semibold text-[#76573f] sm:text-sm">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </MotionSection>

      <MotionSection className="bg-[#f7ebd7] py-16 sm:py-20">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 md:grid-cols-2">
          <FeatureBand
            icon={Trees}
            eyebrow="Quiet Trace"
            title="기록은 점수보다 방의 흔적으로 남아요."
            body="완료한 세션은 책상 위 책갈피, 조금 밝아진 스탠드, 캐릭터 옆의 작은 소품처럼 조용히 쌓입니다."
            points={["랭킹보다 내 방의 분위기를 천천히 바꾸기", "꾸미기는 과시보다 다시 켜고 싶어지는 온도로"]}
          />
          <FeatureBand
            icon={BookOpen}
            eyebrow="Study With Me"
            title="보기만 하던 공부방 영상이 내 방이 됩니다."
            body="새벽 독서실 ASMR, 비 오는 창가, 코딩룸 집중 영상의 감성을 앱 안으로 가져와 내 캐릭터와 NPC가 함께 머무는 장면으로 만듭니다."
            points={["배경음과 방 테마가 한 장면처럼 이어짐", "영상 속 분위기에 내 캐릭터의 상태가 반응함"]}
          />
        </div>
      </MotionSection>

      <MotionSection id="waitlist" className="bg-[#fff7e8] py-16 sm:py-20">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 lg:grid-cols-[0.78fr_1.22fr]">
          <div>
            <p className="text-sm font-semibold text-ember-700">먼저 켜볼 사람들</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight text-[#3b281d] sm:text-4xl">
              가장 먼저 나만의 공부방을 켜보세요.
            </h2>
            <p className="mt-4 text-base leading-8 text-[#715139]">
              어떤 장면이면 오늘 공부할 때 계속 켜두고 싶은지 알려주세요. 모닥방은 그 감각부터
              차근차근 맞춰가려고 합니다.
            </p>
          </div>

          <form
            onSubmit={handleWaitlistSubmit}
            className="rounded-[1.7rem] border border-[#dfbc8a] bg-[#fffaf0] p-5 shadow-[0_26px_90px_rgba(117,78,34,0.14)] sm:p-7"
          >
            <label className="block text-sm font-semibold text-[#3b281d]" htmlFor="email">
              이메일
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="ember@example.com"
              className="focus-ring mt-2 min-h-12 w-full rounded-2xl border border-[#d7b98d] bg-[#fffdf6] px-4 text-base text-[#3b281d] placeholder:text-[#b08b66]"
            />

            <ChoiceGroup title="주 사용 목적" name="purpose" options={purposeOptions} required />
            <ChoiceGroup
              title="가장 기대되는 기능"
              name="expectedFeature"
              options={expectedFeatureOptions}
              required
              onChange={(value) => trackEvent("feature_selected", { feature: value })}
            />
            <ChoiceGroup title="가장 써보고 싶은 방" name="preferredRoom" options={roomOptions} required />
            <CheckboxGroup
              title="유료로 써볼 만한 기능"
              name="paidFeatures"
              options={paidFeatureOptions}
              onChange={(value) => trackEvent("paid_feature_selected", { feature: value })}
            />

            <button
              type="submit"
              disabled={submitState === "submitting"}
              className="focus-ring mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-ember-400 px-5 text-base font-bold text-[#28170f] transition hover:bg-ember-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitState === "submitting" ? (
                "신청 중..."
              ) : (
                <>
                  <Send aria-hidden className="h-4 w-4" />
                  베타 알림 받기
                </>
              )}
            </button>
            {submitState === "success" ? (
              <p className="mt-4 rounded-2xl bg-[#22372f] px-4 py-3 text-sm font-semibold text-teal-100">
                베타 알림 신청이 완료되었습니다. 모닥방에서 만나요.
              </p>
            ) : null}
            {submitState === "error" ? (
              <p className="mt-4 rounded-2xl bg-[#4a2722] px-4 py-3 text-sm font-semibold text-rose-100">
                {submitError}
              </p>
            ) : null}
          </form>
        </div>
      </MotionSection>

      <MotionSection className="bg-[#f8edd9] py-16 sm:py-20">
        <SectionIntro
          eyebrow="FAQ"
          title="자주 묻는 질문"
          description="모닥방은 실제 연결보다, 혼자 켜도 살아 있는 장면을 먼저 만듭니다."
        />
        <div className="mx-auto mt-10 grid w-full max-w-4xl gap-3 px-5">
          {[
            {
              question: "모닥방은 캠스터디인가요?",
              answer: "아니요. 기본은 혼자 켜도 살아 있는 NPC 기반 디지털 독서실입니다."
            },
            {
              question: "실제 사람들과 연결되나요?",
              answer: "기본은 개인 독서실이고, 친구방은 추후 선택 기능으로 제공할 예정입니다."
            },
            {
              question: "앱을 나가면 어떻게 되나요?",
              answer: "세션 중 앱을 나가면 캐릭터도 폰을 보는 상태로 바뀝니다."
            },
            {
              question: "카메라로 감시하나요?",
              answer:
                "아니요. 모닥방은 타이머와 앱 상태를 바탕으로 캐릭터 장면이 바뀌는 방식입니다."
            },
            {
              question: "무료인가요?",
              answer:
                "기본 기능은 무료로 제공하고, 프리미엄 배경·꾸미기·친구방 등은 유료 기능으로 검토 중입니다."
            }
          ].map(({ question, answer }) => (
            <details
              key={question}
              className="group rounded-3xl border border-[#dfbc8a] bg-[#fffaf0] p-5 shadow-[0_14px_38px_rgba(117,78,34,0.1)]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold text-[#3b281d]">
                {question}
                <ChevronDown
                  aria-hidden
                  className="h-5 w-5 shrink-0 text-ember-300 transition group-open:rotate-180"
                />
              </summary>
              <p className="mt-4 text-sm leading-7 text-[#76573f]">{answer}</p>
            </details>
          ))}
        </div>
      </MotionSection>

      <footer className="border-t border-[#e0c198] bg-[#fff7e8] px-5 py-8 text-center text-sm text-[#76573f]">
        <p>EmberRoom — Your cozy focus room.</p>
        <p className="mt-2">모닥방은 작은 불빛처럼 공부 시간을 곁에서 밝혀줍니다.</p>
      </footer>
    </main>
  );
}

function HeroSection({ scrollToId }: { scrollToId: (id: string) => void }) {
  return (
    <section className="relative overflow-hidden bg-[#fff7e8] pb-12 pt-5 sm:min-h-[92svh]">
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_74%_18%,rgba(255,196,92,0.35),transparent_34%),radial-gradient(circle_at_18%_0%,rgba(178,211,154,0.42),transparent_38%),linear-gradient(180deg,#fff9ea_0%,#f5e3c8_100%)]"
        aria-hidden
      />
      <div className="absolute inset-0 room-grid opacity-20" aria-hidden />
      <nav className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ember-400 text-[#2b160f] shadow-[0_12px_35px_rgba(234,111,22,0.28)]">
            <Flame aria-hidden className="h-5 w-5" />
          </span>
          <div>
            <p className="text-base font-bold text-[#3b281d]">모닥방</p>
            <p className="text-xs text-[#8a674b]">EmberRoom</p>
          </div>
        </div>
        <p className="hidden text-sm text-[#76573f] sm:block">EmberRoom — Your cozy focus room.</p>
      </nav>

      <div className="relative z-10 mx-auto grid w-full max-w-6xl gap-8 px-5 py-10 lg:min-h-[calc(92svh-88px)] lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-xl"
        >
          <p className="mb-4 inline-flex rounded-full border border-[#e9bf83] bg-[#fffdf6]/80 px-4 py-2 text-sm font-semibold text-[#8a4a19] shadow-[0_10px_34px_rgba(117,78,34,0.1)] backdrop-blur">
            EmberRoom — Your cozy focus room.
          </p>
          <h1 className="text-4xl font-black leading-tight text-[#3b281d] sm:text-6xl">
            공부가 시작되는
            <br />
            가장 포근한 방식
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-[#6e4f38] sm:text-lg">
            모닥방은 공부할 때 켜놓는 작은 디지털 공부방입니다. 내 캐릭터가 함께 책상에 앉고,
            앱을 나가면 캐릭터도 슬쩍 폰을 봅니다.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Magnetic>
              <button
                type="button"
                onClick={() => {
                  trackEvent("hero_cta_click", { target: "waitlist" });
                  scrollToId("waitlist");
                }}
                className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ember-400 px-6 text-base font-bold text-[#28170f] shadow-[0_14px_40px_rgba(234,111,22,0.28)] transition hover:bg-ember-300"
              >
                <Bell aria-hidden className="h-4 w-4" />
                베타 알림 받기
              </button>
            </Magnetic>
            <button
              type="button"
              onClick={() => {
                trackEvent("secondary_cta_click", { target: "sync" });
                scrollToId("sync");
              }}
              className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#d8b17b] bg-[#fffdf6]/75 px-6 text-base font-bold text-[#5b3b24] backdrop-blur transition hover:border-ember-400"
            >
              <Phone aria-hidden className="h-4 w-4" />
              캐릭터 싱크 보기
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.08 }}
          className="relative"
        >
          <HeroArtwork />
        </motion.div>
      </div>
    </section>
  );
}

function HeroArtwork() {
  const shouldReduceMotion = useReducedMotion();
  const [pointer, setPointer] = useState<PointerMotion>(restingPointer);
  const [isInsideRoom, setIsInsideRoom] = useState(true);
  const motionX = shouldReduceMotion ? 0 : pointer.x;
  const motionY = shouldReduceMotion ? 0 : pointer.y;
  const characterImage = isInsideRoom ? "/images/character-study.png" : "/images/character-phone.png";
  const characterLabel = isInsideRoom ? "방 안" : "앱 밖";
  const characterStatus = isInsideRoom ? "같이 집중 중" : "캐릭터도 폰 보는 중";

  return (
    <motion.div
      className="relative overflow-hidden rounded-[2rem] border border-[#e5bd83] bg-[#fff5dd] shadow-[0_35px_120px_rgba(117,78,34,0.2)]"
      onPointerEnter={() => setIsInsideRoom(true)}
      onPointerMove={(event) => {
        setPointer(getRelativePointer(event));
        setIsInsideRoom(true);
      }}
      onPointerLeave={() => {
        setPointer(restingPointer);
        setIsInsideRoom(false);
      }}
      style={{
        transform: shouldReduceMotion
          ? undefined
          : `perspective(1200px) rotateX(${motionY * -2.5}deg) rotateY(${motionX * 3.5}deg)`
      }}
      transition={{ type: "spring", stiffness: 130, damping: 20 }}
    >
      <Image
        src="/images/hero-day-study-room.png"
        alt="햇살이 들어오는 따뜻한 공부방에서 캐릭터와 NPC들이 함께 공부하는 일러스트"
        width={1672}
        height={941}
        priority
        sizes="(min-width: 1024px) 680px, 100vw"
        className="h-[340px] w-full scale-[1.03] object-cover transition-transform duration-300 sm:h-[470px] lg:h-[610px]"
        style={{
          transform: shouldReduceMotion
            ? undefined
            : `scale(1.05) translate3d(${motionX * -8}px, ${motionY * -6}px, 0)`
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#6c3c16]/28 via-transparent to-transparent" />
      <motion.div
        className="absolute right-4 top-4 flex items-center gap-3 rounded-3xl border border-[#dfbc8a] bg-[#fffaf0]/95 p-3 text-[#3b281d] shadow-[0_18px_60px_rgba(117,78,34,0.18)] backdrop-blur sm:right-6 sm:top-6"
        animate={{
          x: motionX * 12,
          y: motionY * 8
        }}
        transition={{ type: "spring", stiffness: 160, damping: 18 }}
      >
        <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-[#f3dfba]">
          <Image
            src={characterImage}
            alt={`모닥방 캐릭터 미리보기: ${characterStatus}`}
            fill
            sizes="56px"
            className="object-cover"
          />
        </div>
        <div>
          <p className="text-xs font-bold text-ember-800">{characterLabel}</p>
          <p className="mt-1 text-sm font-black text-[#3b281d]">{characterStatus}</p>
        </div>
      </motion.div>
      <motion.div
        className="absolute bottom-4 left-4 right-4 flex flex-col gap-3 rounded-3xl border border-[#dfbc8a] bg-[#fffaf0]/95 p-4 text-[#3b281d] shadow-[0_18px_60px_rgba(117,78,34,0.16)] backdrop-blur sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-sm"
        animate={{
          x: motionX * -8,
          y: motionY * -5
        }}
        transition={{ type: "spring", stiffness: 160, damping: 18 }}
      >
        <p className="text-sm font-bold text-ember-800">앱 밖으로 나가면</p>
        <p className="text-sm font-medium leading-6 text-[#5f422f]">
          화면 속 캐릭터도 책상에서 잠깐 멀어져요. 다시 돌아오면 작은 방의 불빛도 함께 돌아옵니다.
        </p>
      </motion.div>
    </motion.div>
  );
}

function NightMoodSection() {
  return (
    <MotionSection className="bg-[#141821] py-16 text-[#fff2dc] sm:py-24">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
        <motion.div variants={fadeUp}>
          <p className="text-sm font-semibold text-ember-300">밤의 모닥방</p>
          <h2 className="mt-3 text-3xl font-bold leading-tight text-[#fff7ed] sm:text-5xl">
            밤에도,
            <br />
            혼자 같지 않게.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-8 text-[#e8d4b7]">
            비 오는 창가, 조용한 새벽 독서실, 따뜻한 책상 조명. 늦은 시간에도 모닥방에는
            조용히 함께 집중하는 친구들이 있습니다.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {["비 오는 창가", "새벽 독서실", "작은 스탠드", "조용한 NPC"].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-[#6b4d38]/70 bg-[#fff2dc]/[0.06] px-4 py-3 text-sm font-semibold text-[#f5e1bf] backdrop-blur"
              >
                {item}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          variants={fadeUp}
          whileHover={{ y: -4 }}
          className="relative overflow-hidden rounded-[2rem] border border-[#79593e]/80 bg-[#211814] shadow-[0_32px_110px_rgba(0,0,0,0.42)]"
        >
          <Image
            src="/images/night-study-room.png"
            alt="비 오는 밤의 따뜻한 공부방 일러스트"
            width={1672}
            height={941}
            sizes="(min-width: 1024px) 680px, 100vw"
            className="h-[330px] w-full object-cover sm:h-[500px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#11141b]/75 via-transparent to-transparent" />
          <div className="absolute bottom-5 left-5 right-5 rounded-3xl border border-[#f6c98a]/25 bg-[#141821]/70 p-5 backdrop-blur">
            <p className="text-sm font-bold text-ember-200">늦은 시간의 집중</p>
            <p className="mt-2 text-sm leading-6 text-[#f4ddbb]">
              방은 조용하지만 비어 있지 않아요. 옆자리 NPC들이 함께 앉아 오늘의 마지막 페이지를 넘깁니다.
            </p>
          </div>
        </motion.div>
      </div>
    </MotionSection>
  );
}

function ArtworkImage({
  src,
  alt,
  className,
  fallback,
  icon: Icon,
  label,
  imageClassName,
  imageStyle
}: {
  src: string;
  alt: string;
  className: string;
  fallback: string;
  icon: LucideIcon;
  label: string;
  imageClassName?: string;
  imageStyle?: CSSProperties;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${fallback} ${className}`}>
      {imageFailed ? (
        <div className="flex h-full min-h-full w-full flex-col items-center justify-center gap-3 p-6 text-center text-[#fff7ed]">
          <Icon aria-hidden className="h-9 w-9 text-ember-100" />
          <p className="text-sm font-bold">{label}</p>
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 560px, (min-width: 768px) 50vw, 100vw"
          className={`object-cover ${imageClassName ?? ""}`}
          style={imageStyle}
          onError={() => setImageFailed(true)}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#171312]/60 via-transparent to-transparent" />
    </div>
  );
}

function SyncArtwork({ state }: { state: SyncState }) {
  const copy = syncStateCopy[state];
  const Icon = copy.icon;
  const shouldReduceMotion = useReducedMotion();
  const [pointer, setPointer] = useState<PointerMotion>(restingPointer);
  const [bubbleIndex, setBubbleIndex] = useState(0);
  const motionX = shouldReduceMotion ? 0 : pointer.x;
  const motionY = shouldReduceMotion ? 0 : pointer.y;

  useEffect(() => {
    setBubbleIndex(0);
  }, [state]);

  function cycleBubble() {
    setBubbleIndex((prev) => (prev + 1) % copy.bubbles.length);
    trackEvent("speech_bubble_click", { state });
  }

  return (
    <div
      className="relative overflow-hidden rounded-[1.6rem] bg-[#1f1714]"
      onPointerMove={(event) => setPointer(getRelativePointer(event))}
      onPointerLeave={() => setPointer(restingPointer)}
    >
      <motion.div
        key={state}
        initial={{ opacity: 0, scale: 1.03 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
      >
        <ArtworkImage
          src={copy.image}
          alt={`모닥방 캐릭터 상태: ${copy.label}`}
          className="h-[380px] sm:h-[500px]"
          fallback={copy.fallback}
          icon={copy.icon}
          label={copy.label}
          imageClassName="transition-transform duration-200"
          imageStyle={{
            transform: `scale(1.06) translate3d(${motionX * -10}px, ${motionY * -7}px, 0)`
          }}
        />
      </motion.div>
      <motion.button
        type="button"
        onClick={cycleBubble}
        aria-label="캐릭터 말풍선 바꾸기"
        className="focus-ring absolute left-5 top-5 max-w-[78%] text-left"
        animate={{ x: motionX * 10, y: motionY * 7 }}
        transition={{ type: "spring", stiffness: 170, damping: 20 }}
        whileTap={{ scale: 0.94 }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={bubbleIndex}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
            className="block rounded-2xl rounded-bl-sm bg-[#fff3dd]/95 px-4 py-2 text-sm font-bold text-[#352116] shadow-lamp"
          >
            {copy.bubbles[bubbleIndex]}
          </motion.span>
        </AnimatePresence>
        {bubbleIndex === 0 ? (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-1.5 flex items-center gap-1 pl-1 text-[11px] font-semibold text-[#fff3dd]/85"
          >
            <Hand aria-hidden className="h-3 w-3" />
            톡 눌러보세요
          </motion.span>
        ) : null}
      </motion.button>
      <motion.div
        className="absolute bottom-5 left-5 right-5 rounded-3xl border border-[#f6c98a]/25 bg-[#1d1716]/76 p-5 text-[#fff2dc] backdrop-blur"
        animate={{ x: motionX * -8, y: motionY * -6 }}
        transition={{ type: "spring", stiffness: 170, damping: 20 }}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ember-300 text-[#2b170f]">
            <Icon aria-hidden className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold text-ember-200">현재 상태</p>
            <p className="text-lg font-black text-[#fff7ed]">{copy.label}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function CountUp({ value, suffix }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const shouldReduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) {
      return;
    }
    if (shouldReduceMotion) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 1.3,
      ease: "easeOut",
      onUpdate: (latest) => setDisplay(latest)
    });
    return () => controls.stop();
  }, [inView, value, shouldReduceMotion]);

  return (
    <span ref={ref}>
      {Math.round(display)}
      {suffix}
    </span>
  );
}

function ReturnToast() {
  const shouldReduceMotion = useReducedMotion();
  const [show, setShow] = useState(false);
  const leftRef = useRef(false);

  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "hidden") {
        leftRef.current = true;
        return;
      }
      if (leftRef.current) {
        leftRef.current = false;
        setShow(true);
        trackEvent("return_app_demo", { source: "real" });
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    if (!show) {
      return;
    }
    const timer = window.setTimeout(() => setShow(false), 5200);
    return () => window.clearTimeout(timer);
  }, [show]);

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          role="status"
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
          transition={{ type: "spring", stiffness: 240, damping: 24 }}
          className="fixed bottom-24 left-1/2 z-[60] w-[min(92vw,27rem)] -translate-x-1/2 rounded-3xl border border-[#dfbc8a] bg-[#fffaf0]/97 p-4 shadow-[0_26px_90px_rgba(117,78,34,0.26)] backdrop-blur"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-ember-300 text-[#2b170f]">
              <Phone aria-hidden className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-bold text-[#3b281d]">다시 와주셨네요.</p>
              <p className="mt-1 text-xs leading-5 text-[#76573f]">
                방금 앱을 나갔다 오셨죠? 그동안 캐릭터도 책상에서 잠깐 폰을 보고 있었어요.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShow(false)}
              aria-label="알림 닫기"
              className="focus-ring -mr-1 -mt-1 flex h-7 w-7 items-center justify-center rounded-full text-[#8a674b] transition hover:bg-[#f2dfbd]"
            >
              ✕
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function MotionSection({
  id,
  className,
  children
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      id={id}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.18 }}
      transition={{ staggerChildren: 0.08 }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

function SectionIntro({
  eyebrow,
  title,
  description
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <motion.div variants={fadeUp} className="mx-auto max-w-3xl px-5 text-center">
      <p className="text-sm font-semibold text-ember-700">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-bold leading-tight text-[#3b281d] sm:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-8 text-[#76573f]">{description}</p>
    </motion.div>
  );
}

function ThemeArtwork({ theme }: { theme: Theme }) {
  const Icon = theme.icon;

  return (
    <div className="relative">
      <ArtworkImage
        src={theme.image}
        alt={`모닥방 방 테마: ${theme.title}`}
        className="h-44"
        fallback={theme.fallback}
        icon={theme.icon}
        label={theme.title}
        imageClassName="transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff3dd]/90 text-[#2f1d14] shadow-lamp">
        <Icon aria-hidden className="h-5 w-5" />
      </div>
    </div>
  );
}

function FeatureBand({
  icon: Icon,
  eyebrow,
  title,
  body,
  points
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
}) {
  return (
    <motion.article
      variants={fadeUp}
      className="rounded-[1.7rem] border border-[#dfbc8a] bg-[#fffaf0] p-6 shadow-[0_24px_80px_rgba(117,78,34,0.14)] sm:p-8"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d7e7c5] text-teal-800">
        <Icon aria-hidden className="h-5 w-5" />
      </div>
      <p className="mt-6 text-sm font-semibold text-teal-700">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-bold leading-tight text-[#3b281d] sm:text-3xl">{title}</h2>
      <p className="mt-4 text-sm leading-7 text-[#76573f]">{body}</p>
      <div className="mt-5 grid gap-2">
        {points.map((point) => (
          <p key={point} className="flex items-start gap-2 text-sm leading-6 text-[#6e4f38]">
            <Check aria-hidden className="mt-1 h-4 w-4 shrink-0 text-ember-700" />
            {point}
          </p>
        ))}
      </div>
    </motion.article>
  );
}

function ChoiceGroup({
  title,
  name,
  options,
  required = false,
  onChange
}: {
  title: string;
  name: string;
  options: Choice[];
  required?: boolean;
  onChange?: (value: string) => void;
}) {
  return (
    <fieldset className="mt-6">
      <legend className="text-sm font-semibold text-[#3b281d]">{title}</legend>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => (
          <label
            key={option.value}
            className="focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ember-300"
          >
            <input
              className="peer sr-only"
              type="radio"
              name={name}
              value={option.value}
              required={required}
              onChange={() => onChange?.(option.value)}
            />
            <span className="flex min-h-11 cursor-pointer items-center rounded-2xl border border-[#d7b98d] bg-[#fffdf6] px-3 text-sm text-[#6e4f38] transition peer-checked:border-ember-500 peer-checked:bg-[#f5d59c] peer-checked:text-[#2d190f]">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function CheckboxGroup({
  title,
  name,
  options,
  onChange
}: {
  title: string;
  name: string;
  options: Choice[];
  onChange?: (value: string) => void;
}) {
  return (
    <fieldset className="mt-6">
      <legend className="text-sm font-semibold text-[#3b281d]">{title}</legend>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => (
          <label
            key={option.value}
            className="focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ember-300"
          >
            <input
              className="peer sr-only"
              type="checkbox"
              name={name}
              value={option.value}
              onChange={() => onChange?.(option.value)}
            />
            <span className="flex min-h-11 cursor-pointer items-center rounded-2xl border border-[#d7b98d] bg-[#fffdf6] px-3 text-sm text-[#6e4f38] transition peer-checked:border-teal-600 peer-checked:bg-[#d7e7c5] peer-checked:text-[#243424]">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

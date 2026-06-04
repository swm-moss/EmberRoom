"use client";

import { motion, useScroll, useSpring } from "framer-motion";

// 페이지 상단에 스크롤 진행도를 작은 불씨 띠로 표현한다.
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 26,
    restDelta: 0.001
  });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[60] h-1 origin-left bg-gradient-to-r from-[#ffb347] via-[#ea6f16] to-[#ffd58a] shadow-[0_0_18px_rgba(234,111,22,0.55)]"
    />
  );
}

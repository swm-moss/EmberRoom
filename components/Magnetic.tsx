"use client";

import { type ReactNode, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

// 포인터를 따라 살짝 끌려오는 자석 효과 래퍼. CTA 같은 요소에 두른다.
export function Magnetic({
  children,
  strength = 0.35,
  className
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  if (shouldReduceMotion) {
    return <span className={className}>{children}</span>;
  }

  return (
    <motion.span
      ref={ref}
      className={`inline-flex ${className ?? ""}`}
      onPointerMove={(event) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) {
          return;
        }
        setOffset({
          x: (event.clientX - (rect.left + rect.width / 2)) * strength,
          y: (event.clientY - (rect.top + rect.height / 2)) * strength
        });
      }}
      onPointerLeave={() => setOffset({ x: 0, y: 0 })}
      animate={offset}
      transition={{ type: "spring", stiffness: 220, damping: 18, mass: 0.4 }}
    >
      {children}
    </motion.span>
  );
}

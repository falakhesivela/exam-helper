"use client"

import { motion } from "motion/react"

interface ConfettiBurstProps {
  active: boolean
}

const PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  x: (Math.random() - 0.5) * 280,
  y: -(80 + Math.random() * 120),
  rotate: Math.random() * 360,
  color: ["var(--primary)", "var(--success)", "var(--warning)"][i % 3],
  delay: Math.random() * 0.15,
}))

/** Lightweight CSS motion confetti — no external dependency. */
export function ConfettiBurst({ active }: ConfettiBurstProps) {
  if (!active) return null

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 flex justify-center overflow-hidden"
      aria-hidden="true"
    >
      {PARTICLES.map((p) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
          animate={{
            opacity: [1, 1, 0],
            x: p.x,
            y: p.y,
            rotate: p.rotate,
            scale: [1, 0.6],
          }}
          transition={{ duration: 1.2, delay: p.delay, ease: "easeOut" }}
          className="absolute size-2 rounded-sm"
          style={{ backgroundColor: p.color }}
        />
      ))}
    </div>
  )
}

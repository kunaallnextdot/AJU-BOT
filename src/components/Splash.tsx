import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import heroCampusImg from '../assets/images/campus_hero_bg_1791294918467.jpg';

interface SplashProps {
  onComplete: () => void;
}

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

// Timeline (seconds)
const T_WELCOME = 0.35;
const T_AJU = 1.0;
const T_UNIVERSITY = 1.75;
const T_RING_START = 0.6;
const RING_DURATION = 3.6; // exactly one rotation, then the login window takes over
const T_EXIT = T_RING_START + RING_DURATION + 0.15;

const RING_TEXT = 'ARKA JAIN UNIVERSITY • JHARKHAND • AJU BOT • ';

export const Splash: React.FC<SplashProps> = ({ onComplete }) => {
  const reduceMotion = useReducedMotion();
  const [isExiting, setIsExiting] = useState(false);
  const exitStarted = useRef(false);
  // Parent re-renders every clock tick with a fresh callback; keep the timer stable.
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const triggerExit = useCallback(() => {
    if (exitStarted.current) return;
    exitStarted.current = true;
    setIsExiting(true);
    setTimeout(() => onCompleteRef.current(), 750);
  }, []);

  useEffect(() => {
    const timer = setTimeout(triggerExit, (reduceMotion ? 1.6 : T_EXIT) * 1000);
    return () => clearTimeout(timer);
  }, [triggerExit, reduceMotion]);

  // Deterministic star field so it doesn't reshuffle on re-render
  const stars = useMemo(
    () =>
      Array.from({ length: 46 }, (_, i) => {
        const r = (n: number) => { const x = Math.sin(i * 127.1 + n * 311.7) * 43758.5453; return x - Math.floor(x); };
        return { left: r(1) * 100, top: r(2) * 100, size: 1 + r(3) * 2.2, delay: r(4) * 3, duration: 2.4 + r(5) * 3 };
      }),
    []
  );

  return (
    <motion.div
      onClick={triggerExit}
      className="fixed inset-0 z-50 cursor-pointer select-none overflow-hidden bg-[#0a0a0a] text-white"
      title="Click anywhere to continue"
      animate={isExiting ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.7, ease: EASE_OUT, delay: isExiting ? 0.15 : 0 }}
    >
      {/* Campus photo, heavily blurred and slowly zooming */}
      <motion.img
        src={heroCampusImg}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover object-center blur-[10px]"
        initial={{ opacity: 0, scale: 1.25 }}
        animate={{ opacity: 0.32, scale: 1.08 }}
        transition={{ duration: 5, ease: EASE_OUT }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(10,10,10,0.35),rgba(10,10,10,0.92)_70%)]" />

      {/* Aurora blobs */}
      <div className="splash-aurora absolute -left-1/4 top-[-20%] h-[70vmax] w-[70vmax] rounded-full bg-[#171717]/25 blur-[120px]" />
      <div className="splash-aurora-alt absolute -right-1/4 bottom-[-25%] h-[65vmax] w-[65vmax] rounded-full bg-[#3f3f46]/30 blur-[120px]" />

      {/* Perspective grid floor */}
      <div className="splash-grid pointer-events-none absolute inset-x-0 bottom-0 h-[45%] opacity-40" />

      {/* Twinkling particles */}
      {stars.map((s, i) => (
        <span
          key={i}
          className="splash-star absolute rounded-full bg-white"
          style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, animationDelay: `${s.delay}s`, animationDuration: `${s.duration}s` }}
        />
      ))}

      {/* Center stage */}
      <motion.div
        className="relative z-10 flex h-full w-full items-center justify-center"
        animate={isExiting ? { scale: 1.35, filter: 'blur(14px)', opacity: 0 } : { scale: 1, filter: 'blur(0px)', opacity: 1 }}
        transition={{ duration: 0.75, ease: [0.7, 0, 0.84, 0] }}
      >
        {/* Rotating ring: draws in, turns exactly once */}
        <RotatingRing reduceMotion={!!reduceMotion} />

        <div className="relative flex flex-col items-center px-6 text-center" style={{ perspective: 900 }}>
          <StaggerText
            text="WELCOME TO"
            delay={T_WELCOME}
            stagger={0.045}
            className="text-[11px] font-bold tracking-[0.6em] text-green-200/90 sm:text-sm"
          />

          {/* Giant AJU with 3D flip-in */}
          <div className="mt-3 flex drop-shadow-[0_10px_40px_rgba(31,157,85,0.35)] sm:mt-4">
            {'AJU'.split('').map((ch, i) => (
              <motion.span
                key={i}
                className="splash-aju-letter inline-block text-[22vw] font-black leading-[0.9] tracking-[-0.04em] sm:text-[11rem]"
                initial={{ opacity: 0, rotateX: -95, y: 60, filter: 'blur(12px)' }}
                animate={{ opacity: 1, rotateX: 0, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 1.1, ease: EASE_OUT, delay: T_AJU + i * 0.12 }}
                style={{ transformOrigin: '50% 100%' }}
              >
                {ch}
              </motion.span>
            ))}
          </div>

          {/* Light sweep line */}
          <motion.div
            className="mt-2 h-px w-[min(80vw,520px)] bg-gradient-to-r from-transparent via-green-200 to-transparent"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 1.1, ease: EASE_OUT, delay: T_UNIVERSITY - 0.15 }}
          />

          {/* ARKA JAIN UNIVERSITY: letters collapse in from wide tracking */}
          <motion.div
            initial={{ letterSpacing: '0.9em', opacity: 0 }}
            animate={{ letterSpacing: '0.32em', opacity: 1 }}
            transition={{ duration: 1.6, ease: EASE_OUT, delay: T_UNIVERSITY }}
            className="mt-5 pl-[0.32em] text-sm font-extrabold text-white sm:text-2xl"
          >
            <StaggerText text="ARKA JAIN UNIVERSITY" delay={T_UNIVERSITY} stagger={0.035} />
          </motion.div>

          <motion.p
            className="mt-4 text-[8px] font-semibold uppercase tracking-[0.22em] text-white/55 sm:text-xs sm:tracking-[0.35em]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE_OUT, delay: T_UNIVERSITY + 0.9 }}
          >
            Faculty & Academic Operations
          </motion.p>
        </div>
      </motion.div>

      {/* Skip hint */}
      <AnimatePresence>
        {!isExiting && (
          <motion.div
            className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[11px] font-medium tracking-wide text-white/70 backdrop-blur-md"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 2.4, duration: 0.6 }}
          >
            Tap anywhere to skip
            <span className="h-1.5 w-1.5 animate-ping rounded-full bg-green-300" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const StaggerText: React.FC<{ text: string; delay: number; stagger: number; className?: string }> = ({ text, delay, stagger, className }) => (
  <span className={className} aria-label={text}>
    {text.split('').map((ch, i) => (
      <motion.span
        key={i}
        aria-hidden
        className="inline-block"
        initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.7, ease: EASE_OUT, delay: delay + i * stagger }}
      >
        {ch === ' ' ? ' ' : ch}
      </motion.span>
    ))}
  </span>
);

const RotatingRing: React.FC<{ reduceMotion: boolean }> = ({ reduceMotion }) => {
  const r = 46;
  const circumference = 2 * Math.PI * r;
  return (
    <motion.svg
      viewBox="0 0 100 100"
      className="pointer-events-none absolute h-[min(92vw,640px)] w-[min(92vw,640px)]"
      initial={{ opacity: 0, scale: 0.7, rotate: -90 }}
      animate={{ opacity: 1, scale: 1, rotate: reduceMotion ? -90 : 270 }}
      transition={{
        opacity: { duration: 0.8, delay: T_RING_START },
        scale: { duration: 1.4, ease: EASE_OUT, delay: T_RING_START },
        rotate: { duration: RING_DURATION, ease: [0.65, 0, 0.35, 1], delay: T_RING_START },
      }}
    >
      <defs>
        <path id="aju-ring-path" d="M50,50 m-40,0 a40,40 0 1,1 80,0 a40,40 0 1,1 -80,0" />
        <linearGradient id="aju-ring-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#e5e5e5" />
        </linearGradient>
      </defs>

      {/* faint track */}
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" />
      {/* progress arc completes alongside the rotation */}
      <motion.circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="url(#aju-ring-grad)"
        strokeWidth="0.45"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: 0 }}
        transition={{ duration: RING_DURATION, ease: [0.65, 0, 0.35, 1], delay: T_RING_START }}
      />
      {/* orbiting dot at arc head */}
      <circle cx={50 + r} cy="50" r="0.9" fill="#4ade80" className="splash-glow-dot" />

      <text className="fill-white/45" style={{ fontSize: 2.6, fontWeight: 700 }}>
        <textPath href="#aju-ring-path" textLength={2 * Math.PI * 40 - 1} lengthAdjust="spacing">
          {RING_TEXT + RING_TEXT}
        </textPath>
      </text>
    </motion.svg>
  );
};

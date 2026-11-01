import React, { useCallback, useEffect, useRef, useState } from 'react';
import heroCampusImg from '../assets/images/campus_hero_bg_1791294918467.jpg';

interface SplashProps {
  onComplete: () => void;
}

// Pre-dashboard screens use the royal-blue brand palette regardless of workspace theme.
export const BRAND_PRIMARY = '#2563eb';
export const BRAND_DEEP = '#1d4ed8';

const LETTERS = ['A', 'J', 'U', ' ', 'B', 'O', 'T'];

export const WELCOME_MESSAGES = [
  'Welcome to AJU Ops Bot.',
  'Faculty & Academic Operations Assistant at Arka Jain University.',
];

// Timeline (ms). Total ≈ 5.6s: typing starts after the heading settles, each message
// (87 chars in all) is held briefly for reading, and the login opens as soon as the
// last message has been read: 900 + 87×18 + 2×1200 + 300 + 400 ≈ 5.57s.
const SUBTITLE_DELAY = 1000;
const TYPING_START_DELAY = 900;
const TYPE_SPEED = 18; // per character
const HOLD_AFTER_TYPED = 1200; // reading time once a message is fully typed
const FADE_BETWEEN = 300;
const EXIT_FADE = 400;

type Phase = 'waiting' | 'typing' | 'holding' | 'fading';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export const Splash: React.FC<SplashProps> = ({ onComplete }) => {
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [phase, setPhase] = useState<Phase>('waiting');
  const [reduceMotion] = useState(prefersReducedMotion);

  const exitStarted = useRef(false);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Parent re-renders every clock tick with a fresh callback; keep the timer stable.
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Guarded so a tap and the automatic finish can never both open the login.
  const triggerExit = useCallback(() => {
    if (exitStarted.current) return;
    exitStarted.current = true;
    setIsExiting(true);
    exitTimer.current = setTimeout(() => onCompleteRef.current(), EXIT_FADE);
  }, []);

  useEffect(() => {
    const subtitleTimer = setTimeout(() => setShowSubtitle(true), SUBTITLE_DELAY);
    return () => {
      clearTimeout(subtitleTimer);
      if (exitTimer.current) clearTimeout(exitTimer.current);
    };
  }, []);

  // Typewriter state machine: exactly one pending timeout per step, cleared on every change/unmount.
  useEffect(() => {
    if (isExiting) return;
    const message = WELCOME_MESSAGES[messageIndex];
    const isLast = messageIndex === WELCOME_MESSAGES.length - 1;
    let timer: ReturnType<typeof setTimeout>;

    switch (phase) {
      case 'waiting':
        timer = setTimeout(() => setPhase('typing'), TYPING_START_DELAY);
        break;
      case 'typing':
        if (reduceMotion) {
          setCharCount(message.length);
          setPhase('holding');
          return;
        }
        timer =
          charCount < message.length
            ? setTimeout(() => setCharCount((c) => c + 1), TYPE_SPEED)
            : setTimeout(() => setPhase('holding'), 0);
        break;
      case 'holding':
        // After the last message has been read, open the login straight away.
        timer = setTimeout(isLast ? triggerExit : () => setPhase('fading'), HOLD_AFTER_TYPED);
        break;
      case 'fading':
        timer = setTimeout(() => {
          setMessageIndex((i) => i + 1);
          setCharCount(0);
          setPhase('typing');
        }, FADE_BETWEEN);
        break;
    }
    return () => clearTimeout(timer);
  }, [phase, charCount, messageIndex, isExiting, reduceMotion, triggerExit]);

  const currentMessage = WELCOME_MESSAGES[messageIndex];
  const typedText = currentMessage.slice(0, charCount);

  return (
    <div
      onClick={triggerExit}
      className={`fixed inset-0 z-50 flex cursor-pointer select-none items-center justify-center overflow-hidden bg-[#0b1a33] ${isExiting ? 'pointer-events-none' : ''}`}
      title="Click anywhere to continue"
    >
      <img
        src={heroCampusImg}
        alt="AJU Campus View"
        className="absolute inset-0 h-full w-full scale-105 object-cover object-center blur-[8px]"
      />
      {/* Background stays put on exit (and darkens to the login overlay) so the login card lands on the same photo. */}
      <div className={`pointer-events-none absolute inset-0 transition-colors duration-[400ms] ${isExiting ? 'bg-black/30' : 'bg-black/25'}`} />

      <div
        className={`relative z-10 flex flex-col items-center justify-center px-6 text-center transition-all duration-[400ms] ease-out ${isExiting ? '-translate-y-2 opacity-0' : 'translate-y-0 opacity-100'}`}
      >
        <div className="flex items-center justify-center space-x-1 text-[2.75rem] font-extrabold tracking-[0.18em] sm:tracking-[0.22em] drop-shadow-[0_4px_16px_rgba(0,0,0,0.5)] sm:space-x-3 sm:text-7xl">
          {LETTERS.map((ch, i) =>
            ch === ' ' ? (
              <span key={i} className="w-4 sm:w-6" />
            ) : (
              <span
                key={i}
                className="splash-letter inline-block"
                style={{
                  color: BRAND_PRIMARY,
                  textShadow: '0 2px 20px rgba(0,0,0,0.6), 0 0 40px rgba(255,255,255,0.4)',
                  animationDelay: `${i * 100}ms`,
                }}
              >
                {ch}
              </span>
            )
          )}
        </div>

        <div
          className={`mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-white sm:tracking-[0.3em] drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] transition-all duration-700 ease-out sm:mt-5 sm:text-sm ${showSubtitle ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}`}
        >
          Faculty & Academic Operations
        </div>

        {/* Typewriter welcome: fixed height so the layout never jumps between messages */}
        <div className="mt-7 flex min-h-[3.5rem] w-full max-w-[min(90vw,40rem)] items-center justify-center sm:mt-8 sm:min-h-[4rem]">
          <p
            aria-live="polite"
            aria-label={phase === 'waiting' ? undefined : currentMessage}
            className={`text-[15px] font-medium leading-relaxed text-white/95 drop-shadow-[0_2px_10px_rgba(0,0,0,0.75)] transition-opacity sm:text-lg ${phase === 'fading' ? 'opacity-0' : 'opacity-100'} ${phase === 'waiting' ? 'invisible' : ''}`}
            style={{ transitionDuration: `${FADE_BETWEEN}ms` }}
          >
            <span aria-hidden>{typedText}</span>
            <span aria-hidden className="splash-cursor ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.18em] rounded-full bg-white/80" />
          </p>
        </div>

        <div
          className={`mt-6 inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/30 px-3.5 py-1.5 text-[11px] font-medium tracking-wide text-white drop-shadow-md backdrop-blur-md transition-opacity duration-700 sm:mt-8 ${showSubtitle ? 'opacity-90' : 'opacity-0'}`}
        >
          <span>Tap anywhere to launch workspace</span>
          <span className="h-1.5 w-1.5 animate-ping rounded-full bg-white" />
        </div>
      </div>
    </div>
  );
};

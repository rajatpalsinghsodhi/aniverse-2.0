import React, { useState, useRef, useEffect } from 'react';

const TOUCH_ANIM_DURATION_MS = 350;

/** Slide button: on touch, shows animation for 350ms before firing action. On mouse, fires immediately. */
export function SlideButton({
  onClick,
  children,
  className = '',
}: {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  const [pressed, setPressed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handledByTouchRef = useRef(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const btn = btnRef.current;
    if (!btn) return;

    const handleTouchStart = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setPressed(true);
      handledByTouchRef.current = false;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      handledByTouchRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setPressed(false);
        onClick();
      }, TOUCH_ANIM_DURATION_MS);
    };

    btn.addEventListener('touchstart', handleTouchStart, { passive: true });
    btn.addEventListener('touchend', handleTouchEnd, { passive: false });
    return () => {
      btn.removeEventListener('touchstart', handleTouchStart);
      btn.removeEventListener('touchend', handleTouchEnd);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onClick]);

  const handleClick = (e: React.MouseEvent) => {
    if (handledByTouchRef.current) {
      handledByTouchRef.current = false;
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onClick();
  };

  const slideClasses = `absolute inset-0 bg-paper -translate-x-full transition-transform duration-300 ${pressed ? '!translate-x-0' : 'group-hover:translate-x-0 group-active:translate-x-0'}`;
  const textClasses = `relative z-[1] transition-colors flex items-center gap-2 ${pressed ? '!text-ink' : 'group-hover:text-ink group-active:text-ink'}`;

  return (
    <button ref={btnRef} onClick={handleClick} className={className} data-pressed={pressed || undefined}>
      <span className={slideClasses} />
      <span className={textClasses}>{children}</span>
    </button>
  );
}

import { useEffect, useRef, useState } from 'react';

type Props = {
  open: boolean;
  message: string;
  duration?: number; // ms
  onClose: () => void;
  variant?: 'success' | 'error' | 'info';
};

export function AutoDismissModal({ open, message, duration = 3000, onClose, variant = 'success' }: Props) {
  const [visible, setVisible] = useState(open);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  // handle open/close transitions
  useEffect(() => {
    setVisible(open);
    if (!open) return;

    // progress bar animation with RAF
    startRef.current = null;
    const step = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);
      if (pct < 100) {
        rafRef.current = requestAnimationFrame(step);
      }
    };
    rafRef.current = requestAnimationFrame(step);

    // auto close
    timerRef.current = window.setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [open, duration, onClose]);

  if (!visible) return null;

  const palette =
    variant === 'success'
      ? {
          ring: 'ring-emerald-200',
          bgFrom: 'from-emerald-50',
          bgTo: 'to-emerald-100',
          text: 'text-emerald-900',
          bar: 'bg-emerald-500',
          icon: (
            <svg className="w-5 h-5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16Zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.172 7.707 8.879A1 1 0 106.293 10.293l2 2a1 1 0 001.414 0l4-4Z" clipRule="evenodd" />
            </svg>
          ),
        }
      : variant === 'error'
      ? {
          ring: 'ring-red-200',
          bgFrom: 'from-red-50',
          bgTo: 'to-red-100',
          text: 'text-red-900',
          bar: 'bg-red-500',
          icon: (
            <svg className="w-5 h-5 text-red-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16ZM8.707 7.293a1 1 0 10-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 10-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          ),
        }
      : {
          ring: 'ring-sky-200',
          bgFrom: 'from-sky-50',
          bgTo: 'to-sky-100',
          text: 'text-sky-900',
          bar: 'bg-sky-500',
          icon: (
            <svg className="w-5 h-5 text-sky-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path d="M2.003 9.25c-.002-1.01.992-1.69 1.93-1.337l12.01 4.42c1.003.369 1.056 1.775.083 2.229l-3.513 1.64a2 2 0 01-1.705-.02l-7.176-3.54a1.5 1.5 0 01-.83-1.392v-.001z" />
            </svg>
          ),
        };

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={`relative mt-16 w-full max-w-md overflow-hidden rounded-2xl bg-gradient-to-b ${palette.bgFrom} ${
          palette.bgTo
        } shadow-xl ring-1 ${palette.ring} ${palette.text} transition-all duration-200 ease-out animate-[fadeIn_160ms_ease-out]`}
        role="alert"
        aria-live="polite"
      >
        <div className="px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="shrink-0 mt-0.5">{palette.icon}</div>
            <div className="min-w-0">
              <p className="text-[13px] tracking-tight text-slate-500">알림</p>
              <p className="mt-0.5 text-sm font-semibold leading-5">{message}</p>
            </div>
            <button
              onClick={onClose}
              aria-label="닫기"
              className="ml-auto -mr-1 rounded-md p-1.5 text-slate-500 hover:bg-white/60 hover:text-slate-700 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        {/* progress bar */}
        <div className="absolute bottom-0 left-0 right-0">
          <div
            className={`h-0.5 ${palette.bar} transition-[width] duration-100 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

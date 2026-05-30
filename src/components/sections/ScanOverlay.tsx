"use client";

import { useEffect, useState } from "react";

export function ScanOverlay({
  open,
  label,
  onDone,
  durationMs = 1700,
}: {
  open: boolean;
  label: string;
  onDone?: () => void;
  durationMs?: number;
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!open) return;

    const frame = window.requestAnimationFrame(() => setProgress(0));
    const start = Date.now();
    const tick = window.setInterval(() => {
      const next = Math.min(1, (Date.now() - start) / durationMs);
      setProgress(next);
      if (next >= 1) {
        window.clearInterval(tick);
        onDone?.();
      }
    }, 16);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(tick);
    };
  }, [durationMs, onDone, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[rgba(5,10,12,0.92)] backdrop-blur-sm">
      <div className="relative w-[min(680px,92vw)] overflow-hidden rounded-[28px] bg-[linear-gradient(180deg,rgba(12,20,24,0.92),rgba(6,10,12,0.92))] p-8 shadow-[0_30px_90px_rgba(0,0,0,0.45)] ring-1 ring-[rgba(255,255,255,0.08)]">
        <div className="absolute inset-0 opacity-90">
          <div className="absolute -inset-40 bg-[radial-gradient(closest-side,rgba(31,183,173,0.25),transparent_70%)]" />
          <div className="absolute inset-x-0 -top-24 h-48 bg-[linear-gradient(90deg,transparent,rgba(31,183,173,0.45),transparent)] blur-2xl" />
        </div>
        <div className="relative">
          <p className="font-display text-2xl font-semibold tracking-[-0.03em] text-white">
            {label}
          </p>
          <p className="mt-2 text-sm leading-6 text-[rgba(255,255,255,0.72)]">
            Mapping topografi tubuh · Aligning posture · Synthesizing lighting
          </p>

          <div className="mt-7 h-2 overflow-hidden rounded-full bg-[rgba(255,255,255,0.10)]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#1fb7ad,#0ea5a7)] transition-[width] duration-150"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-[rgba(255,255,255,0.04)] p-4 ring-1 ring-[rgba(255,255,255,0.08)]">
              <p className="text-xs uppercase tracking-[0.22em] text-[rgba(255,255,255,0.6)]">
                AuraFit Scan
              </p>
              <p className="mt-2 text-sm text-[rgba(255,255,255,0.88)]">
                Matte black + tosca signal
              </p>
            </div>
            <div className="rounded-2xl bg-[rgba(255,255,255,0.04)] p-4 ring-1 ring-[rgba(255,255,255,0.08)]">
              <p className="text-xs uppercase tracking-[0.22em] text-[rgba(255,255,255,0.6)]">
                Progress
              </p>
              <p className="mt-2 font-display text-lg font-semibold tracking-[-0.02em] text-white">
                {Math.round(progress * 100)}%
              </p>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-[linear-gradient(90deg,transparent,rgba(31,183,173,0.5),transparent)]" />
        </div>
      </div>
    </div>
  );
}

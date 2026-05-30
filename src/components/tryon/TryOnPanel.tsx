"use client";

import { useMemo, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ScanOverlay } from "@/components/sections/ScanOverlay";
import { readOnboardingDraft } from "@/lib/onboardingStorage";

export function TryOnPanel({ productId, productName }: { productId: string; productName: string }) {
  const [scanOpen, setScanOpen] = useState(false);
  const [resultReady, setResultReady] = useState(false);
  const [view, setView] = useState<"mannequin" | "you">("mannequin");
  const [resultVideoUrl, setResultVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onboardingOk = useMemo(() => {
    const draft = readOnboardingDraft();
    if (!draft) return false;
    return (
      Boolean(draft.heightCm) &&
      Boolean(draft.ageYears) &&
      Boolean(draft.weightKg) &&
      Boolean(draft.userProfileId) &&
      Boolean(draft.photos.front)
    );
  }, []);

  const canTryOn = onboardingOk;

  return (
    <div className="rounded-3xl bg-surface p-7 shadow-soft ring-1 ring-border">
      <ScanOverlay
        open={scanOpen}
        label="Generating try-on"
        durationMs={6400}
      />

      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted">Magic button</p>
          <p className="mt-3 font-display text-2xl font-semibold tracking-[-0.03em] text-foreground">
            Put You As A Model
          </p>
          <p className="mt-3 text-sm leading-6 text-muted">
            Mode simulasi: setelah klik tombol, tampilan manekin diganti dengan hasil generatif (placeholder).
          </p>
        </div>
        {resultReady ? (
          <div className="flex items-center gap-2 rounded-full bg-surface-2 p-1 ring-1 ring-border">
            <button
              onClick={() => setView("mannequin")}
              className={[
                "h-9 rounded-full px-4 text-sm font-medium transition-colors",
                view === "mannequin"
                  ? "bg-surface text-foreground shadow-soft ring-1 ring-border"
                  : "text-muted hover:text-foreground",
              ].join(" ")}
            >
              Before
            </button>
            <button
              onClick={() => setView("you")}
              className={[
                "h-9 rounded-full px-4 text-sm font-medium transition-colors",
                view === "you"
                  ? "bg-surface text-foreground shadow-soft ring-1 ring-border"
                  : "text-muted hover:text-foreground",
              ].join(" ")}
            >
              After
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-6">
        {!canTryOn ? (
          <div className="rounded-3xl bg-surface-2 p-5 ring-1 ring-border">
            <p className="text-sm font-medium text-foreground">Onboarding belum lengkap.</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Isi bio-metrics dan upload 1 foto tampak depan dulu supaya sistem bisa membuat profil AI kamu.
            </p>
            <div className="mt-4">
              <ButtonLink href="/onboarding" variant="primary">
                Lengkapi onboarding
              </ButtonLink>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <Button
              onClick={async () => {
                const draft = readOnboardingDraft();
                if (!draft?.userProfileId) return;

                setError(null);
                setResultReady(false);
                setResultVideoUrl(null);
                setView("mannequin");
                setScanOpen(true);

                try {
                  const res = await fetch("/api/tryon", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                      user_profile_id: draft.userProfileId,
                      product_id: productId,
                    }),
                  });
                  if (!res.ok) {
                    const body = (await res.json().catch(() => null)) as { message?: string } | null;
                    throw new Error(body?.message ?? "Gagal generate try-on.");
                  }
                  const body = (await res.json()) as { video_url: string };
                  setResultVideoUrl(body.video_url);
                  setResultReady(true);
                  setView("you");
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Gagal generate try-on.");
                } finally {
                  setScanOpen(false);
                }
              }}
              size="lg"
            >
              Generate: {productName}
            </Button>
            <p className="text-xs leading-5 text-muted">
              Output nanti akan diganti ke video PixVerse (placeholder dulu).
            </p>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>
        )}
      </div>

      <div className="mt-7 overflow-hidden rounded-3xl ring-1 ring-border">
        <div className="relative aspect-[16/10] bg-[linear-gradient(135deg,#ffffff,#eef2f7)]">
          <div className="absolute inset-0 bg-[radial-gradient(closest-side,rgba(31,183,173,0.22),transparent_62%)] opacity-70" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,transparent,rgba(11,14,18,0.10))]" />
          <div className="absolute left-6 top-6 rounded-full bg-[rgba(255,255,255,0.75)] px-3 py-1 text-[11px] font-medium tracking-[-0.01em] text-foreground ring-1 ring-border">
            {view === "you" && resultReady ? "AI Output (placeholder)" : "Mannequin (default)"}
          </div>

          {view === "you" && resultReady ? (
            <div className="absolute inset-0">
              {resultVideoUrl ? (
                <video
                  className="absolute inset-0 h-full w-full object-cover"
                  src={resultVideoUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                />
              ) : null}
              <div className="absolute inset-0 bg-[radial-gradient(closest-side,rgba(31,183,173,0.22),transparent_60%)]" />
              <div className="absolute inset-x-0 bottom-6 grid place-items-center">
                <div className="rounded-full bg-[rgba(31,183,173,0.12)] px-5 py-2 text-sm font-medium text-[rgba(8,79,76,0.92)] ring-1 ring-[rgba(31,183,173,0.25)]">
                  Generated look: you wearing {productName}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

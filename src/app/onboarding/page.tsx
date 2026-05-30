"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { ScanOverlay } from "@/components/sections/ScanOverlay";
import { writeOnboardingDraft } from "@/lib/onboardingStorage";

export default function OnboardingPage() {
  const router = useRouter();
  const [heightCm, setHeightCm] = useState("");
  const [ageYears, setAgeYears] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [waistCm, setWaistCm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [frontPhoto, setFrontPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);

  const isComplete = useMemo(() => {
    const requiredOk =
      Number(heightCm) > 0 && Number(ageYears) > 0 && Number(weightKg) > 0;
    const photosOk = Boolean(frontPhoto);
    return requiredOk && photosOk && !submitting;
  }, [ageYears, frontPhoto, heightCm, submitting, weightKg]);

  async function onSubmit() {
    if (!isComplete) return;
    if (!frontPhoto) return;

    setSubmitting(true);
    setScanOpen(true);

    try {
      setError(null);
      const fd = new FormData();
      fd.append("heightCm", heightCm);
      fd.append("ageYears", ageYears);
      fd.append("weightKg", weightKg);
      if (waistCm) fd.append("waistCm", waistCm);
      fd.append("front", frontPhoto);

      const res = await fetch("/api/onboarding/submit", { method: "POST", body: fd });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? "Gagal submit onboarding.");
      }

      const body = (await res.json()) as {
        user_profile_id: string;
        photo_urls: { front: string; back: string; right: string; left: string };
        video_url?: string;
        recommended_size?: "S" | "M" | "L" | "XL";
      };

      writeOnboardingDraft({
        userProfileId: body.user_profile_id,
        heightCm: Number(heightCm),
        ageYears: Number(ageYears),
        weightKg: Number(weightKg),
        waistCm: waistCm ? Number(waistCm) : undefined,
        recommendedSize: body.recommended_size,
        profileVideoUrl: body.video_url,
        photos: body.photo_urls,
        createdAt: new Date().toISOString(),
      });

      router.push("/catalog");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal submit onboarding.");
    } finally {
      setScanOpen(false);
      setSubmitting(false);
    }
  }

  return (
    <>
      <ScanOverlay
        open={scanOpen}
        label="Membuat profil AI kamu"
        durationMs={7200}
      />

      <div className="flex-1 bg-background">
        <Container className="py-12">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-muted">
                AuraFit AI · Onboarding
              </p>
              <h1 className="mt-4 font-display text-4xl font-semibold tracking-[-0.04em] text-foreground">
                Bio-metrics & foto tampak depan
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
                Isi data tubuh dan upload 1 foto tampak depan. Setelah itu AuraFit akan membuat video
                profil kamu dan merekomendasikan ukuran (S/M/L/XL).
              </p>
            </div>
            <div className="hidden md:block">
              <div className="rounded-3xl bg-surface px-5 py-4 shadow-soft ring-1 ring-border">
                <p className="text-xs uppercase tracking-[0.22em] text-muted">Tips</p>
                <p className="mt-2 text-sm leading-6 text-foreground">
                  Gunakan pencahayaan rata, latar polos, dan posisi kamera setinggi dada.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl bg-surface p-7 shadow-soft ring-1 ring-border">
              <p className="text-sm font-medium tracking-[-0.01em] text-foreground">
                Bio-metrics
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm text-muted">Tinggi (cm)</span>
                  <input
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    inputMode="numeric"
                    className="h-11 rounded-2xl bg-surface-2 px-4 text-sm text-foreground ring-1 ring-border outline-none focus:ring-2 focus:ring-ring"
                    placeholder="175"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm text-muted">Usia</span>
                  <input
                    value={ageYears}
                    onChange={(e) => setAgeYears(e.target.value)}
                    inputMode="numeric"
                    className="h-11 rounded-2xl bg-surface-2 px-4 text-sm text-foreground ring-1 ring-border outline-none focus:ring-2 focus:ring-ring"
                    placeholder="28"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm text-muted">Berat (kg)</span>
                  <input
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    inputMode="numeric"
                    className="h-11 rounded-2xl bg-surface-2 px-4 text-sm text-foreground ring-1 ring-border outline-none focus:ring-2 focus:ring-ring"
                    placeholder="70"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm text-muted">Lingkar pinggang (opsional)</span>
                  <input
                    value={waistCm}
                    onChange={(e) => setWaistCm(e.target.value)}
                    inputMode="numeric"
                    className="h-11 rounded-2xl bg-surface-2 px-4 text-sm text-foreground ring-1 ring-border outline-none focus:ring-2 focus:ring-ring"
                    placeholder="82"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-3xl bg-surface p-7 shadow-soft ring-1 ring-border">
              <p className="text-sm font-medium tracking-[-0.01em] text-foreground">
                Foto tampak depan
              </p>
              <div className="mt-5">
                <label className="group grid gap-2 rounded-3xl bg-surface-2 p-4 ring-1 ring-border transition-colors hover:bg-[rgba(31,183,173,0.08)]">
                  <span className="text-sm text-foreground">Depan</span>
                  <span className="text-xs text-muted">
                    {frontPhoto ? frontPhoto.name : "Pilih file foto"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="block w-full text-xs text-muted file:mr-3 file:rounded-full file:border-0 file:bg-surface file:px-4 file:py-2 file:text-xs file:font-medium file:text-foreground file:shadow-soft file:ring-1 file:ring-border"
                    onChange={(e) => setFrontPhoto(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>

              <div className="mt-7 flex items-center justify-between gap-4">
                <p className="text-xs leading-5 text-muted">
                  Tombol aktif setelah data + foto lengkap.
                </p>
                <Button onClick={onSubmit} disabled={!isComplete} size="lg">
                  Generate profil
                </Button>
              </div>
              {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}

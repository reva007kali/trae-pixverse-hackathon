export type OnboardingDraft = {
  userProfileId?: string;
  heightCm: number;
  ageYears: number;
  weightKg: number;
  waistCm?: number;
  recommendedSize?: "S" | "M" | "L" | "XL";
  profileVideoUrl?: string;
  photos: {
    front?: string;
    back?: string;
    right?: string;
    left?: string;
  };
  createdAt: string;
};

const key = "aurafit:onboarding:v1";

export function readOnboardingDraft(): OnboardingDraft | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OnboardingDraft;
  } catch {
    return null;
  }
}

export function writeOnboardingDraft(draft: OnboardingDraft) {
  window.localStorage.setItem(key, JSON.stringify(draft));
}

export function clearOnboardingDraft() {
  window.localStorage.removeItem(key);
}

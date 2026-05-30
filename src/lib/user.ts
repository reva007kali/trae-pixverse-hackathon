export const USER_STORAGE_KEY = "aurafit:user:v1";

export type UserIdentity = {
  name: string;
  email: string;
  avatar_seed: string;
};

export function readUserFromStorage(): UserIdentity | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<UserIdentity>;
    if (!parsed?.name || !parsed?.email || !parsed?.avatar_seed) return null;
    return { name: parsed.name, email: parsed.email, avatar_seed: parsed.avatar_seed };
  } catch {
    return null;
  }
}

export function writeUserToStorage(user: UserIdentity) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function clearUserStorage() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(USER_STORAGE_KEY);
}

export function initialsFromName(name: string) {
  const cleaned = name.trim();
  if (!cleaned) return "U";
  const parts = cleaned.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("") || "U";
}

export function avatarGradientFromSeed(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 360;
  }
  const hueA = hash;
  const hueB = (hash + 28) % 360;
  return `linear-gradient(135deg, hsl(${hueA} 84% 56%), hsl(${hueB} 84% 60%))`;
}


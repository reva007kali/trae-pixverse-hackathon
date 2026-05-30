export const USER_SESSION_COOKIE = "aurafit_user_session";

export function getUserSessionId(cookieStore: { get(name: string): { value: string } | undefined }) {
  const raw = cookieStore.get(USER_SESSION_COOKIE)?.value ?? "";
  return raw.trim().length > 0 ? raw : null;
}


"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Container } from "@/components/layout/Container";
import { TopNav } from "@/components/layout/TopNav";
import { Button } from "@/components/ui/Button";
import { writeUserToStorage } from "@/lib/user";

export default function LoginPage() {
  const router = useRouter();
  const [nextPath, setNextPath] = useState("/");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const frame = window.requestAnimationFrame(() => {
      setNextPath(params.get("next") ?? "/");
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/user/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Login gagal.");
      }

      const body = (await res.json()) as {
        user: { name: string; email: string; avatar_seed: string };
      };
      writeUserToStorage(body.user);
      router.push(nextPath);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 bg-background">
      <TopNav />
      <Container className="py-16">
        <div className="mx-auto max-w-lg overflow-hidden rounded-[34px] bg-surface shadow-soft ring-1 ring-border">
          <div className="relative p-9">
            <div className="pointer-events-none absolute -inset-32 bg-[radial-gradient(closest-side,rgba(31,183,173,0.20),transparent_70%)] opacity-70" />
            <div className="relative">
              <p className="text-xs uppercase tracking-[0.22em] text-muted">Account</p>
              <h1 className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] text-foreground">
                Sign in to shop
              </h1>
              <p className="mt-3 text-sm leading-6 text-muted">
                Dummy login untuk prototype. Setelah masuk, kamu bisa add to cart & checkout.
              </p>

              <form onSubmit={onSubmit} className="mt-8 grid gap-4">
                <label className="grid gap-2">
                  <span className="text-sm text-muted">Name</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-11 rounded-2xl bg-surface-2 px-4 text-sm text-foreground ring-1 ring-border outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Aura Shopper"
                    autoComplete="name"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm text-muted">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 rounded-2xl bg-surface-2 px-4 text-sm text-foreground ring-1 ring-border outline-none focus:ring-2 focus:ring-ring"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </label>

                {error ? <p className="text-sm text-red-600">{error}</p> : null}

                <Button type="submit" size="lg" disabled={!name.trim() || !email.trim() || loading}>
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}


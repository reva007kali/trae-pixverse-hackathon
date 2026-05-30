"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";

export default function AdminLoginPage() {
  const router = useRouter();
  const [nextPath, setNextPath] = useState("/admin/products");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const frame = window.requestAnimationFrame(() => {
      setNextPath(params.get("next") ?? "/admin/products");
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? "Login gagal.");
      }

      router.push(nextPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 bg-background">
      <Container className="py-16">
        <div className="mx-auto max-w-md rounded-[34px] bg-surface p-8 shadow-soft ring-1 ring-border">
          <p className="text-xs uppercase tracking-[0.22em] text-muted">Admin</p>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] text-foreground">
            Dummy login
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Masukkan password admin untuk mengakses halaman manage products.
          </p>

          <form onSubmit={onSubmit} className="mt-8 grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm text-muted">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-2xl bg-surface-2 px-4 text-sm text-foreground ring-1 ring-border outline-none focus:ring-2 focus:ring-ring"
                placeholder="••••••••"
              />
            </label>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <Button type="submit" size="lg" disabled={!password || loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </div>
      </Container>
    </div>
  );
}

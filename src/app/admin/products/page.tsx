"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Container } from "@/components/layout/Container";
import { TopNav } from "@/components/layout/TopNav";
import { Button } from "@/components/ui/Button";

type ProductRow = {
  id: string;
  category: string;
  name: string;
  brand: string;
  price_cents: number;
  currency: string;
  description: string;
  fit_notes: string;
  tags: unknown;
  mannequin_media_urls: unknown;
  created_at: string;
};

type Draft = {
  id?: string;
  category: string;
  name: string;
  brand: string;
  price_cents: string;
  currency: string;
  description: string;
  fit_notes: string;
  tagsCsv: string;
};

const categories = ["sport", "casual", "woman", "man", "kids"];

function toTagsCsv(tags: unknown): string {
  if (Array.isArray(tags)) return tags.join(", ");
  return "";
}

function safeFirstImage(urls: unknown): string | null {
  if (!Array.isArray(urls)) return null;
  const first = urls.find((value) => typeof value === "string" && value.trim().length > 0);
  return typeof first === "string" ? first : null;
}

export default function AdminProductsPage() {
  const [items, setItems] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingImageUrl, setEditingImageUrl] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({
    category: "sport",
    name: "",
    brand: "",
    price_cents: "",
    currency: "USD",
    description: "",
    fit_notes: "",
    tagsCsv: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const localPreviewUrl = useMemo(() => {
    if (!imageFile) return null;
    return URL.createObjectURL(imageFile);
  }, [imageFile]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((p) => {
      return (
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [items, query]);

  const totalCountLabel = useMemo(() => {
    return `${items.length}`;
  }, [items.length]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/products", { cache: "no-store" });
      if (!res.ok) throw new Error("Gagal load products.");
      const body = (await res.json()) as { items: ProductRow[] };
      setItems(body.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal load products.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void load();
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    return () => {
      if (!localPreviewUrl) return;
      URL.revokeObjectURL(localPreviewUrl);
    };
  }, [localPreviewUrl]);

  const resetDraft = useCallback(() => {
    setDraft({
      category: "sport",
      name: "",
      brand: "",
      price_cents: "",
      currency: "USD",
      description: "",
      fit_notes: "",
      tagsCsv: "",
    });
    setImageFile(null);
    setEditingImageUrl(null);
  }, []);

  function startEdit(p: ProductRow) {
    setDraft({
      id: p.id,
      category: p.category,
      name: p.name,
      brand: p.brand,
      price_cents: String(p.price_cents),
      currency: p.currency,
      description: p.description,
      fit_notes: p.fit_notes,
      tagsCsv: toTagsCsv(p.tags),
    });
    setImageFile(null);
    setEditingImageUrl(safeFirstImage(p.mannequin_media_urls));
    setError(null);
    setIsModalOpen(true);
  }

  const openCreate = useCallback(() => {
    resetDraft();
    setError(null);
    setIsModalOpen(true);
  }, [resetDraft]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setError(null);
    resetDraft();
  }, [resetDraft]);

  useEffect(() => {
    if (!isModalOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeModal, isModalOpen]);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const tags = draft.tagsCsv
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        category: draft.category,
        name: draft.name,
        brand: draft.brand,
        price_cents: Number(draft.price_cents || 0),
        currency: draft.currency,
        description: draft.description,
        fit_notes: draft.fit_notes,
        tags,
      };

      if (!payload.name || !payload.brand || !payload.category) {
        throw new Error("Category, name, dan brand wajib diisi.");
      }

      if (draft.id) {
        const res = await fetch(`/api/admin/products/${draft.id}`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Gagal update product.");

        if (imageFile) {
          const fd = new FormData();
          fd.append("file", imageFile);
          const uploadRes = await fetch(`/api/admin/products/${draft.id}/image`, {
            method: "POST",
            body: fd,
          });
          if (!uploadRes.ok) {
            const body = (await uploadRes.json().catch(() => null)) as { message?: string } | null;
            throw new Error(body?.message ?? "Gagal upload image.");
          }
        }
      } else {
        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Gagal create product.");
        const body = (await res.json()) as { id: string };

        if (imageFile) {
          const fd = new FormData();
          fd.append("file", imageFile);
          const uploadRes = await fetch(`/api/admin/products/${body.id}/image`, {
            method: "POST",
            body: fd,
          });
          if (!uploadRes.ok) {
            const body = (await uploadRes.json().catch(() => null)) as { message?: string } | null;
            throw new Error(body?.message ?? "Gagal upload image.");
          }
        }
      }

      await load();
      resetDraft();
      setIsModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal simpan.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    const ok = window.confirm("Hapus produk ini?");
    if (!ok) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal hapus product.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal hapus product.");
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  async function resetDemo() {
    const ok = window.confirm("Reset demo? Semua products akan dihapus lalu dibuat ulang 26 items.");
    if (!ok) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/products/reset-demo", { method: "POST" });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? "Gagal reset demo.");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal reset demo.");
    } finally {
      setSaving(false);
    }
  }

  async function purgeImages() {
    const ok = window.confirm("Hapus semua images di Storage product-images/products? Ini tidak bisa di-undo.");
    if (!ok) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/products/purge-images", { method: "POST" });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? "Gagal hapus images.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal hapus images.");
    } finally {
      setSaving(false);
    }
  }

  async function generateImage(id: string) {
    setGenerating((p) => ({ ...p, [id]: true }));
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/${id}/generate-image`, { method: "POST" });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? "Gagal generate image.");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal generate image.");
    } finally {
      setGenerating((p) => {
        const next = { ...p };
        delete next[id];
        return next;
      });
    }
  }

  return (
    <div className="flex-1 bg-background">
      <TopNav />

      <Container className="py-10">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted">Admin</p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-0.04em] text-foreground">
              Manage products
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              CRUD sederhana untuk prototype. Upload image akan disimpan ke Supabase Storage.
            </p>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <button
              type="button"
              onClick={resetDemo}
              disabled={saving}
              className="h-10 rounded-full bg-[rgba(31,183,173,0.12)] px-4 text-sm font-medium text-[rgba(8,79,76,0.92)] ring-1 ring-[rgba(31,183,173,0.22)] transition-colors hover:bg-[rgba(31,183,173,0.16)] disabled:opacity-60"
            >
              {saving ? "Resetting…" : "Reset demo (26)"}
            </button>
            <button
              type="button"
              onClick={purgeImages}
              disabled={saving}
              className="h-10 rounded-full bg-[rgba(239,68,68,0.10)] px-4 text-sm font-medium text-red-700 ring-1 ring-[rgba(239,68,68,0.22)] transition-colors hover:bg-[rgba(239,68,68,0.14)] disabled:opacity-60"
            >
              Purge images
            </button>
            <button
              type="button"
              onClick={logout}
              disabled={saving}
              className="h-10 rounded-full bg-surface px-4 text-sm font-medium text-foreground shadow-soft ring-1 ring-border transition-colors hover:bg-surface-2 disabled:opacity-60"
            >
              Logout
            </button>
            <div className="rounded-3xl bg-surface px-5 py-4 shadow-soft ring-1 ring-border">
              <p className="text-xs uppercase tracking-[0.22em] text-muted">Total</p>
              <p className="mt-2 font-display text-lg font-semibold tracking-[-0.02em] text-foreground">
                {totalCountLabel}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-[34px] bg-surface p-7 shadow-soft ring-1 ring-border">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-medium tracking-[-0.01em] text-foreground">Product list</p>
              <div className="inline-flex items-center gap-2 rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-muted ring-1 ring-border">
                Total {totalCountLabel}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name/brand/category..."
                className="h-11 w-full rounded-2xl bg-surface-2 px-4 text-sm text-foreground ring-1 ring-border outline-none focus:ring-2 focus:ring-ring sm:w-[340px]"
              />
              <Button size="md" onClick={openCreate} disabled={saving}>
                New product
              </Button>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            {loading ? (
              <p className="text-sm text-muted">Loading…</p>
            ) : filtered.length ? (
              filtered.map((p) => {
                const thumb = safeFirstImage(p.mannequin_media_urls);
                const priceValue = (p.price_cents / 100).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                });
                const initials = `${p.brand?.[0] ?? ""}${p.name?.[0] ?? ""}`.toUpperCase();

                return (
                  <div
                    key={p.id}
                    className="group rounded-3xl bg-surface-2 p-4 ring-1 ring-border transition-colors hover:bg-[rgba(255,255,255,0.65)]"
                  >
                    <div className="flex gap-4">
                      <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#ffffff,#eef2f7)] ring-1 ring-[rgba(13,20,32,0.12)] sm:w-28">
                        {thumb ? (
                          <Image src={thumb} alt={p.name} fill sizes="112px" className="object-cover" />
                        ) : (
                          <div className="absolute inset-0 grid place-items-center">
                            <span className="font-display text-sm font-semibold tracking-[-0.02em] text-muted">
                              {initials || "—"}
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-[radial-gradient(closest-side,rgba(31,183,173,0.22),transparent_62%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                        <div className="absolute inset-x-0 bottom-0 h-10 bg-[linear-gradient(180deg,transparent,rgba(11,14,18,0.12))]" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex h-7 items-center rounded-full bg-[rgba(31,183,173,0.12)] px-3 text-xs font-medium text-[rgba(8,79,76,0.92)] ring-1 ring-[rgba(31,183,173,0.22)]">
                                {p.category}
                              </span>
                              <p className="text-xs uppercase tracking-[0.22em] text-muted">{p.brand}</p>
                            </div>
                            <p className="mt-2 truncate font-display text-lg font-semibold tracking-[-0.02em] text-foreground">
                              {p.name}
                            </p>
                            <p className="mt-1 text-sm text-muted">
                              {p.currency} {priceValue}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
                            <button
                              type="button"
                              onClick={() => generateImage(p.id)}
                              disabled={!!generating[p.id] || saving}
                              className="h-10 rounded-full bg-[rgba(31,183,173,0.12)] px-4 text-sm font-medium text-[rgba(8,79,76,0.92)] ring-1 ring-[rgba(31,183,173,0.22)] transition-colors hover:bg-[rgba(31,183,173,0.16)] disabled:opacity-60"
                            >
                              {generating[p.id] ? "Generating…" : thumb ? "Regenerate" : "Generate"}
                            </button>
                            <button
                              type="button"
                              onClick={() => startEdit(p)}
                              className="h-10 rounded-full bg-surface px-4 text-sm font-medium text-foreground ring-1 ring-border transition-colors hover:bg-white"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => remove(p.id)}
                              className="h-10 rounded-full bg-[rgba(239,68,68,0.10)] px-4 text-sm font-medium text-red-700 ring-1 ring-[rgba(239,68,68,0.22)] transition-colors hover:bg-[rgba(239,68,68,0.14)]"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted">Tidak ada data.</p>
            )}
          </div>
        </div>
      </Container>

      {isModalOpen ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-[rgba(15,23,42,0.42)] p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="w-full max-w-3xl rounded-[34px] bg-surface shadow-[0_40px_120px_rgba(15,23,42,0.32)] ring-1 ring-border">
            <div className="flex items-center justify-between gap-4 border-b border-border px-7 py-5">
              <div>
                <p className="text-sm font-medium tracking-[-0.01em] text-foreground">
                  {draft.id ? "Edit product" : "Create product"}
                </p>
                <p className="mt-1 text-xs text-muted">Tekan ESC atau klik area luar untuk menutup.</p>
              </div>
              <Button variant="secondary" size="sm" onClick={closeModal} disabled={saving}>
                Close
              </Button>
            </div>

            <div className="max-h-[78svh] overflow-auto px-7 py-6">
              <div className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm text-muted">Category</span>
                    <select
                      value={draft.category}
                      onChange={(e) => setDraft((p) => ({ ...p, category: e.target.value }))}
                      className="h-11 rounded-2xl bg-surface-2 px-3 text-sm text-foreground ring-1 ring-border outline-none focus:ring-2 focus:ring-ring"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm text-muted">Brand</span>
                    <input
                      value={draft.brand}
                      onChange={(e) => setDraft((p) => ({ ...p, brand: e.target.value }))}
                      className="h-11 rounded-2xl bg-surface-2 px-4 text-sm text-foreground ring-1 ring-border outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Aura Atelier"
                    />
                  </label>
                </div>

                <label className="grid gap-2">
                  <span className="text-sm text-muted">Name</span>
                  <input
                    value={draft.name}
                    onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                    className="h-11 rounded-2xl bg-surface-2 px-4 text-sm text-foreground ring-1 ring-border outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Urban Stealth Casual Jacket"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm text-muted">Price cents</span>
                    <input
                      value={draft.price_cents}
                      onChange={(e) => setDraft((p) => ({ ...p, price_cents: e.target.value }))}
                      inputMode="numeric"
                      className="h-11 rounded-2xl bg-surface-2 px-4 text-sm text-foreground ring-1 ring-border outline-none focus:ring-2 focus:ring-ring"
                      placeholder="12900"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm text-muted">Currency</span>
                    <input
                      value={draft.currency}
                      onChange={(e) => setDraft((p) => ({ ...p, currency: e.target.value }))}
                      className="h-11 rounded-2xl bg-surface-2 px-4 text-sm text-foreground ring-1 ring-border outline-none focus:ring-2 focus:ring-ring"
                      placeholder="USD"
                    />
                  </label>
                </div>

                <label className="grid gap-2">
                  <span className="text-sm text-muted">Tags (comma separated)</span>
                  <input
                    value={draft.tagsCsv}
                    onChange={(e) => setDraft((p) => ({ ...p, tagsCsv: e.target.value }))}
                    className="h-11 rounded-2xl bg-surface-2 px-4 text-sm text-foreground ring-1 ring-border outline-none focus:ring-2 focus:ring-ring"
                    placeholder="premium, casual, tosca"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm text-muted">Description</span>
                  <textarea
                    value={draft.description}
                    onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
                    className="min-h-24 rounded-2xl bg-surface-2 px-4 py-3 text-sm text-foreground ring-1 ring-border outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm text-muted">Fit notes</span>
                  <textarea
                    value={draft.fit_notes}
                    onChange={(e) => setDraft((p) => ({ ...p, fit_notes: e.target.value }))}
                    className="min-h-20 rounded-2xl bg-surface-2 px-4 py-3 text-sm text-foreground ring-1 ring-border outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm text-muted">Image (optional)</span>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#ffffff,#eef2f7)] ring-1 ring-[rgba(13,20,32,0.12)] sm:w-28">
                      {localPreviewUrl ? (
                        <Image
                          src={localPreviewUrl}
                          alt="Preview"
                          fill
                          sizes="112px"
                          className="object-cover"
                          unoptimized
                        />
                      ) : editingImageUrl ? (
                        <Image
                          src={editingImageUrl}
                          alt="Preview"
                          fill
                          sizes="112px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 grid place-items-center">
                          <span className="text-xs font-medium text-muted">No image</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-[radial-gradient(closest-side,rgba(31,183,173,0.20),transparent_64%)]" />
                    </div>

                    <div className="grid flex-1 gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                        className="block w-full text-xs text-muted file:mr-3 file:rounded-full file:border-0 file:bg-surface file:px-4 file:py-2 file:text-xs file:font-medium file:text-foreground file:shadow-soft file:ring-1 file:ring-border"
                      />
                      {imageFile ? (
                        <button
                          type="button"
                          onClick={() => setImageFile(null)}
                          className="h-9 justify-self-start rounded-full bg-surface px-4 text-xs font-medium text-foreground ring-1 ring-border transition-colors hover:bg-white"
                        >
                          Remove selected
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <p className="text-xs leading-5 text-muted">
                    Disimpan ke bucket <span className="font-medium">product-images</span>.
                  </p>
                </label>

                {error ? <p className="text-sm text-red-600">{error}</p> : null}

                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button size="lg" onClick={save} disabled={saving}>
                      {saving ? "Saving..." : "Save"}
                    </Button>
                    <Button size="lg" variant="secondary" onClick={resetDraft} disabled={saving}>
                      Reset
                    </Button>
                  </div>
                  <Button variant="ghost" size="lg" onClick={closeModal} disabled={saving}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

## Checklist
- [x] Inisialisasi Next.js (TypeScript + App Router + Tailwind)
- [x] Tambah dependency Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- [x] Tambah dokumen PRD + Technical Architecture
- [ ] Setup Supabase project (URL + keys) di environment lokal
- [ ] Jalankan `supabase/schema.sql` di Supabase SQL Editor
- [ ] Jalankan `npm run db:seed` untuk isi katalog produk awal
- [ ] Implement UI flow: onboarding → catalog → product detail → try-on
- [ ] Implement upload foto ke Supabase Storage + simpan path di `user_profiles`
- [ ] Implement endpoint `/api/tryon` (simulasi dulu) + simpan `tryon_results`

## Catatan Pekerjaan
- Repo disetup dengan Next.js + Tailwind, build sudah lolos.
- Layer Supabase dibuat terpisah untuk browser & server.
- Query layer dibuat terpisah untuk `products`, `user_profiles`, `tryon_results`.
- Seeder disediakan via `scripts/seed.mjs` dan npm script `db:seed`.

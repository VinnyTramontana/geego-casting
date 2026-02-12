# Geego Casting — Build Status

> Last updated: 2026-02-12

## Fully Complete

### Project Scaffold
- [x] Next.js App Router (TypeScript + Tailwind CSS) initialized
- [x] All npm dependencies installed (prisma, stripe, @react-pdf/renderer, three, zod, resend, uuid, vitest)
- [x] `tsconfig.json`, `postcss.config.mjs`, `eslint.config.mjs` configured
- [x] `vitest.config.ts` created (path alias configured)

### Prisma Schema (`prisma/schema.prisma`)
- [x] `QuoteEvent` model — all fields per spec
- [x] `Order` model — all fields per spec (including `castingEmailSentAt` for idempotency)
- [x] `MonthlyReport` model — with unique `monthKey`
- [x] SQLite provider for local dev (ready for Postgres swap in production)
- [ ] **Migration not yet run** (`npx prisma migrate dev` needed before first run)

### Core Libraries (`src/lib/`)
| File | Status | Notes |
|---|---|---|
| `prisma.ts` | Complete | Singleton pattern for dev hot-reload |
| `metals.ts` | Complete | All 8 metal options with exact labels, purity, density |
| `stl-parser.ts` | Complete | Binary + ASCII detection, signed volume, watertight check, bounding box |
| `stl-parser-browser.ts` | Complete | Browser-compatible version using DataView/ArrayBuffer |
| `pricing.ts` | Complete | Full pricing engine: unit conversion, per-part calc, min charge, all fees, rush |
| `rate-limit.ts` | Complete | In-memory sliding window, configurable, auto-cleanup |
| `email.ts` | Complete | HTML emails for casting team, customer confirmation, monthly report |
| `storage.ts` | Complete | Local file storage with 7-day expiry manifest, cleanup |
| `admin.ts` | Complete | SHA-256 session token, cookie verification, timing-safe compare |
| `validation.ts` | Complete | Zod schemas for quote, create-session, admin login, export/metrics queries |

### Types (`src/types/index.ts`)
- [x] All shared types: MetalOption, STLParseResult, PricingSettings/Input/Result, StoredFile, OrderEmailData, MonthlyReportData, etc.

### API Routes (`src/app/api/`)
| Route | Status | Notes |
|---|---|---|
| `GET /api/prices` | Complete | MetalpriceAPI fetch, 60s cache, demo fallback, rate limiting |
| `POST /api/quote` | Complete | Server-side quote computation, saves QuoteEvent to DB |
| `POST /api/payments/create-session` | Complete | Server-side recompute, Stripe Checkout session, stores files |
| `POST /api/webhooks/stripe` | Complete | Signature verification, PAID/CANCELED handling, idempotent emails |
| `GET /api/order/[id]` | Complete | Public order status (limited fields) |
| `POST /api/admin/login` | Complete | Password check, session cookie |
| `GET /api/admin/metrics` | Complete | Monthly aggregation of quotes + orders |
| `GET /api/admin/export` | Complete | CSV download for selected month |
| `POST /api/cron/monthly-report` | Complete | Idempotent monthly report with cron secret auth |

### UI Components (`src/components/`)
| Component | Status | Notes |
|---|---|---|
| `Header.tsx` | Complete | Sticky nav, mobile hamburger, logo |
| `Footer.tsx` | Complete | Links, contact info, copyright |
| `PriceTicker.tsx` | Complete | Gold/Silver/Platinum per oz + per g, demo mode banner, 60s refresh |
| `QuoteBuilder.tsx` | Complete | Full orchestration: upload, config, results, payment flow. Fixed price API parsing. |
| `QuoteResults.tsx` | Complete | Per-part table with all columns, full totals breakdown, meta info, demo mode notice |
| `PDFQuote.tsx` | Complete | @react-pdf/renderer PDF with parts table, all fees, disclaimer. Dynamic import + download. |
| `STLViewer.tsx` | Complete | Three.js viewer: binary + ASCII STL, orbit controls, gold material, auto-fit camera |

---

## Not Implemented Yet

### Missing Pages
- [ ] `src/app/contact/page.tsx`
- [ ] `src/app/faq/page.tsx`
- [ ] `src/app/terms/page.tsx`
- [ ] `src/app/privacy/page.tsx`
- [ ] `src/app/success/page.tsx`
- [ ] `src/app/order/[id]/page.tsx`
- [ ] `src/app/admin/page.tsx` (login)
- [ ] `src/app/admin/metrics/page.tsx`
- [ ] `src/app/admin/export/page.tsx`

### Missing Config / Root Files
- [ ] `.env.example` — environment variable template
- [ ] `vercel.json` — Vercel cron configuration
- [ ] `README.md` — needs full rewrite (currently default create-next-app boilerplate)
- [ ] `package.json` scripts — needs `test`, `db:migrate`, `db:push`, `postinstall` scripts

### Missing Tests
- [ ] `src/__tests__/stl-parser.test.ts`
- [ ] `src/__tests__/pricing.test.ts`
- [ ] `src/__tests__/volume.test.ts`

### Not Yet Done
- [ ] `npx prisma migrate dev` — database migration not run
- [ ] Build verification (`npm run build`) not tested
- [ ] Stripe webhook local testing not documented

---

## Summary

| Category | Done | Remaining |
|---|---|---|
| Prisma schema | 1/1 | Migration not run |
| Core libraries | 10/10 | — |
| API routes | 9/9 | — |
| UI components | **7/7** | **All complete** |
| Pages | 1/10 | 9 pages missing |
| Tests | 0/3 | All missing |
| Config files | 0/3 | .env.example, vercel.json, README |
| **Overall** | **~65%** | Pages, tests, config |

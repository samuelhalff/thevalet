# thevalet.ch

The Valet — premium concierge in Geneva and the Alps. Static Next.js export (`out/`), French
(default) and English, Formspark forms, GA4 with Consent Mode v2, JSON-LD, `llms.txt`.

Docs: `docs/PLAN.md` (positioning, IA, SEO), `docs/DESIGN.md` (binding design direction),
`docs/CONTENT-GUIDE.md` (writing and linking rules), `docs/TRANSLATION-GUIDE.md`.

## Commands

```bash
npm ci
npm run dev          # http://localhost:3100
npm run lint
npm run typecheck
npm test
npm run build        # prebuild: scripts/validate-content.mjs · postbuild: scripts/check-site.mjs
npm run report       # words and internal links per page
```

Preview build (noindex) served at https://thevalet.ark-fid.ch from `.preview/`:

```bash
NEXT_PUBLIC_NOINDEX=true NEXT_PUBLIC_SITE_URL=https://thevalet.ark-fid.ch npm run build
rm -rf .preview/* && cp -a out/. .preview/
# scripts/preview/serve.py .preview <port> adds X-Robots-Tag: noindex and a Disallow robots.txt
```

## Environment

All `NEXT_PUBLIC_*`, see `.env.example`. `NEXT_PUBLIC_SITE_URL` must be thevalet.ch or a preview
host, otherwise the build fails. Contact details, legal entity, address, WhatsApp and the Formspark
id have no defaults: while empty the site renders nothing for them.

## Structure

- `app/[locale]/page.tsx` home · `services/` hub + `[slug]` · `journal/` index + `[slug]` ·
  `[...slug]` the fixed pages with per-locale slugs (`src/lib/static-routes.json`):
  `/fr/a-propos/` ↔ `/en/about/`, `/fr/demande/` ↔ `/en/request/`, FAQ, contact, legal pages.
- `app/(root)` — `/` negotiates the language (FR fallback) and is the home page's x-default.
- `content/<locale>/services|journal/*.md` — service pages and articles (`translationKey` pairs them).
- `src/i18n/` — UI strings, page copy (`pages.*.json`), legal copy (`legal.*.json`).
- `src/lib/business.ts` — operator details from env; `src/lib/jsonld.ts` — Organization +
  LocalBusiness, Service, FAQPage, BreadcrumbList, WebSite, Article.
- `src/components/Logo.tsx` — the final logo as inline SVG (V in the brand token, ink in currentColor).

## Deploy

`.github/workflows/deploy.yml` is manual-only until the host is known (awaiting the SSH host).

## Journal articles

`.github/workflows/ai-articles.yml` is disabled (manual dispatch only). When re-enabled: max 2
articles per month (2nd and 16th), FR + EN, model to be decided (Azure Foundry is being retired).
Its editorial brief and fact base are stubs (`STUB (The Valet)` in `scripts/`).

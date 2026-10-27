# The Valet — instructions for coding agents (Codex, Claude)

Website of The Valet, a concierge service in French-speaking Switzerland and the Alps (thevalet.ch).
Next.js static export, French first (`/fr/`), English second (`/en/`).

## Where things are
- Service pages: `content/fr/services/*.md` and `content/en/services/*.md` (Markdown + front matter).
- Home, about, FAQ, contact and other fixed pages: `src/lib/copy.ts`.
- Interface text (menu, buttons, labels, image alt text and captions): `src/i18n/fr.json` and `src/i18n/en.json`.
- Resort facts (access, events): `content/facts/resorts.md`, the only source for those facts.
- Photos: `public/images/*.webp`, declared in `src/lib/images.ts`, credited in `public/images/CREDITS.md`.
  New photos go through `python3 scripts/brand/grade_photos.py <src> <name> <bleed|portrait>`.
- Design rules: `docs/DESIGN.md` (binding). Content plan and SEO: `docs/PLAN.md`.

## Rules
- Every text change is made in French **and** English, with the same meaning.
- French typography: non-breaking space before `; : ! ?`.
- Never invent facts: no prices, figures, client reviews, guarantees, partner names, dates or places
  that the owner has not given. Partner services (security, medical, legal, chauffeurs) are provided
  by independent partners; keep that wording.
- Follow `docs/DESIGN.md`: no new colours, fonts, shadows, rounded cards, icons or animations.
- Contact details, company name and form IDs come from environment variables, never hard-coded.
- Keep each change small and focused on what was asked.

## Before finishing
Run and fix until all pass:
```
npm ci
npm run lint
npm run typecheck
npm test
npm run build   # also validates content (word counts, titles, links) and checks every page
```
The build fails on purpose when a page is too short, a title is too long or duplicated, or a link is
broken: fix the content rather than the validator.

## Delivery
Work on a branch and open a pull request into `main`. Merging into `main` deploys the site.

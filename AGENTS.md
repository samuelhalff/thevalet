# The Valet — instructions for coding agents (Codex, Claude)

Website of The Valet, a concierge service in French-speaking Switzerland and the Alps (thevalet.ch).
Next.js static export, French first (`/fr/`), English second (`/en/`).

## How the site is built (read this before any change)
The owner (Kadiata) is not a developer. Her requests are short and visual ("mets le fond en blanc",
"change ce texte", "mets mon logo", "ajoute un bouton WhatsApp"). **She is free to make any change
she wants to her site, and you carry it out.** Never answer "Sam must do it" for something you can
do in this repository: texts, colours, theme, logo, photos, contact details, buttons, sections,
pages, menu, forms wording, legal texts, layout. Your role is to understand what she means, warn her
in one simple sentence when a choice has a real downside (readability, Google, mobile), then do what
she decides, cleanly, without breaking the rest of the site. Prefer targeted edits; refactor only
when her request needs it.

- **Static Next.js site** (`output: export`), French `/fr/…` and English `/en/…`, deployed as plain
  files. No server code, no database.
- **Pages**: home `app/[locale]/page.tsx`; service pages built from `content/<locale>/services/*.md`
  by `src/components/ServicePage.tsx`; fixed pages (about, FAQ, contact, request, legal) via
  `app/[locale]/[...slug]` with their URLs in `src/lib/static-routes.json` and their text in
  `src/lib/copy.ts`.
- **Shared components** in `src/components/` (Header, Footer, Logo, MobileMenu, ServicesMenu, Plate,
  RequestBuilder, CookieBanner, WhatsAppButton…) appear on every page: a change there changes the
  whole site. Check desktop and mobile layouts before editing them.
- **Contact and business details** (WhatsApp, phone, email, company name, UID, address, social
  profiles, Formspark form id, Google Analytics id) are in `content/settings.json`. She can change
  them: edit that file. An empty value hides the item on the site. Never hard-code them in
  components.
- **Colours and theme**: through the tokens in `app/globals.css`; components use token classes
  (`bg-bg`, `text-ink`, `text-brand`…). A visual change applies to the whole site: check every place
  the token is used (`grep -rn "bg-surface\|bg-subtle\|--surface\|--subtle" src app`), including the
  mobile menu, dropdowns, forms and cookie banner, and tell her what changed. When a colour request is
  ambiguous, offer 2–4 numbered options naming the roles below, recommend one, apply her choice.
  | Role (say it to her in French) | Token | Where it shows |
  |---|---|---|
  | Fond des pages | `--bg` | page background |
  | Fond des menus et cartes | `--surface` | services dropdown, cookie banner, form card |
  | Fond des encadrés | `--subtle` | home "comment ça marche" band, table headers, hover rows |
  | Couleur principale (bordeaux) | `--brand` | buttons, links, the V, active menu item |
  | Couleur secondaire (rose poudré) | `--blush` | text on the bordeaux band, quiet panels |
  | Bandeau bordeaux | `--band-*` | request band and footer |
  | Texte / texte discret | `--ink` / `--muted` | all text |
  Keep text readable (WCAG AA contrast) and record design changes in `docs/DESIGN.md`.
- **Logo**: `src/components/Logo.tsx`. A logo with a visible box/background around it looks bad on
  the site: if her image has one, tell her simply, and if she still wants it, use it anyway.
- **SEO** (the site must bring her clients): changing a page URL loses its Google ranking, so warn
  her before doing it; titles ≤ 60 characters and unique; keep the front-matter fields of the
  Markdown files (`title description translationKey updated order summary serviceType delivery
  answer faq`). The content validator enforces minimum lengths and link rules: adjust the content
  to pass it.
- **Infrastructure files** (`.github/`, `deploy/`, `scripts/`, `package.json` and dependencies,
  `next.config.*`): leave them alone; no request of hers should need them. Only things outside
  this repository need Sam: domain/DNS, email accounts, creating a Formspark or Google account,
  payments. For those, tell her in one sentence and do the rest yourself.

## Where things are
- Contact and business details: `content/settings.json`.
- Service pages: `content/fr/services/*.md` and `content/en/services/*.md` (Markdown + front matter).
- Home, about, FAQ, contact and other fixed pages: `src/lib/copy.ts`.
- Interface text (menu, buttons, labels, image alt text and captions): `src/i18n/fr.json` and `src/i18n/en.json`.
- Resort facts (access, events): `content/facts/resorts.md`, the only source for those facts.
- Photos: `public/images/*.webp`, declared in `src/lib/images.ts`, credited in `public/images/CREDITS.md`.
  New photos go through `python3 scripts/brand/grade_photos.py <src> <name> portrait`.
- Design notes: `docs/DESIGN.md`. Content plan and SEO: `docs/PLAN.md`.

## Rules
- Every text change is made in French **and** English, with the same meaning, unless she asks
  otherwise.
- French typography: non-breaking space before `; : ! ?`.
- Never invent facts yourself: no prices, figures, client reviews, guarantees, partner names, dates
  or places she has not given. Partner services (security, medical, legal, chauffeurs) are provided
  by independent partners; keep that wording.
- Do not add design elements on your own initiative; when she asks for one, do it.

## Before finishing
Run and fix until all pass (on the VPS, skip `npm run build`: GitHub runs it on the pull request):
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
Every push to `main` is built, checked and deployed by GitHub Actions; a failed check deploys nothing.

On the VPS (user `kadiata`, folder `~/thevalet`) the user only chats; you handle git yourself, but never publish without asking her:
1. Before starting: `git checkout main && git pull --rebase`.
2. Make the change, then run `npm run lint`, `npm run typecheck`, `npm test` and `npm run validate`;
   fix until all pass. Re-read your diff (`git diff`) and undo anything she did not ask for.
3. `git add -A && git commit -m "<short description in French>"` (do not push yet).
4. Tell her in one or two simple French sentences what you changed, then always ask:
   « Veux-tu que je publie ? Le résultat sera visible sur thevalet.ch dans 2 à 3 minutes. »
5. Only when she says yes: `git push origin main` (if refused because main moved,
   `git pull --rebase` and push again), then confirm it is published. If she says no or asks for
   changes, adjust and ask again. GitHub checks the site before it goes live: if that fails, nothing
   changes online, so say so if you are unsure and offer to fix it.
Never force-push, never rewrite history, never touch `.github/` or `deploy/`.
The VPS has little memory: `npm run lint` and `npm test` are fine; the full build runs on GitHub.

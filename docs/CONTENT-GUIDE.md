# Content guide — thevalet.ch

Read fully before writing. Sources: `brief/FR_revisee.txt` (the owner's own words, FR master),
`brief/EN_copy.txt` (EN copy), `docs/PLAN.md` (positioning, SEO targets), `docs/DESIGN.md` (banned words).
FR is written first; EN mirrors it (same facts, same sections, same FAQ count).

## Voice
Calm, warm, precise; "nous" = The Valet, vouvoiement. Concrete nouns (a late flight, skis, a chalet
to prepare), no hype, no exclamation marks. Banned words (DESIGN.md): élever/elevate, sans couture/
seamless, solutions sur mesure, votre partenaire de confiance, découvrez l'excellence, expérience unique.

## Honesty rules (hard)
- No invented figures, prices, testimonials, client cases, response times, fleet or staff counts,
  travel times or distances.
- Availability, verbatim: FR « Demandes reçues 24 h/24, 7 j/7 ; délais et disponibilité confirmés pour
  chaque demande. » EN "Requests received 24 hours a day, 7 days a week; lead times and availability
  confirmed for each request."
- Regulated services (security, medical, legal, real estate, chauffeur/VTC, child transport, jets,
  yachts) are coordinated through independent, appropriately licensed partners. No "sûr / sécurisé /
  garanti / qualifié" (safe / secure / guaranteed / qualified) claims. Partners are never named.
- Contact details, address and legal entity come from env (`src/lib/business.ts`); never write them in copy.

## Where things live
- Service pages: `content/<locale>/services/<slug>.md` (FR slugs in French, EN in English; the pair
  shares `translationKey`, which is also the `?service=` key of the request builder).
- Journal: `content/<locale>/journal/<slug>.md` (none yet; the index is noindex while empty).
- Fixed pages: `src/i18n/pages.<locale>.json` (home, about, FAQ, hubs, contact, request) and
  `src/i18n/legal.<locale>.json` (privacy, legal notice, terms). UI strings: `src/i18n/<locale>.json`.
- Localized fixed-page paths: `src/lib/static-routes.json`.

## Service page frontmatter
`title` (H1; ≤ 48 chars, " | The Valet" is appended), `description` (≤ 155), `translationKey`,
`updated`, `order`, `summary` (one line), `serviceType`, `delivery` (`partner` | `coordinated`),
`answer` (quotable 2–3 sentences at the top), `faq` (5–8).
Body sections: what we arrange → how it works (3–5 steps) → typical situations (generic, never
invented cases) → where → who does what (partner vs The Valet). Only H2/H3 in the body.

## Journal frontmatter
`title`, `description`, `translationKey`, `updated`, optional `published`, `draft`, `faq`,
`sources`, `keywords`, `service` (translationKey of the main related service).
**Every article links in its body to at least 2 service pages and 1 pillar page** (chalets
`/fr/services/chalets-residences-alpes/` or transfers `/fr/services/transferts-geneve-alpes/`, EN
equivalents). The article template adds a "related services" block automatically.
Cadence when the pipeline is re-enabled: max 2 per month (2nd and 16th), FR + EN only.

## Internal linking (the build enforces it)
- Absolute paths only, FR pages → `/fr/…`, EN pages → `/en/…`.
- Service pages link in their body to ≥ 3 other services and to `/fr/demande/?service=<key>`
  (`/en/request/?service=<key>`); each service receives ≥ 3 content links.
- Resort sections on the pillar pages are H3s named exactly Verbier, Zermatt, Gstaad, St-Moritz,
  Courchevel, Megève, Chamonix (ids `#verbier`, `#st-moritz`, `#megeve`, …).
- Descriptive, varied anchors; never "cliquez ici", "en savoir plus", "click here", "learn more".

## Depth (the build enforces it; counted on answer + body + FAQ, or the page copy)
Services FR ≥ 900 / EN ≥ 800 words; pillar pages (chalets, transfers) FR ≥ 1,500 / EN ≥ 1,350;
home FR ≥ 900; about FR ≥ 600; FAQ page ≥ 22 Q&As; hubs ≥ 300 words of intro.
Titles ≤ 60 characters with the suffix, descriptions ≤ 155, unique per language.

## Checks
`npm run validate` (prebuild) checks parity, links, anchors, depth, titles; `npm run build` then runs
`scripts/check-site.mjs` on the built HTML (one H1, unique titles, link targets, incoming links).
`npm run report` prints words and links per page.

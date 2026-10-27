# Build brief — The Valet v1 (2026-10-26)

Repo `/home/sam/dev/thevalet` is a copy of `/home/sam/dev/switzerlandresidency.ch` (SR) without content.
Goal: turn it into thevalet.ch, a minimalist, feminine, luxury concierge site, FR (default) + EN.
Read first: `docs/PLAN.md`, `brief/FR_revisee.txt` (owner's own words, FR master), `brief/EN_copy.txt`
(structured EN copy incl. FAQ, form fields, metadata), `docs/CONTENT-GUIDE.md` (SR rules, adapt).

## Must do
1. **Remove SR wholesale**: eligibility check, cantons, advisers/for-advisers, moving-from, how-it-works
   (fold into home), relocation JSON-LD/audiences, `ARK_URL`, SR assets in `public/` (verification files,
   IndexNow key, images), SR tests/fixtures, DE locale everywhere (i18n, dictionaries, validators,
   tests, routes). `src/lib/site.ts`: no SR fallbacks; build fails if SITE_URL is not thevalet.ch or a
   preview host. Formspark ID only from env, no default. `.htaccess`, workflows and smoke tests: no SR
   domain left. Run `grep -ri "switzerland\|residency\|ark-fid\|canton" app src scripts public .github`
   at the end and clear every hit that isn't intentional.
2. **i18n**: locales `fr` (default/fallback) and `en`. `/` negotiates language, FR fallback, and is the
   `x-default`. Self-canonicals; reciprocal hreflang only where both versions exist.
3. **IA** (routes in FR slugs for fr, EN slugs for en, mapped via translationKey):
   home · services hub · 9 service pages per PLAN "Build order" (concierge privée, chauffeur & transferts
   GVA, transferts Genève–Alpes, transport d'enfants, intendance de résidence/housekeeping, chalets &
   résidences (resort sections inside: Verbier, Zermatt, Gstaad, St-Moritz, Courchevel, Megève,
   Chamonix), mariages & événements, Glam Team, conciergerie médicale, sécurité, juridique & immobilier
   — merge where the brief is thin) · about · FAQ · contact · request (progressive builder) · journal
   (index + article template, no articles yet) · privacy · legal notice · terms.
4. **Copy**: write from the owner's FR text, tightened and SEO-shaped (one intent per page, a quotable
   2–3 sentence answer paragraph at the top of each page, FAQ per service page). EN mirrors FR.
   Honesty: no invented figures, prices, testimonials, cases, response times, fleet or staff counts.
   Regulated services (security, medical, legal, real estate, VTC/child transport, jets, yachts) are
   "coordinated through independent, appropriately licensed partners"; no "safe/secure/qualified/
   guaranteed" promises. Availability wording: "Demandes reçues 24 h/24, 7 j/7 ; délais et disponibilité
   confirmés pour chaque demande." Partners never named. Placeholders (phone, email, address, entity,
   WhatsApp) come from env/config and render nothing when empty — never fake values.
5. **Lead gen**: request builder (service → date/urgency → place → party size → preferred channel →
   minimal contact + consent), service prefilled from each page's CTA (`?service=`), sticky mobile CTA,
   WhatsApp button only if `NEXT_PUBLIC_WHATSAPP` set. Form text warns not to send medical/security
   details. Keep SR's first-party attribution and Consent Mode v2 (region defaults), but never send form
   content to analytics.
6. **Privacy/legal**: nLPD/FADP + GDPR privacy page listing Formspark, WhatsApp, GA4, hosting,
   recipient countries, retention, rights; controller fields from config (placeholder-safe). Terms
   state partner-delivered services.
7. **Design**: minimalist like SR, more feminine. Tokens in `app/globals.css` (RGB channels):
   light canvas #F7F2ED, surface #FFFDFC, ink #201A1B, muted #6E6364, brand #6A1F2B, blush #E7CDD0,
   border #D9CECA, champagne #9B7A50; dark canvas #171314, surface #211C1D, ink #F5EFEB, muted #C6BABC,
   brand #D5959E, blush #492A30, border #3B3335, champagne #CBB28C. Check WCAG AA for text/buttons.
   Fonts: Cormorant Garamond 500 headings (italic for accent words), Manrope 400/500 body/UI.
   Generous whitespace, hairlines, no heavy shadows, no stock clichés. Images: keep SR's ImageSlot
   placeholders (no stock photos yet).
8. **Logo**: final logo is NOT chosen. Implement `src/components/Logo.tsx` as a temporary wordmark:
   small spaced "THE" (Manrope, tracking .3em) above "Valet" in Cormorant with the V in brand colour,
   currentColor-based so light/dark work. Keep it isolated so an SVG can replace it in one file.
   Favicon: simple V in brand colour.
9. **SEO/GEO**: JSON-LD Organization+LocalBusiness (fields from config, sameAs empty until verified),
   Service per service page with areaServed (Genève, Vaud, Valais, Berne/Gstaad, Grisons/St-Moritz,
   Haute-Savoie/Savoie), FAQPage, BreadcrumbList, WebSite. `llms.txt` built from content. robots allows
   GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot (when not NOINDEX). Sitemap with hreflang.
   Titles per brief metadata pattern.
10. **Articles**: disable the scheduled article workflow (keep the file, remove the `schedule`
    trigger, leave `workflow_dispatch`) and add a note at top: cadence when re-enabled is max 2/month
    (2nd & 16th), FR+EN only, model to be decided (Azure Foundry is being retired). Do not delete the
    pipeline code; remove its SR/relocation prompts and fact base references or stub them clearly.
11. **Deploy**: keep `deploy.yml` but disable its triggers except `workflow_dispatch` (hosting TBD,
    awaiting SSH host). No secrets in repo.

## Verify before finishing
`npm ci` (if needed), `npm run lint`, typecheck, `npm test`, `NEXT_PUBLIC_NOINDEX=true
NEXT_PUBLIC_SITE_URL=https://thevalet.ark-fid.ch npm run build`. Fix all failures. Then copy `out/`
into `.preview/` (replace contents) — it is served at https://thevalet.ark-fid.ch by
`scripts/preview/serve.py`. Spot-check 3 pages with curl for noindex meta. Commit in logical commits
(end messages with the Co-Authored-By / Claude-Session lines from the repo's git log). Do not push.
Report: what was built, page list, anything left as placeholder, any failing check.

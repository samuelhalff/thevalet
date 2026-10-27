# The Valet — site plan (draft 2026-10-26)

Client: The Valet (thevalet.ch), premium concierge in Switzerland, founded and run by a woman.
Source copy: `brief/` (EN copy, FR content, FR revised — the revised FR is the owner's own voice).
Stack: cloned from switzerlandresidency.ch (static Next export, Formspark, GA4 Consent Mode v2,
JSON-LD, llms.txt, IndexNow). Two locales: **fr** (default, Geneva market) and **en**. No de.

## Positioning
- One trusted contact for transport, concierge, security, stays, events and beauty.
- Tagline: « Chaque souhait devient une réalité. » / "Every wish, made real."
- Values: Fiabilité · Discrétion · Confiance.
- Tone: calm, warm, precise. Feminine through lightness, whitespace, serif headings and a soft
  bordeaux/blush palette — never pink-cliché. Minimal like our other sites.
- Honesty rules carried over from Ark/SR: no invented figures, cases, testimonials or prices;
  regulated work (legal, real estate, medical, security) is always "through qualified partners";
  partners never named without consent.

## Information architecture
- `/` Home — hero, promise, 7 services, why us, how it works (3 steps), destinations strip, FAQ, CTA.
- `/services/` hub + 7 service pages (one per owner tab):
  transport (chauffeur privé, transferts aéroport GVA/ZRH, transport d'enfants, valeurs, location
  voiture/jet/yacht) · conciergerie (assistance personnelle, housekeeping, conciergerie médicale) ·
  sécurité · hébergement (hôtels, résidences privées, chalets) · juridique & immobilier ·
  événementiel (mariages, dîners privés, lancements) · Glam Team.
- `/destinations/` — replaces SR "cantons". Start with Geneva + the 7 resorts in the brief
  (Verbier, Zermatt, Gstaad, St-Moritz, Courchevel, Megève, Chamonix). Each must be substantive:
  access (airport/heliport/rail, transfer times), season, signature events, what we arrange there.
  Pages that get no impressions after 90 days → noindex (Ark lesson).
- `/occasions/` (seasonal, high intent, evergreen pages updated yearly — never one page per year):
  Watches and Wonders Genève, WEF Davos, ski season arrivals, weddings in Switzerland,
  Art Genève / Geneva events. Built gradually, only with real content.
- `/journal/` — articles, **max 2 per month** (cron 2nd & 16th), FR + EN only, refresh job for the
  pages that earn clicks. No scaled content.
- `/about/`, `/faq/`, `/contact/` (form + WhatsApp + phone), `/request/` (guided request builder
  replacing SR's eligibility check: service → date → place → guests → contact).
- Legal: privacy (FADP/nLPD + GDPR), legal notice, CGV/terms.

## Build order (Codex SEO input, 2026-10-26)
1. Conciergerie privée Genève / Luxury concierge Geneva (home + concierge page)
2. Chauffeur privé & transferts GVA / Private chauffeur
3. Transferts Genève–Alpes (Verbier, Megève, Courchevel, Chamonix) — one strong page, not one per resort
4. Transport privé d'enfants / Private child transport
5. Intendance de résidence Genève–Vaud / Residence management (housekeeping)
6. Chalet concierge Swiss/French Alps (destinations hub, resort sections inside)
7. Mariages & événements privés Genève / Weddings and private events
8. Glam Team à domicile / at home or hotel
9. Conciergerie médicale and Sécurité — separate pages, explicitly partner-delivered
Each page states: response time, languages, geography, direct vs partner-delivered.
Destination pages start as sections of the chalet/transfer pages; split out a resort only
once it has enough first-hand content to stand alone.

## SEO
- Primary FR targets: conciergerie de luxe Genève, conciergerie privée Suisse, chauffeur privé
  Genève, transfert aéroport Genève, chauffeur Gstaad/Verbier/Courchevel, conciergerie Verbier,
  location chalet de luxe Verbier/Zermatt/Courchevel, maquilleuse à domicile Genève, coiffure
  mariage Genève, organisation mariage Suisse, garde du corps Genève.
- EN targets: luxury concierge Geneva/Switzerland, private driver Geneva, Geneva airport chauffeur,
  ski chalet concierge Verbier/Zermatt/Courchevel, WEF Davos chauffeur, Watches and Wonders
  chauffeur, wedding planner Switzerland.
- Titles/H1 per page aimed at one intent; internal links from every article to a service page;
  hreflang fr/en + x-default; one canonical per topic.
- Local: Google Business Profile (biggest lever for "near me" and Maps), reviews, consistent NAP.

## GEO (answer engines)
- Homepage JSON-LD `["Organization","LocalBusiness"]` + `Service` per page with `areaServed`,
  `FAQPage`, `BreadcrumbList`; `sameAs` only to verified profiles (Instagram, LinkedIn, GBP).
- `llms.txt` with services, areas, how to request, contact.
- Clear, quotable answer paragraphs at the top of each service/destination page.
- robots: allow GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot.
- Authority from press, wedding/event directories, hotel partners, GBP reviews — not own-site links.

## Lead gen
- Sticky "Demander" CTA + WhatsApp (number TBD). Form fields from the brief (service, date, place,
  details, preferred contact, consent). First-party attribution as on SR.
- Per-service CTAs with the service pre-selected.

## Testing environment
- `thevalet.houle.ai` via Cloudflare tunnel, built with NOINDEX: robots Disallow, meta noindex,
  `X-Robots-Tag: noindex, nofollow` header.

## Open questions for the client
Base city/address, legal entity, phone/email/WhatsApp, 24/7 meaning, female chauffeurs/protection
available?, photos (own or licensed stock), Instagram/LinkedIn, partner credentials to show.

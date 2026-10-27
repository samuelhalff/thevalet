# The Valet — design direction (binding for every page)

Built with the `fresh-web-design` skill. Any deviation must be recorded here with a reason.

## What the business is made of
A concierge's world is **the request note, the itinerary and the moment a wish is ticked off**.
The logo already holds that idea: a bordeaux V drawn as a check mark. Everything derives from it.

## Direction
- **Colour** (from the logo, used as surfaces, not just accents):
  - Light: paper `#F6F1F1` (rose-tinted porcelain, deliberately *not* cream), ink `#221A1C`
    (aubergine-tinted black), bordeaux `#6A1F2B` (full-bleed surfaces: request band, footer),
    blush `#EBD6D6` (quiet panels, text on bordeaux), muted `#6B5E61` (AA on paper).
  - Dark: night `#1A1215` (bordeaux-black), ink `#F3E9E8`, rose `#D99AA3` (V, links),
    deep bordeaux surface `#3A1820`, muted `#BFAFB2`.
  - No gradients, no shadows beyond a 1px tinted edge, no pure black/white.
- **Type:** Playfair Display for display only (it is the logo's lettering), set large, tight
  leading (1.02–1.1), optical tracking −0.01em, real italics used for whole phrases, never one
  accented word. Text and UI in **Hanken Grotesk** (400/500), 17–18px body, 65ch measure.
  French typography (non-breaking spaces before ; : ! ?). Custom type scale, not Tailwind defaults.
- **Layout idea — "the itinerary":** strong left edge, asymmetric two-column compositions,
  services presented as an itinerary list (large service name, one-line promise, place/time
  details) instead of card grids. Sections alternate density: airy statement → dense practical
  detail → full-bleed bordeaux request band.
- **Signature detail — the check:** the V mark (from `brief/logo-final/thevalet-mark-*.svg`) is
  the only ornament. It ticks items in "what we arrange" lists, marks the active nav item, and
  draws itself once in the home hero (stroke animation, respects reduced motion). Nowhere else.
- **Request form as a correspondence card:** the request builder looks like a written note
  ("Votre demande"), with underlined fields on paper, not boxed inputs in a card.
- **Motion:** only the hero check drawing in and quiet hover states. No fade-up on scroll.
- **Photography (revised 2026-10-27, Sam: "a lot of text right now"):** six Unsplash photos, used
  sparingly, until the owner supplies her own. All are graded with `scripts/brand/grade_photos.py`
  (desaturated, shadows towards ink, highlights towards paper) so they read as one series, and
  credited in `public/images/CREDITS.md`. They appear only as *plates* (`src/components/Plate.tsx`):
  - **bleed**: one wide 2:1 photo on the home page, running from the text edge off the right of the
    viewport, with a place caption after a short bordeaux rule;
  - **portrait**: a 4:5 print with a bordeaux plate offset behind it (the band colour), in the header
    of five service pages (chalets, transfers, chauffeur, events, Glam Team) and under two home
    chapters on desktop.
  No photos on medical, security, legal, concierge or child transport pages (nothing truthful to show
  from stock). Never people's faces, never a photo presented as the owner's own work. Captions name
  the real place only when the photo's source confirms it.

## Banned on this site (from the skill)
Tracked all-caps eyebrow labels above headings; `AccentText`-style single accented words;
`RevealObserver` fade-ups; icon-in-rounded-square; three-card feature grids; card-wrapped
everything; `rounded-2xl`/`shadow-lg`/`backdrop-blur`; decorative 01/02/03 (real steps only);
stat rows; "Get Started"; arrows on every CTA; copy words: élever/elevate, sans couture/seamless,
solutions sur mesure, votre partenaire de confiance, découvrez l'excellence, expérience unique.

## Recorded exceptions
- Playfair Display is on the "tasteful default" list: kept because it is the logo's typeface,
  so the site and the mark speak one voice.
- Lined textarea (`textarea.field` in `app/globals.css`): a `linear-gradient` draws the ruled lines
  of the correspondence card. It is a hard-edged rule pattern, not a colour gradient.
- Theme switch (light/dark/system) uses small functional line icons (sun, moon, screen); the FAQ
  disclosure uses a plain "+". Both are controls, not decoration.
- Home "how it works" keeps numbers 1–3: it is a real sequence (request → confirmation → delivery).
- The services hub and home list every service as an itinerary row (left bordeaux edge, name,
  promise, who delivers it): a content-shaped list, not a card grid.
- Implementation notes (2026-10-26): tokens and type scale in `app/globals.css` (`t-hero`, `t-1`…
  `t-note`, `.phrase` for whole italic phrases); the V is `--check` (CSS mask) and `HeroCheck`
  (one-time stroke draw, static under reduced motion); bordeaux surfaces are `.band` (request band,
  footer); forms use `.note-card` with underlined `.field`s. Image slots render nothing until real
  photography is set in `src/lib/images.ts`.

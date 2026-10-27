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
    A white background was tried on 2026-10-27 and reverted: the owner had wanted it only because
    she had not noticed the dark mode switch.
  - Dark: night `#1A1215` (bordeaux-black), ink `#F3E9E8`, rose `#D99AA3` (V, links),
    deep bordeaux surface `#3A1820`, muted `#BFAFB2`.
  - **Dark mode is permanent.** The theme switch (light / dark / system) must always work: any
    colour change is made in the light palette *and* given a matching, readable value in both dark
    blocks of `app/globals.css` (the `prefers-color-scheme` block and `[data-theme="dark"]`).
  - No gradients, no shadows beyond a 1px tinted edge, no pure black or white.
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
  (rose-aubergine duotone with a third of the original colour kept) so they read as one series in
  the site's palette, and credited in `public/images/CREDITS.md`. They appear only as *plates*
  (`src/components/Plate.tsx`): a 4:5 photo in an **arched frame** (a chalet window) with a 1px
  bordeaux keyline offset up and right, and a place caption after a short bordeaux rule. Where:
  the header of five service pages (chalets, transfers, chauffeur, events, Glam Team), beside the
  home intro (Zermatt) and under one home chapter on desktop. Chosen by Sam over an offset bordeaux
  plate and a V-notch cut; a full-width photo strip was tried and dropped (too heavy).
  No photos on medical, security, legal, concierge or child transport pages (nothing truthful to show
  from stock). Never people's faces, never a photo presented as the owner's own work. Captions name
  the real place only when the photo's source confirms it.
- **Corners (2026-10-27, Sam: "a bit rough"):** buttons, the theme toggle and other controls are
  pills (`rounded-soft` = 999px), echoing the arch; panels and the services dropdown use 12px
  (`rounded-panel`). Form fields stay underlined (correspondence card).

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

- 2026-10-27, Kadiata: all home and about page headings use bold (700), including
  service names, value titles and FAQ questions, in both languages and themes. Other pages
  keep their existing weights. Playfair Display includes the real 700 weight for these titles.

- 2026-10-27, Kadiata: replace header/footer wordmark with her supplied bold
  “The Valet.” artwork and Swiss flag. Crop empty margins, use black lettering
  on light pages and white on dark pages/the bordeaux footer, keeping the flag red
  and white. Pure black/white and Swiss red are approved exceptions for this logo.
  Retain the existing decorative V elsewhere.

## Current owner decision — 2026-10-27
Kadiata explicitly chose to remove dark mode and its desktop/mobile controls. This
supersedes the earlier permanent-dark-mode direction. Every page, dropdown, mobile
menu, form card, cookie banner and quiet section uses white surfaces, independently
of OS settings or legacy saved preferences. Bordeaux request bands/footer and their
readable light lettering remain. The header logo stays black; footer logo stays white.

## WhatsApp shortcut — 2026-10-27
Kadiata chose a fixed WhatsApp icon at the bottom right on every French and English
page, on mobile and desktop. Use the existing bordeaux button palette and a circular
control; keep it above the mobile request bar and consent banner, and hide it while
the mobile menu is open. This replaces the WhatsApp icon inside the mobile request
bar. The destination remains environment-configured (`NEXT_PUBLIC_WHATSAPP`), with
no prefilled visitor message. Requested number: +41 76 428 23 24 (41764282324).
Production activation of this setting is still pending with Sam. The bilingual
welcome reply is configured separately in WhatsApp Business by the owner.

## WhatsApp colour — 2026-10-27
Kadiata chose WhatsApp green (#25D366) with a white symbol for the floating
shortcut on every French and English page, on mobile and desktop. This replaces
the bordeaux shortcut colour only; other buttons retain their existing palette.

## Home title — 2026-10-27
Kadiata chose “The Valet. 🇨🇭” followed by a spaced, regular-weight line:
“Votre conciergerie haut de gamme” / “Your high-end concierge”. Only the
brand name is bold within this heading. Other home headings remain unchanged.

The home heading uses the same small square Swiss flag artwork and colours as
the header logo, beside the brand name, rather than a platform-dependent emoji.

2026-10-27: Kadiata requested a closer Swiss flag beside the home brand name;
reduce the gap from 12px to 4px in both languages.

2026-10-27: raise the home Swiss flag by 8px at Kadiata’s request, keeping
the closer horizontal spacing.

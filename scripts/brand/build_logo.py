"""Build The Valet logo SVGs from outlined glyphs (no font needed to display them).

Each variant is a list of lines; each line is a list of segments (text, face, size, role,
tracking). Lines are centred. Role "accent" is bordeaux (light) / dusty rose (dark).
A segment may use the drawn check-mark V ("tick") instead of a font glyph.

Usage: python3 build_logo.py <fonts_dir> <out_dir> [variant ...]
"""
import sys
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

FONTS, OUT = Path(sys.argv[1]), Path(sys.argv[2])

COLORS = {
    "light": {"ink": "#201A1B", "accent": "#6A1F2B", "bg": "#F7F2ED"},
    "dark": {"ink": "#F5EFEB", "accent": "#D5959E", "bg": "#171314"},
}

FACES = {
    "fraunces": ("Fraunces.ttf", {"SOFT": 100, "WONK": 1, "opsz": 144, "wght": 380}),
    "fraunces-italic": ("FrauncesItalic.ttf", {"SOFT": 100, "WONK": 1, "opsz": 144, "wght": 380}),
    "instrument": ("Instrument.ttf", None),
    "instrument-italic": ("InstrumentItalic.ttf", None),
    "gloock": ("Gloock.ttf", None),
    "playfair": ("Playfair.ttf", {"wght": 420}),
    "playfair-italic": ("PlayfairItalic.ttf", {"wght": 420}),
    "belleza": ("Belleza.ttf", None),
    "marcellus": ("Marcellus.ttf", None),
    "tenor": ("Tenor.ttf", None),
    "josefin": ("Josefin.ttf", {"wght": 300}),
    "italiana": ("Italiana.ttf", None),
    "serif": ("Cormorant.ttf", {"wght": 500}),
    "serif-italic": ("CormorantItalic.ttf", {"wght": 500}),
    "sans": ("Jost.ttf", {"wght": 380}),
}

# Segment: (text, face, size in px-per-em, role, tracking in em)
VARIANTS = {
    # Soft, ink-trapped display serif; the V borrows the italic's flowing stroke.
    "fraunces": [[("The ", "fraunces", 100, "ink", -0.01), ("V", "fraunces-italic", 104, "accent", -0.02),
                  ("alet", "fraunces", 100, "ink", -0.01)]],
    # Condensed editorial serif (Instrument), italic bordeaux V.
    "instrument": [[("The ", "instrument", 110, "ink", -0.005), ("V", "instrument-italic", 114, "accent", 0.0),
                    ("alet", "instrument", 110, "ink", -0.005)]],
    # Gloock: high-contrast, sculpted; V in Fraunces italic for fluidity.
    "gloock": [[("The ", "gloock", 100, "ink", -0.01), ("V", "playfair-italic", 106, "accent", -0.01),
                ("alet", "gloock", 100, "ink", -0.01)]],
    # All-italic signature, one colour accent.
    "playfair-italic": [[("The ", "playfair-italic", 100, "ink", 0.0), ("V", "playfair-italic", 100, "accent", 0.0),
                         ("alet", "playfair-italic", 100, "ink", 0.0)]],
}

_faces = {}


def face(key):
    if key not in _faces:
        file, loc = FACES[key]
        f = TTFont(FONTS / file)
        if loc:
            f = instantiateVariableFont(f, loc)
        _faces[key] = (f, f.getGlyphSet(), f.getBestCmap(), f["hmtx"], f["head"].unitsPerEm,
                       f["OS/2"].sCapHeight)
    return _faces[key]


def ticked_v(glyph, gs, bounds, length, taper):
    """Return the V's outline with its right arm drawn on past the cap line (the check).

    The arm's top points are slid up along the arm's own slant by `length` cap heights,
    and the arm narrows by `taper` at the new top, so the stroke ends like a pen tick.
    """
    from fontTools.pens.recordingPen import RecordingPen

    rec = RecordingPen()
    glyph.draw(rec)
    xmin, _, xmax, top = bounds
    mid = (xmin + xmax) / 2
    tops = sorted({pt for _, pts in rec.value for pt in pts if pt[1] >= top - 1 and pt[0] > mid})
    slope = (xmax - mid) / top
    L = length * top
    inner_x = tops[0][0] if tops else xmax

    def move(pt):
        if pt in tops:
            dx = slope * L
            # pull the outer edge in toward the inner edge so the stroke tapers
            if pt[0] > inner_x:
                dx -= (pt[0] - inner_x) * taper
            return (pt[0] + dx, pt[1] + L)
        return pt

    rec.value = [(op, tuple(move(pt) for pt in pts)) for op, pts in rec.value]
    return rec


def layout_line(segments):
    """Return [(role, d)] and (ink_left, ink_right, cap_px) for a line on baseline 0."""
    out, x, left, right, cap_px = [], 0.0, None, 0.0, 0.0
    for seg_i, (text, fkey, size, role, track, *opt) in enumerate(segments):
        tick = opt[0] if opt else None
        f, gs, cmap, hmtx, upm, cap = face(fkey)
        k = size / upm
        cap_px = max(cap_px, cap * k)
        parts = []
        for i, ch in enumerate(text):
            name = cmap[ord(ch)]
            pen = SVGPathPen(gs)
            bp = BoundsPen(gs)
            gs[name].draw(bp)
            if tick and ch == "V":
                ticked_v(gs[name], gs, bp.bounds, *tick).replay(TransformPen(pen, (k, 0, 0, -k, x, 0)))
            else:
                gs[name].draw(TransformPen(pen, (k, 0, 0, -k, x, 0)))
            parts.append(pen.getCommands())
            if bp.bounds:
                left = x + bp.bounds[0] * k if left is None else left
                right = x + bp.bounds[2] * k
            last = seg_i == len(segments) - 1 and i == len(text) - 1
            x += hmtx[name][0] * k + (0 if last else track * size)
        out.append((role, " ".join(parts)))
    return out, (left, right, cap_px)


def build(variant, theme):
    c = COLORS[theme]
    lines = [layout_line(segs) for segs in VARIANTS[variant]]
    width = max(r - l for _, (l, r, _) in lines)
    paths, y = [], 0.0
    for i, (segs, (l, r, cap_px)) in enumerate(lines):
        y += cap_px if i == 0 else cap_px + lines[i - 1][1][2] * 0.55
        dx = (width - (r - l)) / 2 - l
        for role, d in segs:
            paths.append(f'<path fill="{c[role]}" transform="translate({dx:.1f} {y:.1f})" d="{d}"/>')
    pad, head = 12, lines[0][1][2] * 0.5
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{-pad} {-pad - head:.0f} {width + 2 * pad:.0f} '
        f'{y + 2 * pad + head + 4:.0f}" role="img" aria-label="The Valet">\n  <title>The Valet</title>\n  '
        + "\n  ".join(paths) + "\n</svg>\n"
    )


OUT.mkdir(parents=True, exist_ok=True)
for v in sys.argv[3:] or VARIANTS:
    for theme in COLORS:
        (OUT / f"thevalet-logo-{v}-{theme}.svg").write_text(build(v, theme))
print("ok")

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
    "didone": ("Bodoni.ttf", {"wght": 500, "opsz": 96}),
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
    # Same layout (small spaced THE over Valet); only the V changes.
    "v-classic": [[("THE", "sans", 20, "ink", 0.8)],
                  [("V", "playfair", 100, "accent", -0.005), ("alet", "playfair", 100, "ink", -0.005)]],
    "v-flourish": [[("THE", "sans", 20, "ink", 0.8)],
                   [("V", "playfair", 100, "accent", -0.005, (0.30, 0.10, 0.10)),
                    ("alet", "playfair", 100, "ink", -0.005)]],
    "v-italic": [[("THE", "sans", 20, "ink", 0.8)],
                 [("V", "playfair-italic", 102, "accent", 0.0), ("alet", "playfair", 100, "ink", -0.005)]],
    "v-didone": [[("THE", "sans", 20, "ink", 0.8)],
                 [("V", "didone", 104, "accent", 0.0), ("alet", "playfair", 100, "ink", -0.005)]],
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


def ticked_v(glyph, gs, bounds, length, taper, curve=0.0):
    """Return the V's outline with its right arm continued past the cap line as a pen tick.

    The arm's top (and its serif, if any) is cut away along the arm's own edges, then a
    new stroke continues the arm on the same slant, tapering to a hairline point
    `length` cap heights above the cap line. `taper` is the tip width as a share of the
    arm's width. Needs skia-pathops.
    """
    import pathops
    from fontTools.pens.recordingPen import RecordingPen

    xmin, _, xmax, top = bounds
    v = pathops.Path()
    glyph.draw(v.getPen())

    def rect(x0, y0, x1, y1):
        r = pathops.Path()
        pen = r.getPen()
        pen.moveTo((x0, y0)); pen.lineTo((x1, y0)); pen.lineTo((x1, y1)); pen.lineTo((x0, y1))
        pen.closePath()
        return r

    def right_arm_at(y):
        """x-interval of the right arm at height y (bounds of a thin slice)."""
        mid = (xmin + xmax) / 2
        sl = pathops.op(v, rect(mid, y, xmax + 10, y + 1), pathops.PathOp.INTERSECTION)
        x0, _, x1, _ = sl.bounds
        return x0, x1

    ya, yb = top * 0.40, top * 0.68
    a0, a1 = right_arm_at(ya)
    b0, b1 = right_arm_at(yb)
    s_in = (b0 - a0) / (yb - ya)  # slant of the inner edge
    s_out = (b1 - a1) / (yb - ya)  # slant of the outer edge
    w = b1 - b0

    def inner(y):
        return b0 + s_in * (y - yb)

    def outer(y):
        return b1 + s_out * (y - yb)

    big = top * 3
    # Cut everything right of the arm's inner edge above yb (arm top + serif).
    cut = pathops.Path()
    pen = cut.getPen()
    pen.moveTo((inner(yb) - 0.5, yb))
    pen.lineTo((inner(yb + big) - 0.5, yb + big))
    pen.lineTo((xmax + big, yb + big))
    pen.lineTo((xmax + big, yb))
    pen.closePath()
    v = pathops.op(v, cut, pathops.PathOp.DIFFERENCE)
    # Remove the right arm's top serif entirely: cut from the start of the rightmost
    # ink run along the cap line, above the serif's bracket.
    sl = pathops.op(v, rect(xmin - 10, top * 0.95, xmax + 10, top * 0.95 + 1), pathops.PathOp.INTERSECTION)
    runs = []
    rp = RecordingPen()
    sl.draw(rp)
    for op, pts in rp.value:
        if op == "moveTo":
            runs.append([pts[0][0], pts[0][0]])
        elif pts and runs:
            for pt in pts:
                runs[-1][0] = min(runs[-1][0], pt[0])
                runs[-1][1] = max(runs[-1][1], pt[0])
    if runs:
        # Keep only the left arm's top (the leftmost ink run); cut everything to its right.
        x_cut = min(runs, key=lambda r: r[0])[1] + 1
        v = pathops.op(v, rect(x_cut, top * 0.86, xmax + big, top + big), pathops.PathOp.DIFFERENCE)

    # New stroke: from the cut, along the arm's slant, tapering to the tip.
    ytip = top * (1 + length)
    tip_c = (inner(ytip) + outer(ytip)) / 2 + curve * top  # curve > 0 flicks the tip outward
    tw = w * taper
    stroke = pathops.Path()
    pen = stroke.getPen()
    y0 = top * 0.45
    pen.moveTo((inner(y0), y0))
    pen.lineTo((outer(y0), y0))
    pen.qCurveTo((outer(top), top), (tip_c + tw / 2, ytip))
    pen.lineTo((tip_c - tw / 2, ytip))
    pen.qCurveTo((inner(top * 0.95), top * 0.95), (inner(y0), y0))
    pen.closePath()
    v = pathops.op(v, stroke, pathops.PathOp.UNION)

    rec = RecordingPen()
    v.draw(rec)
    return rec


def layout_line(segments):
    """Return [(role, d)] and (ink_left, ink_right, cap_px) for a line on baseline 0."""
    out, x, left, right, cap_px = [], 0.0, None, 0.0, 0.0
    for seg_i, (text, fkey, size, role, track, *opt) in enumerate(segments):
        extra = opt[0] if opt and isinstance(opt[0], dict) else {}
        tick = opt[0] if opt and not isinstance(opt[0], dict) else extra.get("tick")
        dy = extra.get("dy", 0) * size  # baseline shift in em (negative = up)
        x += extra.get("dx", 0) * size
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
                gs[name].draw(TransformPen(pen, (k, 0, 0, -k, x, dy)))
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
        y += cap_px if i == 0 else cap_px * 1.45 + lines[i - 1][1][2] * 0.9
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

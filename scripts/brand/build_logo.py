"""Build The Valet logo SVGs: outlined wordmark glyphs plus a drawn, fluid check-mark V.

The V keeps the original idea (a V that is also a check mark, in bordeaux) but is drawn
as one calligraphic stroke: a full, rounded left arm and a fine right arm that sweeps
up past the cap line, like a pen tick.

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

# name: (font file, axis location, tracking in em, V height in cap heights, V width factor)
VARIANTS = {
    "sans": ("Jost.ttf", {"wght": 430}, 0.0, 1.38, 0.92),
    "serif": ("Cormorant.ttf", {"wght": 560}, 0.005, 1.42, 0.92),
    "didone": ("Bodoni.ttf", {"wght": 430, "opsz": 28}, 0.0, 1.38, 0.9),
}


class Face:
    def __init__(self, file, loc):
        self.font = instantiateVariableFont(TTFont(FONTS / file), loc)
        self.gs = self.font.getGlyphSet()
        self.cmap = self.font.getBestCmap()
        self.hmtx = self.font["hmtx"]
        self.upm = self.font["head"].unitsPerEm
        self.cap = self.font["OS/2"].sCapHeight

    def name(self, ch):
        return self.cmap[ord(ch)]

    def bounds(self, ch):
        bp = BoundsPen(self.gs)
        self.gs[self.name(ch)].draw(bp)
        return bp.bounds

    def run(self, text, x, track):
        """Outline `text` on baseline y=0 (SVG y-down). Returns (d, ink_right)."""
        parts = []
        for ch in text:
            n = self.name(ch)
            pen = SVGPathPen(self.gs)
            self.gs[n].draw(TransformPen(pen, (1, 0, 0, -1, x, 0)))
            parts.append(pen.getCommands())
            right = x + self.bounds(ch)[2]
            x += self.hmtx[n][0] + track
        return " ".join(parts), right


def fluid_v(x, top, H, wf):
    """Calligraphic check-mark V in a box of height H (top at y=top), width wf*H.

    Left arm: full, rounded head, tapering into a soft vertex.
    Right arm: fine stroke sweeping up with a gentle concave curve to a tapered tip
    that rises slightly above the left arm, so the V also reads as a tick.
    """
    W = wf * H

    def p(u, v):
        return f"{x + u * W:.1f},{top + v * H:.1f}"

    d = (
        f"M{p(0.02, 0.06)} "
        f"C{p(0.06, 0.0)} {p(0.22, -0.01)} {p(0.27, 0.05)} "  # rounded head
        f"C{p(0.33, 0.30)} {p(0.42, 0.58)} {p(0.50, 0.80)} "  # left arm, inner edge
        f"C{p(0.62, 0.45)} {p(0.80, 0.12)} {p(1.0, -0.10)} "  # right arm, inner edge to tip
        f"C{p(0.84, 0.16)} {p(0.68, 0.55)} {p(0.57, 0.96)} "  # right arm, outer edge
        f"C{p(0.54, 1.03)} {p(0.43, 1.03)} {p(0.40, 0.96)} "  # soft vertex
        f"C{p(0.27, 0.64)} {p(0.12, 0.30)} {p(0.02, 0.06)} Z"  # left arm, outer edge
    )
    return d, x + W


def build(variant, theme):
    file, loc, track_em, vscale, wf = VARIANTS[variant]
    f, c = Face(file, loc), COLORS[theme]
    track = track_em * f.upm
    H = f.cap * vscale
    top = -H + f.cap * 0.02  # V rests a hair below the baseline (overshoot)
    the_d, the_r = f.run("The", 0, track)
    v_d, v_r = fluid_v(the_r + f.cap * 0.26, top, H, wf)
    alet_x = v_r + f.cap * 0.11 - f.bounds("a")[0]
    alet_d, right = f.run("alet.", alet_x, track)
    pad = f.cap * 0.12
    y0 = top - H * 0.12 - pad
    vb = f"{-pad:.0f} {y0:.0f} {right + 2 * pad:.0f} {-y0 + pad + f.cap * 0.05:.0f}"
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="The Valet">\n'
        f"  <title>The Valet</title>\n"
        f'  <path fill="{c["ink"]}" d="{the_d} {alet_d}"/>\n'
        f'  <path fill="{c["accent"]}" d="{v_d}"/>\n'
        f"</svg>\n"
    )


def monogram(theme, transparent=False):
    c = COLORS[theme]
    size, H, wf = 1000, 600, 0.92
    d, _ = fluid_v(0, 0, H, wf)
    ox, oy = (size - wf * H) / 2 + size * 0.012, (size - H) / 2 + H * 0.04
    bg = "" if transparent else f'<rect width="{size}" height="{size}" rx="180" fill="{c["bg"]}"/>'
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" role="img" aria-label="The Valet">'
        f'{bg}<g transform="translate({ox:.1f} {oy:.1f})"><path fill="{c["accent"]}" d="{d}"/></g></svg>\n'
    )


OUT.mkdir(parents=True, exist_ok=True)
for v in sys.argv[3:] or VARIANTS:
    for theme in COLORS:
        (OUT / f"thevalet-logo-{v}-{theme}.svg").write_text(build(v, theme))
for theme in COLORS:
    (OUT / f"thevalet-monogram-{theme}.svg").write_text(monogram(theme))
    (OUT / f"thevalet-monogram-{theme}-transparent.svg").write_text(monogram(theme, True))
print("ok")

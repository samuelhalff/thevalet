"""Build The Valet logo SVGs from outlined Archivo glyphs and a drawn check-mark V.

Usage: python3 build_logo.py <Archivo[wdth,wght].ttf> <out_dir>
"""
import sys
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

FONT, OUT = sys.argv[1], Path(sys.argv[2])
WDTH, WGHT = 125, 560

COLORS = {
    "light": {"ink": "#1F1A1B", "accent": "#6B1D2A"},
    "dark": {"ink": "#F4EEE9", "accent": "#C98A93"},
}

font = instantiateVariableFont(TTFont(FONT), {"wdth": WDTH, "wght": WGHT})
gs, cmap, hmtx = font.getGlyphSet(), font.getBestCmap(), font["hmtx"]
CAP = font["OS/2"].sCapHeight


def kern(a, b):
    try:
        for sub in font["GPOS"].table.LookupList.Lookup:
            pass
    except KeyError:
        pass
    return 0


def text_path(text, x0, tracking):
    """Outline `text` with baseline y=0 (SVG y-down), return (d, advance_end)."""
    parts, x = [], x0
    for ch in text:
        name = cmap[ord(ch)]
        pen = SVGPathPen(gs)
        gs[name].draw(TransformPen(pen, (1, 0, 0, -1, x, 0)))
        parts.append(pen.getCommands())
        x += hmtx[name][0] + tracking
    return " ".join(parts), x - tracking


def ink_right(text, x0, tracking):
    """Right edge of the last glyph's ink, so spacing is optical, not metric."""
    x, last = x0, None
    for ch in text:
        name = cmap[ord(ch)]
        last = (name, x)
        x += hmtx[name][0] + tracking
    bp = BoundsPen(gs)
    gs[last[0]].draw(bp)
    return last[1] + bp.bounds[2]


def ink_left(ch):
    bp = BoundsPen(gs)
    gs[cmap[ord(ch)]].draw(bp)
    return bp.bounds[0]


def check_v(x, H, top):
    """The signature V: thick descending arm, a short tick, a fine rising arm.

    Coordinates are in a box of height H whose top is at y=top (y-down).
    Ratios keep the original's thick/thin contrast but give it a calmer slant.
    """
    def P(u, v):
        return f"{x + u * H:.1f},{top + v * H:.1f}"

    thick, thin = 0.205, 0.085
    # Thick arm: from the top-left down to the tick.
    arm = f"M{P(0, 0)} L{P(thick, 0)} L{P(0.42, 0.66)} L{P(0.42 - thick, 0.66)} Z"
    # Fine arm with foot: from the bottom vertex up to the top-right, and a
    # short horizontal foot to the left that echoes the original check mark.
    vx = 0.47  # bottom vertex (left edge)
    fine = (
        f"M{P(vx, 1)} L{P(0.72 - thin * 0.2, 0)} L{P(0.72 + thin, 0)} "
        f"L{P(vx + thin * 1.15, 1)} L{P(vx - 0.13, 1)} L{P(vx - 0.13, 1 - 0.075)} "
        f"L{P(vx + 0.035, 1 - 0.075)} Z"
    )
    return arm + " " + fine, x + (0.72 + thin) * H


def build(theme, with_v_scale=1.30):
    c = COLORS[theme]
    track = -6
    H = CAP * with_v_scale
    top = -CAP * with_v_scale  # V sits on the baseline, rising above caps
    the_d, _ = text_path("The", 0, track)
    gap = CAP * 0.30
    vx = ink_right("The", 0, track) + gap
    v_d, v_end = check_v(vx, H, top)
    alet_x = v_end + gap * 0.62 - ink_left("a")
    alet_d, end = text_path("alet.", alet_x, track)
    width = ink_right("alet.", alet_x, track)
    pad = 40
    vb = f"{-pad} {top - pad:.0f} {width + 2 * pad:.0f} {-top + 2 * pad + 20:.0f}"
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="The Valet">
  <title>The Valet</title>
  <path fill="{c['ink']}" d="{the_d} {alet_d}"/>
  <path fill="{c['accent']}" d="{v_d}"/>
</svg>
"""


def monogram(theme):
    c = COLORS[theme]
    H = 640
    v_d, v_end = check_v(0, H, 0)
    w = v_end
    size = 1000
    ox, oy = (size - w) / 2, (size - H) / 2
    bg = "#F7F1EC" if theme == "light" else "#1F1A1B"
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" role="img" aria-label="The Valet">
  <rect width="{size}" height="{size}" rx="180" fill="{bg}"/>
  <g transform="translate({ox:.1f} {oy:.1f})"><path fill="{c['accent']}" d="{v_d}"/></g>
</svg>
"""


OUT.mkdir(parents=True, exist_ok=True)
for theme in COLORS:
    (OUT / f"thevalet-logo-{theme}.svg").write_text(build(theme))
    (OUT / f"thevalet-monogram-{theme}.svg").write_text(monogram(theme))
print("ok")

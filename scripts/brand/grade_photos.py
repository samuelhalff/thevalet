"""Grade and export site photography to public/images/ (docs/DESIGN.md, Photography).

Every photo gets the same treatment so stock pictures read as one series, in the brand's palette:
slightly desaturated, shadows pulled towards ink (#221A1C), highlights towards paper (#F6F1F1),
then cropped to its slot ratio and saved as metadata-free WebP.

Usage: python3 scripts/brand/grade_photos.py <src.jpg> <name> <bleed|portrait> [focus_x focus_y]
focus_x/focus_y (0..1) place the crop window; default is the centre.
"""

import sys
from pathlib import Path

from PIL import Image, ImageEnhance

INK = (34, 26, 28)
PAPER = (246, 241, 241)
SLOTS = {"bleed": (2000, 1000), "portrait": (1040, 1300)}  # 2:1 and 4:5
OUT = Path(__file__).resolve().parents[2] / "public" / "images"


def crop_to(img: Image.Image, ratio: float, fx: float, fy: float) -> Image.Image:
    w, h = img.size
    if w / h > ratio:
        cw, ch = int(h * ratio), h
    else:
        cw, ch = w, int(w / ratio)
    left = min(max(int(fx * w - cw / 2), 0), w - cw)
    top = min(max(int(fy * h - ch / 2), 0), h - ch)
    return img.crop((left, top, left + cw, top + ch))


def grade(img: Image.Image) -> Image.Image:
    img = ImageEnhance.Color(img).enhance(0.8)
    img = ImageEnhance.Contrast(img).enhance(0.94)
    # Split tone: per-channel curve mapping 0 -> ink and 255 -> paper, blended at 35% so the
    # photo keeps its own colour but sits on the site's tinted neutrals.
    luts = []
    for lo, hi in zip(INK, PAPER):
        luts += [round(v * 0.65 + (lo + (hi - lo) * v / 255) * 0.35) for v in range(256)]
    return img.point(luts)


def main() -> None:
    src, name, slot = sys.argv[1], sys.argv[2], sys.argv[3]
    fx, fy = (float(sys.argv[4]), float(sys.argv[5])) if len(sys.argv) > 5 else (0.5, 0.5)
    w, h = SLOTS[slot]
    img = Image.open(src).convert("RGB")
    img = crop_to(img, w / h, fx, fy).resize((w, h), Image.LANCZOS)
    OUT.mkdir(parents=True, exist_ok=True)
    out = OUT / f"{name}.webp"
    grade(img).save(out, "WEBP", quality=72, method=6)
    print(f"{out} {out.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()

"""Grade and export site photography to public/images/ (docs/DESIGN.md, Photography).

Every photo gets the same treatment so stock pictures read as one series, in the brand's palette:
a rose-aubergine duotone with a third of the original colour kept, then cropped to its slot ratio
and saved as metadata-free WebP.

Usage: python3 scripts/brand/grade_photos.py <src.jpg> <name> portrait [focus_x focus_y]
focus_x/focus_y (0..1) place the crop window; default is the centre.
"""

import sys
from pathlib import Path

from PIL import Image, ImageEnhance

DUO_DARK = (52, 34, 40)
DUO_LIGHT = (246, 226, 224)
SLOTS = {"portrait": (1040, 1300)}  # 4:5, shown in an arched frame
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
    # Rose-aubergine duotone (aubergine #342228 -> blush #F6E2E0), then 35% of the original colour
    # back in, so warm lights (windows, candles) still glow but every photo shares the palette.
    duo = []
    for dark, light in zip(DUO_DARK, DUO_LIGHT):
        duo.append([round(dark + (light - dark) * (v / 255) ** 0.72) for v in range(256)])
    grey = img.convert("L")
    toned = Image.merge("RGB", [grey.point(lut) for lut in duo])
    return Image.blend(toned, ImageEnhance.Color(img).enhance(0.8), 0.35)


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

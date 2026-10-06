"""P10 gacha asset builder.

Inputs (AI white-bg / full-bg raw PNGs in dated folder under this dir):
  * meta id 1790755085 -> gacha box (white bg)
  * meta id 1790755088 -> card back (white bg)
  * watermark-free background PNG -> starry night full-bleed BG

Outputs to apps/web/src/assets/gacha/:
  gacha-box@2x.webp / gacha-card-back@2x.webp / gacha-bg-starry@2x.webp
  glow-normal|rare|legendary.png   (procedural soft radial glows w/ alpha)

Run with the asset venv (.venv-art, rembg + onnxruntime + Pillow):
  ..\\.venv-art\\Scripts\\python.exe build_gacha.py
"""
import glob
import os
import numpy as np
from PIL import Image, ImageFilter
from rembg import remove, new_session

BASE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(BASE, "2026-09-30")
OUT = os.path.join(BASE, "..", "..", "apps", "web", "src", "assets", "gacha")
OUT = os.path.abspath(OUT)
os.makedirs(OUT, exist_ok=True)


def find_raw(meta_id: str) -> str:
    hits = sorted(
        glob.glob(os.path.join(RAW, f"seedream_{meta_id}_*.png"))
        + glob.glob(os.path.join(RAW, f"seedream_{meta_id}_*.jpg"))
        + glob.glob(os.path.join(RAW, f"seedream_{meta_id}_*.jpeg"))
    )
    if not hits:
        raise FileNotFoundError(f"no raw for {meta_id} in {RAW}")
    return hits[0]


def trim(rgba: Image.Image, margin_frac: float = 0.04) -> Image.Image:
    bbox = rgba.getbbox()
    if not bbox:
        return rgba
    l, t, r, b = bbox
    m = int(margin_frac * max(r - l, b - t))
    l = max(0, l - m); t = max(0, t - m)
    r = min(rgba.width, r + m); b = min(rgba.height, b + m)
    return rgba.crop((l, t, r, b))


def white_cutout(im: Image.Image, white_thr: int = 238) -> Image.Image:
    """Remove only the white background connected to the canvas border.

    Unlike rembg (which mistakes the deep-blue card interior for background),
    this flood-fills near-white pixels from the four edges, so any white pocket
    fully enclosed by the object (keyhole etc.) is preserved.
    """
    arr = np.asarray(im.convert("RGB"))
    h, w, _ = arr.shape
    near_white = np.all(arr >= white_thr, axis=2)

    # Flood-fill near-white region starting from every border pixel.
    bg = np.zeros((h, w), dtype=bool)
    stack = []
    for x in range(w):
        stack.append((0, x)); stack.append((h - 1, x))
    for y in range(h):
        stack.append((y, 0)); stack.append((y, w - 1))
    while stack:
        y, x = stack.pop()
        if bg[y, x] or not near_white[y, x]:
            continue
        bg[y, x] = True
        if y > 0: stack.append((y - 1, x))
        if y < h - 1: stack.append((y + 1, x))
        if x > 0: stack.append((y, x - 1))
        if x < w - 1: stack.append((y, x + 1))

    alpha = np.where(bg, 0, 255).astype(np.uint8)
    # Slight feather on the cut edge for a clean, non-jagged outline.
    a = Image.fromarray(alpha, "L").filter(ImageFilter.GaussianBlur(0.8))
    out = im.convert("RGBA")
    out.putalpha(a)
    return out


def cap_size(img: Image.Image, longest: int) -> Image.Image:
    w, h = img.size
    if max(w, h) <= longest:
        return img
    if w >= h:
        nw, nh = longest, round(h * longest / w)
    else:
        nh, nw = longest, round(w * longest / h)
    return img.resize((nw, nh), Image.LANCZOS)


def build_card_back(longest: int) -> None:
    src = find_raw("1790755088")
    im = Image.open(src).convert("RGB")
    cut = white_cutout(im)
    cut = trim(cut)
    cut = cap_size(cut, longest)
    path = os.path.join(OUT, "gacha-card-back@2x.webp")
    cut.save(path, "WEBP", quality=90, method=6)
    print("saved", path, cut.size)



def build_cutout(meta_id: str, out_name: str, longest: int, session) -> None:
    src = find_raw(meta_id)
    im = Image.open(src).convert("RGB")
    cut = remove(im, session=session, post_process_mask=True)
    cut = trim(cut)
    cut = cap_size(cut, longest)
    path = os.path.join(OUT, out_name)
    cut.save(path, "WEBP", quality=90, method=6)
    print("saved", path, cut.size)


def build_background() -> None:
    # watermark-free regeneration is the newest full-bg PNG (not box/card).
    box_id, card_id = "1790755085", "1790755088"
    cands = sorted(
        p for p in glob.glob(os.path.join(RAW, "seedream_*_1.png"))
        if box_id not in os.path.basename(p) and card_id not in os.path.basename(p)
    )
    if not cands:
        raise FileNotFoundError("no background raw found")
    src = cands[-1]
    im = Image.open(src).convert("RGB")
    path = os.path.join(OUT, "gacha-bg-starry@2x.webp")
    im.save(path, "WEBP", quality=88, method=6)
    print("saved", path, im.size, "from", os.path.basename(src))


def build_glow(name: str, rgb) -> None:
    size = 256
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    cx = cy = (size - 1) / 2.0
    maxr = size / 2.0
    px = img.load()
    for y in range(size):
        for x in range(size):
            d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5 / maxr
            if d < 1.0:
                # bright core -> soft edge
                a = int(255 * max(0.0, (1.0 - d) ** 2.2))
                px[x, y] = (rgb[0], rgb[1], rgb[2], a)
    path = os.path.join(OUT, f"glow-{name}.png")
    img.save(path, "PNG")
    print("saved", path)


def main() -> None:
    print("loading u2net session...")
    session = new_session("u2net")
    build_cutout("1790755085", "gacha-box@2x.webp", 640, session)
    build_cutout("1790758869", "gacha-box-open@2x.webp", 720, session)
    build_card_back(640)
    build_background()
    # normal blue / rare purple / legendary gold (match RARITY_META hues)
    build_glow("normal", (90, 160, 255))
    build_glow("rare", (186, 104, 224))
    build_glow("legendary", (255, 200, 70))
    print("done ->", OUT)


if __name__ == "__main__":
    main()

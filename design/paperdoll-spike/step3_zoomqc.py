"""Step 3: zoom-in QC of the critical seams in the 3-slot model.

Recomposes scenes from the layers produced by step2 and crops / enlarges the
risk areas:

  * hat-hair seam : one shot PER HAT — the independent hat (with its own band R)
                    worn on a body, cropped around that hat's head region. Look
                    for a 1px gap, a dark outline, doubled brim, white fringe,
                    hair poking out or a crown that was wrongly cut.
  * shoe-ankle    : where the horizontal-cut shoe collar wraps the bare leg —
                    look for a gap, skin showing through, or a hard cut line.

Read-only: it loads layers/outfits|hats|shoes and writes a contact sheet to
_tmp/qc/zoom-qc.png. Driven by the registries; missing layers are skipped.
Run after step2.
"""
import os
from PIL import Image, ImageDraw
import step2_layers as s2

ODIR, HDIR, SDIR = s2.ODIR, s2.HDIR, s2.SDIR


def lay(path):
    return Image.open(path).convert("RGBA")


def band_crop_box(hat_id, pad=90):
    """Head-region crop box enclosing all of a hat's ellipses (+pad), clamped."""
    xs, ys_top, ys_bot = [], [], []
    for x0, y0, x1, y1 in s2.HATS[hat_id]["band"].values():
        xs += [x0, x1]
        ys_top.append(y0)
        ys_bot.append(y1)
    return (max(0, min(xs) - pad), max(0, min(ys_top) - pad),
            min(s2.W, max(xs) + pad), min(s2.H, max(ys_bot) + pad + 120))


# shared layers (present when step2 produced them)
shoe_path = os.path.join(SDIR, "shoe-default.png")
shoe = lay(shoe_path) if os.path.exists(shoe_path) else None

# choose a body to inspect seams on: explorer if present else first available
body_id = None
for cand in ("explorer", "default"):
    if os.path.exists(os.path.join(ODIR, f"outfit-{cand}-nohat.png")):
        body_id = cand
        break

shots = []
if body_id is not None:
    base_nohat = lay(os.path.join(ODIR, f"outfit-{body_id}-nohat.png"))
    # shoe-ankle collar
    if shoe is not None:
        shots.append((f"shoe-ankle ({body_id})",
                      [base_nohat, shoe],
                      (620, 1660, 1430, 1940)))
    # one hat-hair seam per available hat
    for hid in s2.HATS:
        hat_path = os.path.join(HDIR, f"hat-{hid}.png")
        fh_path = os.path.join(ODIR, f"outfit-{body_id}-forhat-{hid}.png")
        if not (os.path.exists(hat_path) and os.path.exists(fh_path)):
            continue
        order = [lay(fh_path)]
        if shoe is not None:
            order.append(shoe)
        order.append(lay(hat_path))
        shots.append((f"hat-hair {hid} (on {body_id})", order,
                      band_crop_box(hid)))

tw = 720
tiles = []
for label, order, box in shots:
    img = s2.compose(order).crop(box)
    scale = tw / img.width
    img = img.resize((tw, max(1, round(img.height * scale))), Image.LANCZOS)
    tile = Image.new("RGB", (tw, img.height + 30), (255, 255, 255))
    tile.paste(img, (0, 0))
    ImageDraw.Draw(tile).text((6, img.height + 8), label, fill=(20, 20, 20))
    tiles.append(tile)

sheet = Image.new("RGB", (tw, sum(t.height for t in tiles) + 20), (255, 255, 255))
y = 0
for t in tiles:
    sheet.paste(t, (0, y))
    y += t.height + 10

out = os.path.join(s2.QDIR, "zoom-qc.png")
os.makedirs(s2.QDIR, exist_ok=True)
sheet.save(out)
print("zoom ->", out)

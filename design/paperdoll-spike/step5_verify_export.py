"""Step 5: verify the EXPORTED webp assets via an independent read-back path.

v5-aware (2026-10-03): production ships bodies + gear (item hats / heads /
masks) + shoe and composes at RUNTIME, so a purely static recompose uses the
baked regression truth instead:
  * body        : layers/bodies/body-<o>@2x.webp (nohat look)
  * +hat look   : _truth/outfits/<o>-forhat-<h>  (hole already baked)
                  + shoe
                  + top layer:
                      wizard -> _truth/hats/hat-wizard-on-<o> (per-body relit)
                      frog/elf (head gear) -> layers/heads/head-<h>
                      explorer/scientist (item) -> layers/hats/hat-<h>
The runtime path itself (erase mask + neck relight) is regression-tested in
the app at #paperdoll-rt against these same truth images.

Also lays out all icons. Output: _tmp/qc/export-verify.png
"""
import os
import json
from PIL import Image, ImageDraw

BASE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BASE, "_export")
I = os.path.join(OUT, "icons")
QDIR = os.path.join(BASE, "_tmp", "qc")
os.makedirs(QDIR, exist_ok=True)

with open(os.path.join(OUT, "manifest.json"), encoding="utf-8") as f:
    MANIFEST = json.load(f)


def lay(path):
    return Image.open(os.path.join(OUT, path)).convert("RGBA")


def checker(size, cell=32):
    img = Image.new("RGB", size, (222, 222, 222))
    d = ImageDraw.Draw(img)
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            if (x // cell + y // cell) % 2:
                d.rectangle([x, y, x + cell - 1, y + cell - 1], fill=(186, 186, 186))
    return img


def compose(order):
    bg = checker((2048, 2048))
    for o in order:
        bg.paste(o, (0, 0), o)
    return bg


shoe = lay(MANIFEST["shoes"][0]["layer"]) if MANIFEST["shoes"] else None
bodies = {b["id"]: b for b in MANIFEST["bodies"]}
gear = {g["id"]: g for g in MANIFEST["gear"]}

# top-layer picker for a (outfit, gear) truth recompose
def top_layer(oid, gid):
    g = gear[gid]
    # pair heads (seam.relit) have per-body relit truth heads; other head
    # gear and item hats share one exported layer.
    if g["kind"] == "head" and g.get("seam", {}).get("relit"):
        return lay(os.path.join("_truth", "hats", f"hat-{gid}-on-{oid}@2x.webp"))
    return lay(g["layer"])


looks = []
for oid in bodies:
    looks.append((f"{oid} nohat", [lay(bodies[oid]["layer"])]))
    for gid in gear:
        truth_body = os.path.join(
            "_truth", "outfits", f"outfit-{oid}-forhat-{gid}@2x.webp")
        if not os.path.exists(os.path.join(OUT, truth_body)):
            continue
        order = [lay(truth_body)]
        if shoe is not None:
            order.append(shoe)
        order.append(top_layer(oid, gid))
        looks.append((f"{oid}+{gid}", order))

# ---- icons ----
icons = [(f"body:{b['id']}", os.path.basename(b["icon_file"]))
         for b in MANIFEST["bodies"]]
icons += [(f"gear:{g['id']}", os.path.basename(g["icon_file"]))
          for g in MANIFEST["gear"]]
icons += [(f"shoe:{s['id']}", os.path.basename(s["icon_file"]))
          for s in MANIFEST["shoes"]]

# ---- layout ----
cell = 340
rowh = cell + 26
per_row = 6
look_rows = (len(looks) + per_row - 1) // per_row
iconc = 200
icon_per_row = 8
icon_rows = (len(icons) + icon_per_row - 1) // icon_per_row
width = max(cell * per_row, iconc * icon_per_row)
height = rowh * look_rows + 24 + (iconc + 24) * icon_rows + 20
sheet = Image.new("RGB", (width, height), (255, 255, 255))

for i, (label, order) in enumerate(looks):
    bg = compose(order).resize((cell, cell), Image.LANCZOS)
    t = Image.new("RGB", (cell, rowh), (255, 255, 255))
    t.paste(bg, (0, 0))
    ImageDraw.Draw(t).text((6, cell + 6), label, fill=(20, 20, 20))
    sheet.paste(t, ((i % per_row) * cell, (i // per_row) * rowh))

y0 = rowh * look_rows + 24
for k, (label, fn) in enumerate(icons):
    ic = Image.open(os.path.join(I, fn)).convert("RGBA").resize((iconc, iconc),
                                                                Image.LANCZOS)
    bg = checker((iconc, iconc))
    bg.paste(ic, (0, 0), ic)
    t = Image.new("RGB", (iconc, iconc + 22), (255, 255, 255))
    t.paste(bg, (0, 0))
    ImageDraw.Draw(t).text((4, iconc + 5), label, fill=(20, 20, 20))
    sheet.paste(t, ((k % icon_per_row) * iconc,
                    y0 + (k // icon_per_row) * (iconc + 24)))

p = os.path.join(QDIR, "export-verify.png")
sheet.save(p)
print(p, "looks:", len(looks))

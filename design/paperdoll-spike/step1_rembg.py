"""Step 1: rembg cutout + coordinate grids -- the only first-stage tool.

Reads the AI white-bg master images from masters/ and for each master writes:
  _step1_export/<name>-rmbg.png    full-res RGBA cutout, input to step2/step3/measure
  _step1_export/grid/<name>-grid.png  checkerboard-backed 1024 grid labelled in ORIGINAL
                             2048-pixel coordinates, for measuring masks/anchors
Also writes a 2x2 checkerboard contact sheet at _step1_export/qc/contact-rmbg.png.

rembg removes the white background, the soft under-feet contact shadow and the
enclosed background between the legs, with feathered edges. The retired border
flood-fill cutout could not reach enclosed white pockets and could not separate
the white shirt from the shadow, so it was removed; only its coordinate-grid
idea is kept here (drawn over the clean cutout).

Model is fixed to birefnet-general-lite (2026-10-03 A/B on the barefoot master:
contour 1-3px more faithful than u2net, no dark under-feet rim, same rembg API;
comparison sheets since discarded). The u2net fallback was removed 2026-10-06;
see docs/topics/cutout-model-comparison.md for the full comparison.

Run with the Python 3.12 asset venv (.venv-art) that has rembg + onnxruntime.
Usage: <venv-art python> step1_rembg.py
"""
import os
from PIL import Image, ImageDraw
from rembg import remove, new_session

BASE = os.path.dirname(os.path.abspath(__file__))
MDIR = os.path.join(BASE, "masters")
CDIR = os.path.join(BASE, "_step1_export")
QDIR = os.path.join(CDIR, "qc")
GDIR = os.path.join(CDIR, "grid")
for _d in (CDIR, QDIR, GDIR):
    os.makedirs(_d, exist_ok=True)

# Auto-discover every white-bg master in masters/ (recursive: series subdirs)
# so new batches need no edits here. Sorted for a stable contact-sheet layout.
FILES = sorted(
    os.path.relpath(os.path.join(root, fn), MDIR)
    for root, _dirs, fns in os.walk(MDIR)
    for fn in fns
    if fn.lower().endswith(".png") and not fn.lower().endswith("-grid.png")
) if os.path.isdir(MDIR) else []

GRID_EVERY = 100     # original pixels
LABEL_EVERY = 500    # original pixels


def checker(size, cell=32):
    img = Image.new("RGB", size, (222, 222, 222)); d = ImageDraw.Draw(img)
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            if (x // cell + y // cell) % 2:
                d.rectangle([x, y, x + cell - 1, y + cell - 1], fill=(186, 186, 186))
    return img


def grid_overlay(rgba):
    """Checkerboard-backed cutout plus a coordinate grid (labels are ORIGINAL
    2048-space), resized to 1024 for measuring masks / anchors."""
    g = checker(rgba.size)
    g.paste(rgba, (0, 0), rgba)
    d = ImageDraw.Draw(g)
    w, h = g.size
    for x in range(0, w + 1, GRID_EVERY):
        major = (x % LABEL_EVERY == 0)
        d.line([(x, 0), (x, h)], fill=(90, 150, 255) if major else (200, 222, 255), width=3 if major else 1)
        if major:
            d.text((x + 4, 4), str(x), fill=(20, 80, 200))
    for y in range(0, h + 1, GRID_EVERY):
        major = (y % LABEL_EVERY == 0)
        d.line([(0, y), (w, y)], fill=(90, 150, 255) if major else (200, 222, 255), width=3 if major else 1)
        if major:
            d.text((4, y + 4), str(y), fill=(200, 40, 40))
    return g.resize((1024, 1024), Image.LANCZOS)


def main():
    print("loading session birefnet-general-lite (first run downloads weights)...")
    session = new_session("birefnet-general-lite")
    cell = 470
    per_row = 2
    n_rows = max(1, (len(FILES) + per_row - 1) // per_row)
    sheet = Image.new("RGB", (cell * per_row, (cell + 30) * n_rows), (255, 255, 255))
    for i, fname in enumerate(FILES):
        stem = os.path.basename(fname).replace(".png", "")
        im = Image.open(os.path.join(MDIR, fname)).convert("RGB")
        out = remove(im, session=session, post_process_mask=True)
        cut_path = os.path.join(CDIR, stem + "-rmbg.png")
        out.save(cut_path)
        grid_overlay(out).save(os.path.join(GDIR, stem + "-grid.png"))
        comp = checker((im.width, im.height)); comp.paste(out, (0, 0), out)
        comp = comp.resize((cell, cell), Image.LANCZOS)
        c = Image.new("RGB", (cell, cell + 30), (255, 255, 255))
        c.paste(comp, (0, 0)); ImageDraw.Draw(c).text((6, cell + 6), fname, fill=(20, 20, 20))
        sheet.paste(c, ((i % 2) * cell, (i // 2) * (cell + 30)))
        print("saved", cut_path)
    contact = os.path.join(QDIR, "contact-rmbg.png")
    sheet.save(contact)
    print("contact ->", contact)
    print("grids   ->", GDIR)


if __name__ == "__main__":
    main()

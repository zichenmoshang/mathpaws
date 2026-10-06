"""Step 4: export staging paperdoll assets (pre-QC staging, NOT for the app).

Runs AFTER step2_layers.py (which writes layers/{outfits,hats,heads,masks,shoes}).

v5 runtime N+M layout (2026-10-03): the app composes body + shoe + ONE gear
layer at runtime, so the N outfits x M hats forhat matrix is no longer shipped
to production. Outputs (design/paperdoll-spike/_step4_export/, gitignored staging):

  layers/bodies/body-<o>@2x.webp            one per character (nohat)
  layers/heads/head-<h>@2x.webp             head-cut gear (frog/elf/wizard)
  layers/hats/hat-<h>@2x.webp               item hats (explorer/scientist)
  layers/masks/hole-<h>@2x.webp             item-hat erase mask (alpha channel)
  layers/shoes/shoe-default@2x.webp
  icons/<id>-icon.webp                      512^ item thumbnail (bbox-fit)
  manifest.json                             bodies / gear / shoes (full, incl.
                                            prompt_doc / master_image provenance)
  _truth/                                   OFFLINE REGRESSION ONLY:
    outfits/outfit-<o>-forhat-<h>@2x.webp   per-body baked truth bodies
    hats/hat-wizard-on-<o>@2x.webp          per-body relit wizard truth heads

Staging is QC-ed by step5_verify_export.py; only after acceptance does
step6_publish.py copy layers/icons + a slimmed manifest + the _truth subset
into apps/web/src/assets/paperdoll/. Geometry constants SSOT = step2_layers.py
registries; no separate anchors.json is emitted anymore.

Everything is derived from the step2 OUTFITS / HATS registries so the manifest
never drifts from the masks that actually produced the layers.
Outfits or hats whose layers were skipped in step2 (inputs not ready) are also
skipped here, keeping the script runnable mid-batch.
"""
import os
import json
import shutil
import numpy as np
from PIL import Image
import step2_layers as s2

SPIKE = s2.BASE
OUT = os.path.join(SPIKE, "_step4_export")
LDIR_OUT = os.path.join(OUT, "layers")
TRUTH_OUT = os.path.join(OUT, "_truth")
IDIR_OUT = os.path.join(OUT, "icons")
for _d in (os.path.join(LDIR_OUT, "bodies"),
           os.path.join(LDIR_OUT, "heads"),
           os.path.join(LDIR_OUT, "hats"),
           os.path.join(LDIR_OUT, "masks"),
           os.path.join(LDIR_OUT, "shoes"),
           os.path.join(TRUTH_OUT, "outfits"),
           os.path.join(TRUTH_OUT, "hats"),
           IDIR_OUT):
    os.makedirs(_d, exist_ok=True)

def export_layer(src_path, out_rel, base=LDIR_OUT):
    im = Image.open(src_path).convert("RGBA")
    p = os.path.join(base, out_rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    im.save(p, "WEBP", lossless=True, method=6)
    return im, p


def bbox(im, thresh=8):
    a = np.asarray(im)[:, :, 3]
    ys, xs = np.where(a > thresh)
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def save_icon(layer_im, out_name, size=512, pad=64):
    b = bbox(layer_im)
    crop = layer_im.crop(b)
    s = min((size - 2 * pad) / crop.width, (size - 2 * pad) / crop.height)
    crop = crop.resize((max(1, round(crop.width * s)),
                        max(1, round(crop.height * s))), Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(crop, ((size - crop.width) // 2, (size - crop.height) // 2), crop)
    p = os.path.join(IDIR_OUT, out_name)
    canvas.save(p, "WEBP", lossless=True, method=6)
    return p


def main():
    # Derived-only trees: wipe before re-export so renamed/removed assets
    # (e.g. the retired v4 layers/outfits forhat matrix) never linger.
    for d in (LDIR_OUT, TRUTH_OUT):
        if os.path.isdir(d):
            shutil.rmtree(d)
        os.makedirs(d, exist_ok=True)
    for _d in (os.path.join(LDIR_OUT, "bodies"),
               os.path.join(LDIR_OUT, "heads"),
               os.path.join(LDIR_OUT, "hats"),
               os.path.join(LDIR_OUT, "masks"),
               os.path.join(LDIR_OUT, "shoes"),
               os.path.join(TRUTH_OUT, "outfits"),
               os.path.join(TRUTH_OUT, "hats"),
               IDIR_OUT):
        os.makedirs(_d, exist_ok=True)

    # ---- production: one body per character (nohat full-canvas) ----
    body_records = []
    body_images = {}
    for oid, o in s2.OUTFITS.items():
        nohat_src = os.path.join(s2.ODIR, f"outfit-{oid}-nohat.png")
        if not os.path.exists(nohat_src):
            print("skip export body (no layer):", oid)
            continue
        body = export_layer(
            nohat_src, os.path.join("bodies", f"body-{oid}@2x.webp"))[0]
        save_icon(body, f"outfit-{oid}-icon.webp")
        body_images[oid] = body
        rec = {
            "id": oid,
            "cn_name": o["cn"],
            "series": o["series"],
            "icon_file": f"icons/outfit-{oid}-icon.webp",
            "layer": f"layers/bodies/body-{oid}@2x.webp",
            "prompt_doc": o["prompt_doc"],
        }
        if o["master_url"]:
            rec["master_image"] = o["master_url"]
        body_records.append(rec)

        # ---- regression truth: per-body forhat baked bodies ----
        for hid in s2.HATS:
            fh_src = os.path.join(s2.ODIR, f"outfit-{oid}-forhat-{hid}.png")
            if os.path.exists(fh_src):
                export_layer(fh_src, os.path.join(
                    "outfits", f"outfit-{oid}-forhat-{hid}@2x.webp"),
                    base=TRUTH_OUT)

    # ---- production gear: item hats (+erase mask) and head-cut gear ----
    gear_records = []
    for hid, h in s2.HATS.items():
        mode = h.get("cut_mode", "color")
        if mode == "head":
            head_src = os.path.join(s2.HHDIR, f"head-{hid}.png")
            if not os.path.exists(head_src):
                print("skip export head gear (no layer):", hid)
                continue
            head_im = export_layer(
                head_src, os.path.join("heads", f"head-{hid}@2x.webp"))[0]
            save_icon(head_im, f"hat-{hid}-icon.webp")
            head_cut = s2.HEAD_CUTS[hid]
            rec = {
                "id": hid,
                "cn_name": h["cn"],
                "kind": "head",
                "icon_file": f"icons/hat-{hid}-icon.webp",
                "layer": f"layers/heads/head-{hid}@2x.webp",
                "master_image": h["source"][1],
                "prompt_doc": h["prompt_doc"],
                "seam": {
                    "y0": head_cut - s2.HEAD_TRANSITIONS.get(
                        hid, s2.HEAD_TRANSITION),
                    "cut": head_cut,
                    "overlap": s2.HEAD_OVERLAP,
                    "sigma": s2.HEAD_FEATHERS.get(hid, s2.HEAD_FEATHER),
                    "skin_sample_rows_above_cut": 80,
                    # runtime applies the same head-ownership erase
                    # (hard rows < y0-2sigma erase all body alpha; seam band
                    # erases body skin/hair where the source is air)
                },
            }
            # Pair heads (wizard) ship source colours; the app relits seam
            # skin toward the worn body's neck colour at composite time.
            if hid in s2.HEAD_PAIR_GATE:
                rec["seam"] = {
                    "y0": s2.HEAD_CUTS[hid]
                          - s2.HEAD_TRANSITIONS.get(hid, s2.HEAD_TRANSITION),
                    "cut": s2.HEAD_CUTS[hid],
                    "overlap": s2.HEAD_OVERLAP,
                    "sigma": s2.HEAD_FEATHERS.get(hid, s2.HEAD_FEATHER),
                    "relit": [0.28, 0.72],
                    "skin_sample_rows_above_cut": 80,
                    "note": "global skin relight (baked coverage already "
                            "encodes the pair hair gate + vertical feather)",
                }
            gear_records.append(rec)

            # ---- regression truth: per-body relit pair heads ----
            if hid in s2.HEAD_PAIR_GATE:
                for oid in s2.OUTFITS:
                    vp = os.path.join(s2.HDIR, f"hat-{hid}-on-{oid}.png")
                    if os.path.exists(vp):
                        export_layer(vp, os.path.join(
                            "hats", f"hat-{hid}-on-{oid}@2x.webp"),
                            base=TRUTH_OUT)
        else:
            hat_src = os.path.join(s2.HDIR, f"hat-{hid}.png")
            mask_src = os.path.join(s2.MASKDIR, f"hole-{hid}.png")
            if not os.path.exists(hat_src):
                print("skip export item gear (no layer):", hid)
                continue
            hat_im = export_layer(
                hat_src, os.path.join("hats", f"hat-{hid}@2x.webp"))[0]
            save_icon(hat_im, f"hat-{hid}-icon.webp")
            rec = {
                "id": hid,
                "cn_name": h["cn"],
                "kind": "item",
                "icon_file": f"icons/hat-{hid}-icon.webp",
                "layer": f"layers/hats/hat-{hid}@2x.webp",
                "master_image": h["source"][1],
                "prompt_doc": h["prompt_doc"],
            }
            if os.path.exists(mask_src):
                export_layer(mask_src,
                             os.path.join("masks", f"hole-{hid}@2x.webp"))
                rec["mask"] = f"layers/masks/hole-{hid}@2x.webp"
            gear_records.append(rec)

    # ---- export shoe (single shared default) ----
    shoe_records = []
    shoe_src = os.path.join(s2.SDIR, "shoe-default.png")
    if os.path.exists(shoe_src):
        shoe_im = export_layer(
            shoe_src, os.path.join("shoes", "shoe-default@2x.webp"))[0]
        save_icon(shoe_im, "shoe-default-icon.webp")
        shoe_records.append({
            "id": "default",
            "cn_name": "暖白软底小鞋",
            "icon_file": "icons/shoe-default-icon.webp",
            "layer": "layers/shoes/shoe-default@2x.webp",
            "master_image": s2.CORE_SHOD_MASTER,
            "prompt_doc": "dress-default-barefoot.md",
        })

    # ---- manifest (v5 runtime) ----
    manifest = {
        "schema": "paperdoll-manifest-v5-runtime",
        "canvas": 2048, "icon_size": 512, "format": "webp-lossless-alpha",
        "slots": ["body", "gear", "shoe"],
        "z_order": ["body", "shoe", "gear"],
        "runtime_composite": (
            "body (+ item-hat erase mask when gear.kind=item) -> shoe -> gear; "
            "kind=head gear with a seam is relit toward the body neck colour "
            "before draw. Layers composite on a 2048 offscreen canvas then "
            "downscale once."),
        "target_app_dir": "apps/web/src/assets/paperdoll/ (PaperDoll 组件)",
        "default_look": {"body": "default", "gear": None, "shoe": None},
        "bodies": body_records,
        "gear": gear_records,
        "shoes": shoe_records,
        "truth_dir": "_truth/ (offline baked forhat + per-body heads; "
                     "dev regression only, never imported by production UI)",
        "removed_slots": ["acc", "top/bottom"],
    }
    with open(os.path.join(OUT, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    print("exported to", OUT)
    for root, _dirs, files in os.walk(LDIR_OUT):
        for fn in sorted(files):
            print("  layers/", os.path.relpath(os.path.join(root, fn), LDIR_OUT))
    for fn in sorted(os.listdir(IDIR_OUT)):
        print("  icons/", fn)


if __name__ == "__main__":
    main()

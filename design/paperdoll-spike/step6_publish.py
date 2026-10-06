"""Step 6: publish QC-passed staging assets to the app.

Run ONLY AFTER step5_verify_export.py output has been reviewed and accepted.
Copies from staging (design/paperdoll-spike/_step4_export/) into
apps/web/src/assets/paperdoll/:

  layers/                        full mirror (wiped + copied)
  icons/                         full mirror (wiped + copied)
  _truth/hats/hat-wizard-on-*    dev regression subset only
  _truth/outfits/*-forhat-wizard@2x.webp
  manifest.json                  SLIMMED for runtime: drops provenance fields
                                 (prompt_doc / master_image / series /
                                 anchors_version / runtime_composite /
                                 target_app_dir / default_look / truth_dir /
                                 removed_slots / gear[].seam.note)

The hand-written apps/_truth/README.md is preserved (only the hats/outfits
subdirs are refreshed).
"""
import json
import os
import shutil

BASE = os.path.dirname(os.path.abspath(__file__))
STAGING = os.path.join(BASE, "_step4_export")
APP = os.path.abspath(os.path.join(
    BASE, "..", "..", "apps", "web", "src", "assets", "paperdoll"))

TRUTH_HAT_PREFIX = "hat-wizard-on-"
TRUTH_OUTFIT_SUFFIX = "-forhat-wizard@2x.webp"

DROP_TOP = {"anchors_version", "runtime_composite", "target_app_dir",
            "default_look", "truth_dir", "removed_slots"}
DROP_ITEM = {"prompt_doc", "master_image", "series"}
DROP_SEAM = {"note"}


def mirror(src, dst):
    if os.path.isdir(dst):
        shutil.rmtree(dst)
    shutil.copytree(src, dst)


def slim_manifest(src_path, dst_path):
    with open(src_path, encoding="utf-8") as f:
        m = json.load(f)
    m = {k: v for k, v in m.items() if k not in DROP_TOP}
    for section in ("bodies", "gear", "shoes"):
        for item in m.get(section, []):
            for k in DROP_ITEM:
                item.pop(k, None)
            seam = item.get("seam")
            if seam:
                for k in DROP_SEAM:
                    seam.pop(k, None)
    with open(dst_path, "w", encoding="utf-8") as f:
        json.dump(m, f, ensure_ascii=False, indent=2)


def publish_truth(staging_truth, app_truth):
    os.makedirs(app_truth, exist_ok=True)
    for sub in ("hats", "outfits"):
        dst_dir = os.path.join(app_truth, sub)
        if os.path.isdir(dst_dir):
            shutil.rmtree(dst_dir)
        os.makedirs(dst_dir)
        src_dir = os.path.join(staging_truth, sub)
        for fn in sorted(os.listdir(src_dir)):
            keep = (fn.startswith(TRUTH_HAT_PREFIX) if sub == "hats"
                    else fn.endswith(TRUTH_OUTFIT_SUFFIX))
            if keep:
                shutil.copy2(os.path.join(src_dir, fn), dst_dir)


def main():
    if not os.path.isdir(STAGING):
        raise SystemExit(f"staging not found: {STAGING} (run step4 first)")
    mirror(os.path.join(STAGING, "layers"), os.path.join(APP, "layers"))
    mirror(os.path.join(STAGING, "icons"), os.path.join(APP, "icons"))
    publish_truth(os.path.join(STAGING, "_truth"), os.path.join(APP, "_truth"))
    slim_manifest(os.path.join(STAGING, "manifest.json"),
                  os.path.join(APP, "manifest.json"))
    print("published to", APP)


if __name__ == "__main__":
    main()

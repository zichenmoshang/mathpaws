#!/usr/bin/env python3
"""style tile 重建合成（anchors 工具）。

以拆层产物（decomp.js outDir）的 z0 层为底（重绘白背景，可能自带部分元素），
按 z 序将其余元素层（透明底 PNG，环境投影已被拆层剥离）按 bbox absolute 回贴，
产出"元素 + 白底、零环境影"的合成 tile。

用法：
  design/.venv-art/Scripts/python.exe design/asset-prompts/anchors/rebuild_tile.py \
    <decomp_outDir> <合成输出.png>
"""
import json
import sys
from pathlib import Path

from PIL import Image


def main():
    if len(sys.argv) != 3:
        sys.exit("usage: rebuild_tile.py <decomp_outDir> <out.png>")
    d = Path(sys.argv[1])
    out = Path(sys.argv[2])
    layers = json.loads((d / "layers.json").read_text(encoding="utf-8"))["layers"]

    z0 = layers[0]
    base = Image.open(d / z0["fileName"]).convert("RGBA")
    for l in sorted(layers[1:], key=lambda x: x["z"]):
        bb = (l.get("bounding_box") or {}).get("absolute")
        if not bb:
            continue
        x0, y0, x1, y1 = bb
        img = Image.open(d / l["fileName"]).convert("RGBA")
        img = img.resize((x1 - x0, y1 - y0), Image.LANCZOS)
        base.paste(img, (x0, y0), img)
    out.parent.mkdir(parents=True, exist_ok=True)
    base.convert("RGB").save(out)
    print(f"composite: {base.size[0]}x{base.size[1]}, {len(layers) - 1} layers -> {out}")


if __name__ == "__main__":
    main()

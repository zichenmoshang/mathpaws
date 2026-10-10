#!/usr/bin/env python3
"""色板匹配度抽检（风格锚验收维度 2 的量化项，方案 §2.1）。

统计图片像素与 tokens.ts C 色板（经 gen_palette.COLORS 单一事实源）的
最近色距离分布，报告匹配率。阈值与合格线按方案"首轮跑数后校准"——
当前仅报告数值，合格判读由 AI/人工结合元素语义完成。

用法：
  design/.venv-art/Scripts/python.exe design/asset-prompts/anchors/check_palette_match.py <image>
"""
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from gen_palette import COLORS  # 单一事实源（tokens.ts C 同步守护）

PALETTE = [(name, tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))) for name, h in COLORS]

# 最近色距离分桶阈值（RGB 欧氏距离）
BUCKETS = [30, 60, 90]


def main(img_path: str):
    img = Image.open(img_path).convert("RGB").resize((256, 256))
    px = list(img.getdata())

    counts = {b: 0 for b in BUCKETS}
    counts["far"] = 0
    near_total = 0.0
    for r, g, b in px:
        d = min(((r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2) ** 0.5
                for _, (pr, pg, pb) in PALETTE)
        near_total += d
        for bound in BUCKETS:
            if d <= bound:
                counts[bound] += 1
                break
        else:
            counts["far"] += 1

    n = len(px)
    print(f"image: {img_path}  (sampled {n} px @256x256)")
    for bound in BUCKETS:
        print(f"  dist<={bound}: {counts[bound] / n:.1%}")
    print(f"  dist> {BUCKETS[-1]}: {counts['far'] / n:.1%}  (渐变/阴影/描边过渡色为主)")
    print(f"  mean nearest-dist: {near_total / n:.1f}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("usage: check_palette_match.py <image>")
    main(sys.argv[1])

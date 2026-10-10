#!/usr/bin/env python3
"""色卡图生成（风格锚 A1，见 docs/internal/style-anchor-ui-convergence.md §2.1-B）。

以 packages/ui/src/tokens.ts 的 C 色板为唯一事实源，生成 I2I 生图参考用色卡图。
**改 C 色板后必须重跑本脚本**；色值一致性由
packages/ui/src/__tests__/tokens.test.ts 的"色卡脚本色值与 C 色板一致"断言守护。

用法：
  design/.venv-art/Scripts/python.exe design/asset-prompts/anchors/gen_palette.py
产物：design/asset-prompts/anchors/palette.png（入 git）
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent / "palette.png"

# 源：packages/ui/src/tokens.ts C 对象（L4-28，19 色）。
# 改动必须同步此处，并让 tokens.test.ts 的一致性断言通过。
COLORS = [
    ("sky", "#4FC3F7"), ("skyDeep", "#1565C0"),
    ("sun", "#FFD54F"), ("sunDeep", "#F57F17"),
    ("orange", "#FF8F00"), ("orangeDeep", "#EF6C00"),
    ("grass", "#66BB6A"), ("grassDeep", "#43A047"),
    ("red", "#EF5350"), ("redDeep", "#E53935"),
    ("purple", "#B39DDB"), ("purpleDeep", "#7E57C2"),
    ("pink", "#F48FB1"), ("pinkDeep", "#D81B60"),
    ("white", "#FFFFFF"), ("ink", "#263238"), ("inkSoft", "#78909C"),
    ("skyBg", "#BFE3F5"), ("ground", "#9CCC8A"),
]

COLS, SW, SH, PAD, TITLE_H = 5, 300, 190, 24, 64
ROWS = (len(COLORS) + COLS - 1) // COLS
W = COLS * SW + PAD * 2
H = TITLE_H + ROWS * SH + PAD * 2


def load_font(sz):
    for name in ("arial.ttf", "msyh.ttc", "DejaVuSans.ttf"):
        try:
            return ImageFont.truetype(name, sz)
        except OSError:
            continue
    return ImageFont.load_default()


def main():
    img = Image.new("RGB", (W, H), "#F7F7F8")
    d = ImageDraw.Draw(img)
    f_title, f_name, f_hex = load_font(34), load_font(26), load_font(22)
    d.text((PAD, 14), "mathpaws palette (tokens.ts C)", fill="#263238", font=f_title)

    for i, (name, hexv) in enumerate(COLORS):
        x = PAD + (i % COLS) * SW
        y = TITLE_H + PAD + (i // COLS) * SH
        d.rounded_rectangle([x, y, x + SW - 20, y + SH - 60], radius=16,
                            fill=hexv, outline="#263238", width=2)
        # 色块内下方写名称与色值；深色块白字、浅色块墨字
        r, g, b = int(hexv[1:3], 16), int(hexv[3:5], 16), int(hexv[5:7], 16)
        fg = "#FFFFFF" if (0.299 * r + 0.587 * g + 0.114 * b) < 150 else "#263238"
        d.text((x + 14, y + SH - 118), name, fill=fg, font=f_name)
        d.text((x + 14, y + SH - 86), hexv, fill=fg, font=f_hex)

    img.save(OUT)
    print(f"palette.png: {W}x{H}, {len(COLORS)} colors -> {OUT}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""hifi 拆层回贴验收（visual-qa P0，见 docs/internal/visual-qa.md §7）。

把"图层 + bbox 台账能否精确还原原稿"的验收固化为可复跑工具：

  模式 A（拆层门禁，decomp.js 跑完即验）：
    python recompose_qc.py decomp <outDir> --source <原稿路径>
  模式 B（存量回归，按已发布台账复验）：
    python recompose_qc.py page <page> [<page> ...]
    python recompose_qc.py --all

产物（gitignored）：design/high-fi/_tmp/recompose/<name>/{compare.png, recompose-qc.json}
退出码：0 全过 / 1 存在 fail 层或整页 fail / 2 用法或输入错误。

环境：design/.venv-art（Pillow + numpy + scikit-image）。
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import binary_erosion
from skimage.metrics import structural_similarity as ssim

ROOT = Path(__file__).resolve().parents[2]
HIFI_DIR = Path(__file__).resolve().parent
OUT_BASE = HIFI_DIR / "_tmp" / "recompose"

# 阈值（首轮跑完按实际分布校准，见 visual-qa.md §7）
ASPECT_TOL = 0.01        # bbox 宽高比 vs 图层实际宽高比 的相对偏差
REGION_DIFF_TOL = 0.02   # 单层区域差像素占比
COMPOSE_DIFF_TOL = 0.02  # 整页差像素占比
SSIM_TOL = 0.95          # 整页结构相似度下限
BBOX_CROSS_TOL = 2.0     # absolute vs normalized 交叉容差（px）
DIFF_PIX = 24            # 单通道差超过该值计为差像素（0-255）；24 起步以排除 jpeg/webp 压缩噪声
OFFSET_SEARCH = 3        # 图层比对时的 bbox 偏移搜索半径（px）


def parse_native_size(s):
    """台账 nativeSize 字符串 "896x488" -> (896, 488)。"""
    if not s:
        return None
    parts = str(s).lower().split("x")
    if len(parts) != 2:
        return None
    try:
        return int(parts[0]), int(parts[1])
    except ValueError:
        return None


def load_page_input(page: str):
    """模式 B：读 apps/web/src/assets/hifi/<page>/manifest.json。"""
    mdir = ROOT / "apps" / "web" / "src" / "assets" / "hifi" / page
    mpath = mdir / "manifest.json"
    if not mpath.exists():
        raise FileNotFoundError(f"台账不存在: {mpath}")
    m = json.loads(mpath.read_text(encoding="utf-8"))
    source = ROOT / m["source"]
    stage_raw = m.get("stage") or m.get("canvas") or m.get("source_size")  # 三代台账字段
    if stage_raw:
        stage = tuple(stage_raw)
    else:
        with Image.open(source) as im:
            stage = im.size  # 兜底：以原稿尺寸为准
    layers = []
    for i, l in enumerate(m["layers"]):
        if l.get("archived"):
            continue  # 已弃用层（前端改 CSS 实现），不参与回贴
        fname = l.get("file")
        if not fname:
            n = str(l.get("name") or "")
            # 早期台账把文件名记在 name 字段
            fname = n if n.lower().endswith((".webp", ".png", ".jpg", ".jpeg")) else None
        if not fname:
            continue  # 锚点层（file:null + discarded，仅留 bbox 作定位锚），无图层可贴
        layers.append({
            "z": l.get("z", i),  # 早期台账无 z 字段时按数组序
            "file": mdir / fname,
            "bbox": l.get("bbox"),           # [x0,y0,x1,y1] 或 None（整幅）
            "bbox_note": l.get("bboxNote"),
            "name": None if l.get("name") == fname else l.get("name"),
            # 刻意擦除区（层内相对坐标，resize 后坐标系）：烘焙文字/动态内容抠除位置，
            # 拆层时随拆随登记；该区域不参与比对
            "erased": l.get("erasedRegions", []),
        })
    # 可选：前端重实现区域（用户名/动态胶囊/CSS 图标等 discarded 层），整页比对时排除
    ignore_regions = m.get("ignoreRegions", [])
    return stage, source, layers, ignore_regions


def load_decomp_input(out_dir: Path, source: Path):
    """模式 A：读 decomp.js 产出的 layers.json（含 absolute/normalized 两套 bbox）。"""
    lpath = out_dir / "layers.json"
    if not lpath.exists():
        raise FileNotFoundError(f"layers.json 不存在: {lpath}")
    data = json.loads(lpath.read_text(encoding="utf-8"))
    with Image.open(source) as im:
        stage = im.size  # 模式 A 无 stage 字段，以原稿尺寸为准
    layers = []
    for l in data["layers"]:
        if l.get("download_error"):
            raise ValueError(f"存在下载失败层 z{l.get('z')}: {l['download_error']}，先补齐再验收")
        bb = l.get("bounding_box") or {}
        layers.append({
            "z": l["z"],
            "file": out_dir / l["fileName"],
            "bbox": bb.get("absolute"),
            "bbox_norm": bb.get("normalized"),  # 千分位 [x0,y0,x1,y1]，可能为 None
            "name": l.get("name"),
            "erased": l.get("erasedRegions", []),
        })
    return stage, source, layers


def recompose(stage, layers):
    """按 z 序回贴：bbox=None 整幅铺满；其余 resize 到 bbox 尺寸后带 alpha 贴入。"""
    canvas = Image.new("RGBA", stage, (0, 0, 0, 0))
    for l in sorted(layers, key=lambda x: x["z"]):
        with Image.open(l["file"]) as im:
            im = im.convert("RGBA")
            if l["bbox"] is None:
                layer = im.resize(stage, Image.LANCZOS)
                canvas.alpha_composite(layer)
            else:
                x0, y0, x1, y1 = [int(round(v)) for v in l["bbox"]]
                layer = im.resize((max(1, x1 - x0), max(1, y1 - y0)), Image.LANCZOS)
                canvas.alpha_composite(layer, (x0, y0))
    return canvas


def diff_mask(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    """RGB 任一通道差 > DIFF_PIX 的像素，再腐蚀掉 1px 孤立边缘差。

    拆层边缘抗锯齿/重采样会让两张图沿轮廓产生 1px 宽的差异带（属可接受固有差），
    形态学腐蚀将其消除；错位、色块、缺失等成块缺陷保留。等价于 pixelmatch 的 AA 容忍。
    """
    diff = np.abs(a.astype(np.int16) - b.astype(np.int16)).max(axis=2)
    return binary_erosion(diff > DIFF_PIX, structure=np.ones((3, 3)), iterations=1)


def diff_ratio(a: np.ndarray, b: np.ndarray, ignore: np.ndarray | None = None) -> float:
    """差像素占比；ignore 为 True 的位置（前端重实现区域）从分子分母同时剔除。"""
    mask = diff_mask(a, b)
    if ignore is not None:
        valid = ~ignore
        return float((mask & valid).sum() / max(1, valid.sum()))
    return float(mask.mean())


def qc_layer(src_rgb: np.ndarray, l) -> dict:
    """逐层校验：缩放一致性 + alpha 引导的图层内容比对。

    只验"图层实际绘制的内容"（alpha>128 像素）与原稿同位置是否一致；图层透明区
    （原稿里可能垫着 CSS 面板、动态文字等未回贴内容）不参与比对，避免结构性误判。
    """
    item = {"z": l["z"], "file": Path(l["file"]).name, "name": l.get("name"),
            "bbox": l["bbox"]}
    problems = []
    if l["bbox"] is None:
        item.update(status="pass", note="整幅背景层，纳入整页比对")
        return item

    h, w = src_rgb.shape[:2]
    x0, y0, x1, y1 = [int(round(v)) for v in l["bbox"]]
    bw, bh = max(1, x1 - x0), max(1, y1 - y0)
    with Image.open(l["file"]) as im:
        nw, nh = im.size
        im_rgba = np.asarray(im.convert("RGBA").resize((bw, bh), Image.LANCZOS))
    item["nativeSize"] = f"{nw}x{nh}"

    aspect_dev = abs((bw / bh) - (nw / nh)) / (nw / nh)
    item["aspect_deviation"] = round(aspect_dev, 5)
    if aspect_dev > ASPECT_TOL:
        problems.append(f"宽高比偏差 {aspect_dev:.4f} > {ASPECT_TOL}（拉伸变形）")

    cx0, cy0, cx1, cy1 = max(0, x0), max(0, y0), min(w, x1), min(h, y1)
    if cx1 <= cx0 or cy1 <= cy0:
        problems.append(f"bbox 越界 [{x0},{y0},{x1},{y1}] 超出原稿 {w}x{h}")
    else:
        ly, lx = cy0 - y0, cx0 - x0
        alpha = im_rgba[ly:ly + (cy1 - cy0), lx:lx + (cx1 - cx0), 3]
        lay_rgb = im_rgba[ly:ly + (cy1 - cy0), lx:lx + (cx1 - cx0), :3]
        valid = alpha > 128
        # 刻意擦除区豁免（层内相对坐标）
        for (ex0, ey0, ex1, ey1) in (l.get("erased") or []):
            valid[ey0:ey1, ex0:ex1] = False
        item["alpha_coverage"] = round(float(valid.mean()), 4)
        item["erased_regions"] = len(l.get("erased") or [])
        if valid.sum() < 100:
            problems.append(f"有效像素过少（{int(valid.sum())}），无法比对")
        else:
            src_region = src_rgb[cy0:cy1, cx0:cx1]
            lay_i16 = lay_rgb.astype(np.int16)

            # ±3px 偏移搜索：区分"bbox 记录偏移"（对齐后 diff 骤降）与"内容差异"（对齐后仍高）
            best, best_cnt = (0, 0), None
            for dy in range(-OFFSET_SEARCH, OFFSET_SEARCH + 1):
                for dx in range(-OFFSET_SEARCH, OFFSET_SEARCH + 1):
                    nx0, ny0 = cx0 + dx, cy0 + dy
                    nx1, ny1 = nx0 + (cx1 - cx0), ny0 + (cy1 - cy0)
                    if nx0 < 0 or ny0 < 0 or nx1 > w or ny1 > h:
                        continue
                    cand = np.abs(lay_i16 - src_rgb[ny0:ny1, nx0:nx1].astype(np.int16)).max(axis=2)
                    cnt = int(((cand > DIFF_PIX) & valid).sum())
                    if best_cnt is None or cnt < best_cnt:
                        best, best_cnt = (dx, dy), cnt
            bdx, bdy = best
            shifted = src_rgb[cy0 + bdy:cy1 + bdy, cx0 + bdx:cx1 + bdx] if best != (0, 0) else src_region
            corr = float((diff_mask(lay_rgb, shifted) & valid).sum() / valid.sum())
            raw0 = float((diff_mask(lay_rgb, src_region) & valid).sum() / valid.sum())
            item["region_diff_ratio"] = round(corr, 5)
            item["best_offset"] = [bdx, bdy]
            item["diff_at_recorded_bbox"] = round(raw0, 5)
            if corr > REGION_DIFF_TOL:
                problems.append(
                    f"图层内容差像素占比 {corr:.4f} > {REGION_DIFF_TOL}（±{OFFSET_SEARCH}px 对齐后仍超）")
            elif (abs(bdx) >= 2 or abs(bdy) >= 2) and corr < raw0 * 0.5:
                problems.append(
                    f"bbox 疑似偏移 ({bdx},{bdy})px：对齐后 diff {raw0:.4f}→{corr:.4f}，建议核对台账")
            elif best != (0, 0) and corr < raw0 * 0.5:
                item["warning"] = f"bbox 微偏 ({bdx},{bdy})px（前端亚像素级），记录不阻塞"

    # 模式 A 附加：absolute vs normalized 交叉校验（splash z4 进度条案的防线）
    if l.get("bbox_norm") is not None:
        nx0, ny0, nx1, ny1 = [v / 1000.0 for v in l["bbox_norm"]]
        sw, sh = w, h
        conv = [nx0 * sw, ny0 * sh, nx1 * sw, ny1 * sh]
        cross = max(abs(a - b) for a, b in zip(conv, l["bbox"]))
        item["bbox_cross_deviation_px"] = round(cross, 2)
        if cross > BBOX_CROSS_TOL:
            problems.append(
                f"absolute/normalized 交叉偏差 {cross:.1f}px > {BBOX_CROSS_TOL}（需人工裁定取哪套，"
                f"参考图层原生宽与 normalized 换算宽是否吻合）")

    item["status"] = "fail" if problems else "pass"
    if problems:
        item["problems"] = problems
    if l.get("bbox_note"):
        item["bboxNote"] = l["bbox_note"]
    return item


def compare_sheet(rec: Image.Image, src: Image.Image, out_path: Path, max_w=640):
    """三联对照图：回贴 | 原稿 | 差分（x3 增益）。"""
    rec_rgb = rec.convert("RGB")
    src_rgb = src.convert("RGB")
    diff = Image.fromarray(
        np.clip(np.abs(np.asarray(rec_rgb, dtype=np.int16)
                       - np.asarray(src_rgb, dtype=np.int16)) * 3, 0, 255).astype(np.uint8))
    panels = [rec_rgb, src_rgb, diff]
    w, h = rec_rgb.size
    scale = min(1.0, max_w / w)
    tw, th = int(w * scale), int(h * scale)
    panels = [p.resize((tw, th), Image.LANCZOS) for p in panels]
    sheet = Image.new("RGB", (tw * 3 + 16, th + 8), (24, 24, 24))
    for i, p in enumerate(panels):
        sheet.paste(p, (8 + i * tw, 4))
    out_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out_path)


def qc(name: str, stage, source: Path, layers, ignore_regions=None) -> dict:
    if not source.exists():
        raise FileNotFoundError(f"原稿不存在: {source}")
    rec = recompose(stage, layers)
    with Image.open(source) as sim:
        src = sim.convert("RGB").resize(stage, Image.LANCZOS)
    rec_rgb = np.asarray(rec.convert("RGB"))
    src_rgb = np.asarray(src)

    layer_items = [qc_layer(src_rgb, l) for l in sorted(layers, key=lambda x: x["z"])]

    # 有效比对区域 = 有层覆盖（合成图 alpha>8）− ignoreRegions − 各层 erasedRegions
    # （刻意擦除区换算到全局坐标）；无层区域（PaperDoll 人物、CSS 面板等）自动剔除
    h, w = src_rgb.shape[:2]
    ignore = np.zeros((h, w), dtype=bool)
    for r in (ignore_regions or []):
        x0, y0, x1, y1 = [int(round(v)) for v in r]
        ignore[max(0, y0):min(h, y1), max(0, x0):min(w, x1)] = True
    for l in layers:
        if not l.get("bbox") or not l.get("erased"):
            continue
        bx0, by0 = int(round(l["bbox"][0])), int(round(l["bbox"][1]))
        for (ex0, ey0, ex1, ey1) in l["erased"]:
            ignore[max(0, by0 + ey0):min(h, by0 + ey1),
                   max(0, bx0 + ex0):min(w, bx0 + ex1)] = True
    coverage = np.asarray(rec)[:, :, 3] > 8
    valid = coverage & ~ignore
    compose_diff = float((diff_mask(rec_rgb, src_rgb) & valid).sum() / max(1, valid.sum()))
    rec_filled = rec_rgb.copy()
    rec_filled[~valid] = src_rgb[~valid]
    compose_ssim = float(ssim(src_rgb, rec_filled, channel_axis=2, data_range=255))
    compose_status = "pass" if (compose_diff <= COMPOSE_DIFF_TOL and compose_ssim >= SSIM_TOL) else "fail"

    failed = sum(1 for i in layer_items if i["status"] == "fail")
    warned = sum(1 for i in layer_items if i.get("warning"))
    result = {
        "page": name,
        "source": str(source.relative_to(ROOT)),
        "stage": list(stage),
        "layers": layer_items,
        "compose": {"diff_ratio": round(compose_diff, 5), "ssim": round(compose_ssim, 4),
                    "status": compose_status,
                    "coverage_ratio": round(float(coverage.mean()), 4),
                    "ignored_regions": len(ignore_regions or [])},
        "summary": {"total": len(layer_items), "passed": len(layer_items) - failed,
                    "failed": failed, "warned": warned,
                    "thresholds": {"aspect": ASPECT_TOL, "region_diff": REGION_DIFF_TOL,
                                   "compose_diff": COMPOSE_DIFF_TOL, "ssim": SSIM_TOL,
                                   "bbox_cross_px": BBOX_CROSS_TOL}},
    }

    out_dir = OUT_BASE / name
    compare_sheet(rec, src, out_dir / "compare.png")
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "recompose-qc.json").write_text(
        json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")

    mark = "PASS" if (failed == 0 and compose_status == "pass") else "FAIL"
    print(f"[{mark}] {name}: 层 {len(layer_items) - failed}/{len(layer_items)} 过, "
          f"整页 diff={compose_diff:.4f} ssim={compose_ssim:.4f} -> {out_dir}")
    for i in layer_items:
        for p in i.get("problems", []):
            print(f"    z{i['z']} {i['file']}: {p}")
        if i.get("warning"):
            print(f"    z{i['z']} {i['file']}: [warn] {i['warning']}")
    return result


def main() -> int:
    ap = argparse.ArgumentParser(description="hifi 拆层回贴验收")
    sub = ap.add_subparsers(dest="cmd", required=True)
    d = sub.add_parser("decomp", help="模式 A：拆层门禁（decomp.js 产物目录）")
    d.add_argument("out_dir", type=Path)
    d.add_argument("--source", type=Path, required=True, help="原稿路径")
    p = sub.add_parser("page", help="模式 B：存量回归（已发布页面）")
    p.add_argument("pages", nargs="+")
    args = ap.parse_args()

    try:
        if args.cmd == "decomp":
            stage, source, layers = load_decomp_input(args.out_dir, args.source)
            r = qc(args.out_dir.name, stage, source, layers)
            return 1 if (r["summary"]["failed"] or r["compose"]["status"] == "fail") else 0
        results = [qc(pg, *load_page_input(pg)) for pg in args.pages]
        bad = sum(1 for r in results
                  if r["summary"]["failed"] or r["compose"]["status"] == "fail")
        print(f"== 汇总: {len(results) - bad}/{len(results)} 页全过 ==")
        return 1 if bad else 0
    except (FileNotFoundError, ValueError, KeyError) as e:
        print(f"输入错误: {e}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())

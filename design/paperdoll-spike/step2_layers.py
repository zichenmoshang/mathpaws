"""Step 2: cut the 3-slot paperdoll layers (outfit + hat + shoe).

Dress-up model: an OUTFIT is a single full-body image; only HAT and SHOE are
weakly-coupled independent slots. Runtime composes at most 3 layers, z-order:

    outfit  ->  shoe  ->  hat

Each outfit ships one nohat body plus ONE forhat variant PER HAT, because the
hats have very different geometry (the scientist goggles sit on a small
forehead band and keep the ahoge; the frog / elf / wizard hats expand UPWARD
around tall or 3D crowns). A single shared hole cannot match all of them, so:

  * <outfit>-nohat.png            : full body, head intact (worn with no hat);
  * <outfit>-forhat-<hat>.png     : same body with that hat's splice hole cut
                                    OUT so the independent hat layer fills it.

Splice geometry is NOT the hand ellipse union any more. The hatted source and
each body are separate AI generations with different hair geometry, so cutting
along fixed ellipses both gouged air gaps (R too big / off the real hat) and
clipped the hat (R too small, e.g. the scientist frame V-notch). Instead the
hat footprint is extracted from the hatted source itself:

  hat-like color pixels (skin/hair HSV bands excluded), region-grown from
  seeds inside the ellipse guides (strong-alpha only, so the rembg soft halo
  cannot bridge specks) -> closing + fill holes -> an alpha-gated overlap
  collar that also tucks the source's own hair beside the hat.

The for-hat hole is this SAME footprint eroded + feathered, hence the hat
layer always over-covers the hole: uncovered gaps and air gouges are
structurally impossible, and ellipse edges can no longer slice ears/bangs.

BUT color/ellipse cuts can only keep whatever hair the hatted source itself
has; they cannot make one hat silhouette cover six bodies with different-
sized hair domes. Hence the three regenerated hatted sources (frog/elf/wizard
v2) use cut_mode="head": the source takes over the WHOLE head (hat + tucked
hair + face) down to a neck seam, erasing every body-hair bulge beyond the
source head outline. The neck is skin-on-skin in the same pose, so the seam
is invisible; hat brim and eyes are both the source's own, so they always
align. scientist stays "color" and explorer stays "ellipse" (both validated).

Independent layers:
  * hat  : from the hatted source. scientist uses color extraction; explorer
           uses the validated tight ellipse R (khaki colour inseparable from
           skin in HSV); frog/elf/wizard v2 use the full head cut. Explorer
           and shoe sources are local masters (archived from CDN 2026-10-06);
  * shoe : horizontal cut from the (shod) core-ip master; the layer keeps the
           native alpha and starts SHOE_OVERLAP px above the cut so its collar
           wraps the ankle.

The script is registry-driven (OUTFITS / HATS) and SKIPS any outfit or hat
whose inputs are not present yet, so it stays runnable while batch assets are
still being produced. All coordinates are ORIGINAL 2048-space.

Run AFTER step1 (needs _step1_export/<barefoot-stem>-rmbg.png).
"""
import os
import io
import urllib.request
import numpy as np
from PIL import Image, ImageDraw, ImageChops, ImageFilter
from scipy import ndimage as ndi
from rembg import remove, new_session

BASE = os.path.dirname(os.path.abspath(__file__))
MDIR = os.path.join(BASE, "masters")
CDIR = os.path.join(BASE, "_step1_export")                 # rembg RGBA (step1 out)
LDIR = os.path.join(BASE, "_step2_export")                 # cut full-canvas layers
QDIR = os.path.join(LDIR, "qc")                            # disposable QC sheets
ODIR = os.path.join(LDIR, "outfits")
HDIR = os.path.join(LDIR, "hats")
SDIR = os.path.join(LDIR, "shoes")
# Runtime N+M assets (2026-10-03):
#   heads/ : full-head gear layers (head-cut). frog/elf are the same baked
#            non-pair heads; wizard gets ONE neutral (un-relit) pair head whose
#            gate is taken against the default body - all bodies share the same
#            skin/back-hair geometry in the seam band, so the gate is body-
#            invariant. The app relits its seam skin toward the worn body.
#   masks/ : soft erase masks for item hats (ellipse/color cut modes), carried
#            in the alpha channel. The app applies body.alpha AND NOT mask at
#            runtime instead of shipping per-body forhat bodies.
HHDIR = os.path.join(LDIR, "heads")
MASKDIR = os.path.join(LDIR, "masks")
for _d in (ODIR, HDIR, SDIR, HHDIR, MASKDIR, QDIR):
    os.makedirs(_d, exist_ok=True)
W = H = 2048

# ---- sources (non-barefoot originals) ----
# sources are archived local masters (CDN single-point dependency removed
# 2026-10-06); ("cdn", url) remains a supported source type for future hats.
CORE_SHOD_MASTER = "default/dress-default-shod.png"           # shod default -> shoe
EXPLORER_FULL_MASTER = "job-explorer/dress-job-explorer-full.png"  # hatted -> explorer hat

# ---- shoe horizontal split (validated) ----
SHOE_CUT = 1780         # body has no shoes below this y; ankle skin ends ~1776
SHOE_OVERLAP = 8        # shoe layer starts this many px above the cut (collar wrap)

# ---- shoe/foot silhouette fit ----
SHOE_FIT_YMIN = 1830    # toe box only; never touch the ankle collar above
SHOE_FIT_RADIUS = 14    # max px extended to each side per row

# ============================================================================
# HAT SPLICE SEGMENTATION (color-driven; ellipses are seed guides only)
#
# The character's own skin/hair are excluded from hat pixels via HSV bands
# calibrated from sampled pixels on these assets (H in degrees 0-360, S/V in
# 0-1). Everything else in the head zone is hat-like: purple (wizard), red +
# white (elf), green + white + black (frog), near-white/pale-blue (scientist).
# Skin and hair hues overlap (both warm); they differ mainly in S and V.
# ============================================================================
SKIN_H = (3, 32)        # cheek/forehead peach
SKIN_S = (0.18, 0.48)
SKIN_V_MIN = 0.62
HAIR_H = (4, 45)        # brown bangs / hair wings
HAIR_S_MIN = 0.32
HAIR_V_MAX = 0.72

HAT_STRONG_ALPHA = 120  # mask grows through strong-alpha pixels only (>soft halo)
HAT_SEED_ERODE = 24     # ellipse interiors at this erosion = guaranteed hat
HAT_ALLOW_DIL = 140     # hard spatial guard: how far growth may pass R
HAT_OPEN_R = 2          # sever 1-2px alpha-halo bridges
HAT_CLOSE_R = 3         # smooth hat silhouette before fill
HAT_MIN_COMP = 3000     # drop small connected specks
HAT_COLLAR_R = 12       # alpha-gated overlap collar (incl. tucked source hair)
HAT_HOLE_ERODE = 4      # for-hat hole sits this far inside the hat footprint
HAT_FEATHER = 3         # Gaussian feather px for both soft masks

# ---- head cut (cut_mode="head"; v2 regenerated hatted sources) ----
# HORIZONTAL cut at the neck, exactly like the shoe cut at the other end:
# the body keeps only rows BELOW the cut (so no body hair can survive above
# it - a contour-shaped hole could not remove hair outside the source head
# outline); the source keeps rows down to cut+overlap, its neck skin band
# wrapping onto the body collar. Skin on skin in the same pose -> invisible.
# Per-hat cut ys are validated against skin-column row profiles, same
# workflow as SHOE_CUT.
HEAD_OVERLAP = 12
HEAD_TRANSITION = 40        # rows above the cut where only gate-covered
                            # columns are cut, so wide body collars survive
HEAD_TRANSITIONS = {        # per-hat transition height override
    # wizard: longer neckline trace because its robe collar reaches the chin
    "wizard": 75,
}
HEAD_CUTS = {               # hid -> neck cut y
    "frog": 920,
    "elf": 985,
    "wizard": 1078,
}
HEAD_FEATHER = 3         # default vertical seam feather
HEAD_FEATHERS = {        # per-hat seam feather override
    # wizard: body collar curve peeks around the narrow source neck
    "wizard": 8,
}
# source pixels inside the seam band are pasted/cut at this coverage scale.
# wizard: the source's under-chin contact shadow is dark (it falls on its
# dark robe in the source); scaling turns it into a soft faint shadow on a
# light outfit instead of a gray stripe.
HEAD_BAND_SCALE = {
    # hair-only gate: full coverage so body hair is replaced seamlessly
    "wizard": 1.0,
}

# ============================================================================
# HAT registry
#   band  : seed guide R, union of ellipse boxes [x0,y0,x1,y1]. Eroded
#           interiors seed the color-driven hat extraction; the union also
#           bounds growth via HAT_ALLOW_DIL. Ellipses are NO LONGER the cut
#           shape themselves, so off/over-large boxes cannot gouge or slice
#           ears - they only must keep their interior on the real hat.
#   source: ("cdn", url)  -> download + rembg, or
#           ("master", filename) -> local masters/ file + rembg.
#   cut_mode (optional): "color" (default, color-driven extraction);
#           "ellipse" (explorer: khaki statistically inseparable from skin,
#           validated tight R); "head" (v2 sources: whole head to neck seam).
# ============================================================================
HATS = {
    "explorer": {
        "cn": "探险家遮阳帽",
        "cut_mode": "ellipse",
        "band": {
            "brim":    [480, 250, 1570, 408],
            "crown":   [690, 105, 1360, 360],
            "fringe":  [700, 318, 1350, 478],
            "side_l":  [515, 330, 908, 578],
            "side_r":  [1142, 330, 1535, 578],
        },
        "source": ("master", EXPLORER_FULL_MASTER),
        "prompt_doc": "dress-job-explorer-barefoot-nohat.md",
    },
    "scientist": {
        "cn": "小科学家护目镜",
        # Refined 2026-09-30 (runtime QC round 2): goggles pushed HIGH on the
        # forehead above the brows. Boxes must contain the FULL opaque white
        # frame (chunky rims + the white brow bar joining the lenses) - the
        # first-pass boxes clipped the top/outer frame arcs, making the lenses
        # look sunk into the hair. Crown/ahoge above y~200 stay UNCOVERED;
        # every inner edge clears the eyes (eye tops ~y650).
        "band": {
            "lens_l":  [510, 240, 940, 565],
            "lens_r":  [1095, 230, 1440, 560],
            "bridge":  [905, 235, 1135, 485],
            "side_l":  [435, 415, 610, 655],
            "side_r":  [1380, 410, 1505, 615],
        },
        "source": ("master", "job-scientist/dress-job-scientist-full.png"),
        "prompt_doc": "dress-job-scientist-full.md",
    },
    "frog": {
        "cn": "小青蛙蛙眼帽",
        "cut_mode": "head",
        # Refined 2026-09-30 (runtime QC round 2): two big 3D eyes on top
        # (green rims reach y~95) and the cap dome between them fully covers
        # the crown - the first pass left the dome valley open, so the ahoge
        # poked through between the eyes. crown_top erases that air-zone hair
        # (hat layer stays transparent there -> true gap between the eyes).
        # First-pass side boxes were also mis-shifted past the painted wrap.
        "band": {
            "eye_l":       [560, 85, 930, 385],
            "eye_r":       [1115, 85, 1455, 390],
            "crown_top":   [895, 80, 1175, 320],
            "crown_dome":  [830, 235, 1220, 410],
            "cap":         [490, 325, 1560, 595],
            "side_l":      [440, 550, 605, 780],
            "side_r":      [1355, 540, 1460, 750],
        },
        "source": ("master", "animal-frog/dress-animal-frog-full.png"),
        "prompt_doc": "dress-animal-frog-full.md",
    },
    "elf": {
        "cn": "小圣诞精灵尖顶帽",
        "cut_mode": "head",
        # Refined 2026-09-30 (runtime QC round 2): tall cone rising to y~105
        # then bending RIGHT to the pom at (1415-1650, 345-560) - the first
        # pass clipped the pom to its lower half (a hanging half-ball) and cut
        # the fleece headband through its own body (thin band + flat-top
        # fringe). Boxes now follow the full pom ball and the full fleece band
        # with side drops; inner edges stay above the brows.
        "band": {
            # body cone is intentionally WIDER than the painted cone: the
            # margin cuts the wearer's hair wings that the tall hat tucks away
            # (hat layer is transparent there, reproducing the hatted outline).
            "cone_body":   [430, 90, 1340, 620],
            "cone_bend":   [980, 90, 1450, 540],
            "bend_margin": [1370, 150, 1560, 545],
            # full plush band: top ~345, fuzzy bottom edge ~590 center
            "headband":    [465, 345, 1565, 605],
            "side_l":      [455, 560, 635, 770],
            "side_r":      [1350, 555, 1490, 745],
            "pom":         [1415, 345, 1650, 560],
        },
        "source": ("master", "festival-elf/dress-festival-elf-full.png"),
        "prompt_doc": "dress-festival-elf-full.md",
    },
    "wizard": {
        "cn": "小魔法师巫师帽",
        "cut_mode": "head",
        # Refined 2026-09-30 (runtime QC round 2): the brim is one wide sweep
        # with LOW drooping tips (~y960 L / ~y930 R) and a shallow curved
        # inner edge over the forehead (~y640 center). First-pass boxes cut
        # INTO the brim body -> flat chopped lower edge and diagonal notches.
        # Inner connectors bridge tip/crown without ever reaching the brows
        # (~y740); tall bent crown apex starts at y~95.
        "band": {
            "crown":     [470, 95, 1530, 660],
            "crown_tip": [1100, 300, 1410, 520],
            "brim_in":   [510, 495, 1450, 668],
            "tip_l":     [335, 540, 685, 985],
            "tip_r":     [1270, 500, 1620, 950],
            "conn_l":    [560, 560, 880, 700],
            "conn_r":    [1060, 555, 1380, 695],
        },
        "source": ("master", "fantasy-wizard/dress-fantasy-wizard-full.png"),
        "prompt_doc": "dress-fantasy-wizard-full.md",
    },
}

# ============================================================================
# OUTFIT registry
#   cutout : barefoot NO-HAT cutout stem (step1 output _step1_export/<stem>-rmbg.png).
# ============================================================================
OUTFITS = {
    "default": {
        "cn": "默认套装", "series": "job",
        "cutout": "dress-default-barefoot",
        "prompt_doc": "dress-default-barefoot.md", "master_url": CORE_SHOD_MASTER,
    },
    "explorer": {
        "cn": "探险家套装", "series": "job",
        "cutout": "dress-job-explorer-barefoot-nohat",
        "prompt_doc": "dress-job-explorer-barefoot-nohat.md",
        "master_url": EXPLORER_FULL_MASTER,
    },
    "scientist": {
        "cn": "小科学家套装", "series": "job",
        "cutout": "dress-job-scientist-barefoot-nohat",
        "prompt_doc": "dress-job-scientist-barefoot-nohat.md", "master_url": None,
    },
    "frog": {
        "cn": "小青蛙套装", "series": "animal",
        "cutout": "dress-animal-frog-barefoot-nohat",
        "prompt_doc": "dress-animal-frog-barefoot-nohat.md", "master_url": None,
    },
    "elf": {
        "cn": "小圣诞精灵套装", "series": "festival",
        "cutout": "dress-festival-elf-barefoot-nohat",
        "prompt_doc": "dress-festival-elf-barefoot-nohat.md", "master_url": None,
    },
    "wizard": {
        "cn": "小魔法师套装", "series": "fantasy",
        "cutout": "dress-fantasy-wizard-barefoot-nohat",
        "prompt_doc": "dress-fantasy-wizard-barefoot-nohat.md", "master_url": None,
    },
}

# rembg session shared for all downloaded / local sources (same model family
# as step1; default birefnet-general-lite since 2026-10-03, u2net via argv)
_SESSION = None


def rembg_session(model="birefnet-general-lite"):
    global _SESSION
    if _SESSION is None:
        _SESSION = new_session(model)
    return _SESSION


def hat_band(hat_id):
    """Seed guide R for a hat: union of its ellipse boxes (hard L mask)."""
    m = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(m)
    for box in HATS[hat_id]["band"].values():
        d.ellipse(box, fill=255)
    return m


def rgb2hsv(rgb):
    """RGB uint8 HxWx3 -> H (degrees 0-360), S, V (0-1)."""
    rgb = rgb.astype(np.float32) / 255.0
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    mx = rgb.max(2)
    mn = rgb.min(2)
    df = mx - mn
    h = np.zeros_like(mx)
    nz = df > 1e-6
    safe = np.where(df == 0, 1, df)
    idx = (mx == r) & nz
    h[idx] = ((60 * (g - b) / safe) % 360)[idx]
    idx = (mx == g) & nz
    h[idx] = (60 * (b - r) / safe + 120)[idx]
    idx = (mx == b) & nz
    h[idx] = (60 * (r - g) / safe + 240)[idx]
    s = np.where(mx > 0, df / np.where(mx == 0, 1, mx), 0)
    return h, s, mx


def bodylike(h, s, v):
    """Pixels belonging to the character's own skin or hair (not the hat)."""
    skin = ((h >= SKIN_H[0]) & (h <= SKIN_H[1]) &
            (s >= SKIN_S[0]) & (s <= SKIN_S[1]) & (v >= SKIN_V_MIN))
    hair = ((h >= HAIR_H[0]) & (h <= HAIR_H[1]) &
            (s >= HAIR_S_MIN) & (v <= HAIR_V_MAX))
    return skin | hair


def hat_region_mask(hat_id, src):
    """Hard footprint of a hat on the hatted source cutout.

    Color segmentation -> region grow from eroded-ellipse seeds through
    strong-alpha hat-like pixels -> closing + fill holes -> alpha-gated
    overlap collar. Every output pixel is backed by an opaque source pixel.
    """
    a = np.asarray(src)
    alpha = a[:, :, 3] > 8
    strong = a[:, :, 3] > HAT_STRONG_ALPHA
    h, s, v = rgb2hsv(a[:, :, :3])
    hatlike = strong & ~bodylike(h, s, v)
    hatlike = ndi.binary_opening(hatlike, iterations=HAT_OPEN_R)

    guide = np.asarray(hat_band(hat_id)) > 0
    allowed = ndi.binary_dilation(guide, iterations=HAT_ALLOW_DIL)
    seeds = (ndi.binary_erosion(guide, iterations=HAT_SEED_ERODE)
             & strong & hatlike)

    lab, _n = ndi.label(hatlike & allowed, structure=np.ones((3, 3)))
    keep_ids = [i for i in np.unique(lab[seeds]) if i != 0 and
                (lab == i).sum() >= HAT_MIN_COMP]
    keep = np.isin(lab, keep_ids)
    keep = ndi.binary_closing(keep, iterations=HAT_CLOSE_R)
    keep = ndi.binary_fill_holes(keep)
    collar = (ndi.binary_dilation(keep, iterations=HAT_COLLAR_R)
              & alpha & allowed)
    return keep | collar


def _rect_band(y0, y1):
    """Hard L mask for rows y0<=y<y1."""
    m = Image.new("L", (W, H), 0)
    ImageDraw.Draw(m).rectangle([0, y0, W - 1, y1 - 1], fill=255)
    return m


# Per-hat head-cut whose gate depends on the BODY (pair gate):
#   source SKIN pixels are always pasted (neck column);
#   source HAIR pixels are pasted only where the body also has skin/hair,
#   never over clothing. Hats absent here keep a body-independent gate
#   (whole source alpha): their source neck/collar works on every body.
HEAD_PAIR_GATE = {"wizard"}


def head_src_info(hat_id, src):
    """Precompute source geometry/classes for a head-cut hat."""
    cut = HEAD_CUTS[hat_id]
    trans_n = HEAD_TRANSITIONS.get(hat_id, HEAD_TRANSITION)
    feather = HEAD_FEATHERS.get(hat_id, HEAD_FEATHER)
    a = np.asarray(src)
    alpha = a[:, :, 3] > 8
    hh, ss, vv = rgb2hsv(a[:, :, :3])
    skin = (alpha & (hh >= SKIN_H[0]) & (hh <= SKIN_H[1]) &
            (ss >= SKIN_S[0]) & (ss <= SKIN_S[1]) & (vv >= SKIN_V_MIN))
    hair = alpha & bodylike(hh, ss, vv) & ~skin
    return dict(id=hat_id, cut=cut, y0=cut - trans_n, alpha=alpha, skin=skin,
                hair=hair, pair=hat_id in HEAD_PAIR_GATE, feather=feather)


def _coverage(gate, info, overlap):
    """Build (source_cov to cut+overlap, hole_cov to cut) soft L masks from a
    hard gate. Feather VERTICALLY only along the seam band."""
    y0, cut, r = info["y0"], info["cut"], info["feather"]
    scale = HEAD_BAND_SCALE.get(info["id"], 1.0)
    def build(hi):
        cov = np.zeros((H, W), np.float32)
        cov[:y0] = 255
        cov[y0:hi] = np.where(gate[y0:hi], 255 * scale, 0)
        blurred = ndi.gaussian_filter1d(cov, r, axis=0)
        cov[y0: hi + r] = blurred[y0: hi + r]
        return Image.fromarray(cov.astype(np.uint8), "L")
    return build(cut + overlap), build(cut)


def head_cut_coverage(info, src, body=None, relit=True):
    """Pair body: (hat RGBA, hole L). Non-pair: (src_cov L, hole_cov L).

    Pair gate over the seam band: source skin is kept but RE-LIT toward the
    body's own lit neck colour (source neck is shadowed by its robe collar);
    source hair only over body skin/hair. Rows above the band still paste
    the source head at full coverage.

    relit=False builds the body-invariant NEUTRAL head shipped as the single
    runtime layer (the app does the per-body relight itself): the pair hair
    gate still needs a body, but any body works because skin/back-hair geometry
    is identical across outfits in the seam band; only clothing differs and
    clothing never passes the gate."""
    if not info["pair"]:
        return _coverage(info["alpha"], info, HEAD_OVERLAP)
    if body is None:
        raise ValueError("pair gate needs the body")
    sa = np.asarray(src)
    ba = np.asarray(body)
    balpha = ba[:, :, 3] > 8
    bh, bs, bv = rgb2hsv(ba[:, :, :3])
    b_like = balpha & bodylike(bh, bs, bv)
    b_skin = (balpha & (bh >= SKIN_H[0]) & (bh <= SKIN_H[1]) &
              (bs >= SKIN_S[0]) & (bs <= SKIN_S[1]) & (bv >= SKIN_V_MIN))

    gate = info["skin"] | (info["hair"] & b_like)

    # hard coverage: full above y0, gate across y0..cut+overlap
    cut, y0 = info["cut"], info["y0"]
    hard = np.zeros((H, W), np.float32)
    hard[:y0] = 255
    hard[y0: cut + HEAD_OVERLAP] = np.where(
        gate[y0: cut + HEAD_OVERLAP], 255, 0)
    r = info["feather"]
    cov = ndi.gaussian_filter1d(hard, r, axis=0)
    cov[: max(0, y0 - 2 * r)] = 255     # protect the head proper
    # source native alpha gates coverage (air around the head stays empty);
    # band gate pixels are alpha-backed anyway
    cov = cov * (sa[:, :, 3].astype(np.float32) / 255)

    # build hat RGBA: source colours, skin positions relit toward neck_col
    # (only when a per-body baked variant is requested).
    relit_rgb = sa[:, :, :3].astype(np.float32).copy()
    if relit:
        ys, xs = np.where(b_skin)
        m = ys >= info["y0"] - 80
        neck_col = np.median(ba[ys[m], xs[m], :3], axis=0)
        relit_rgb[info["skin"]] = (0.28 * relit_rgb[info["skin"]]
                                   + 0.72 * neck_col)
    hat = np.zeros((H, W, 4), np.uint8)
    hat[:, :, 3] = cov.clip(0, 255).astype(np.uint8)
    zone = cov > 0
    hat[:, :, :3][zone] = relit_rgb[zone].clip(0, 255).astype(np.uint8)
    return Image.fromarray(hat, "RGBA"), Image.fromarray(
        cov.clip(0, 255).astype(np.uint8), "L")


def head_ownership_hole(src_cutout, body, cut_y, base_hole, hard_y):
    """Union the head seam hole with the 'head ownership' erase (2026-10-04).

    The hatted/hooded source owns the ENTIRE head down to the neck cut. Body
    pixels where the source is AIR (inside the source head bbox) are erased -
    otherwise the nohat body's own (wider) hair dome / ahoge bulges out around
    a narrow crown (the wizard 'hair bulge' that took the hat offline on
    2026-09-30). Two bands:

      y < hard_y  : PURE HEAD zone (coverage is hard 255 above y0-2sigma;
                    collars can't reach here). Erase ANY body alpha where the
                    source is air - this also removes the low-saturation
                    feathered hair-edge pixels that the HSV bands miss.
      hard_y..cut : SEAM band. Erase only body skin/hair (HSV), so clothing
                    collars the source doesn't paint are never punched.

    Returns the enlarged L hole; never touches the head layer (source has no
    RGB on air pixels). Applies to every whole-head gear (frog/elf/wizard)."""
    sa = np.asarray(src_cutout)[:, :, 3] > 8
    ba = np.asarray(body)
    ys, xs = np.where(sa)
    if len(ys) == 0:
        return base_hole
    bx0, bx1 = int(xs.min()), int(xs.max()) + 1
    yy = np.arange(H)[:, None]
    xx = np.arange(W)[None, :]
    in_box = (yy < cut_y) & (xx >= bx0) & (xx < bx1)
    hard_rows = yy < hard_y
    bh, bs, bv = rgb2hsv(ba[:, :, :3])
    body_paint = bodylike(bh, bs, bv)
    bulge = (in_box & (~sa) & (ba[:, :, 3] > 0) &
             (hard_rows | body_paint))
    return Image.fromarray(
        np.maximum(np.asarray(base_hole), bulge * 255)
        .clip(0, 255).astype(np.uint8), "L")


def splice_soft_masks(hat_id, src):
    """(hat_soft, hole_soft) L masks; hole = footprint eroded + feathered, so
    the hat layer always over-covers every cut pixel."""
    hm = hat_region_mask(hat_id, src)

    def to_l(m, feather):
        im = Image.fromarray((m.astype(np.uint8) * 255), "L")
        return im.filter(ImageFilter.GaussianBlur(feather)) if feather else im

    hole_hard = ndi.binary_erosion(hm, iterations=HAT_HOLE_ERODE)
    return (to_l(hm, HAT_FEATHER), to_l(hole_hard, HAT_FEATHER),
            hole_hard)


def cutout_exists(stem):
    return os.path.exists(os.path.join(CDIR, stem + "-rmbg.png"))


def load_cutout(stem):
    """Load a rembg cutout (*-rmbg.png) produced by step1."""
    return Image.open(os.path.join(CDIR, stem + "-rmbg.png")).convert("RGBA")


def _rembg_image(im):
    return remove(im, session=rembg_session(), post_process_mask=True)


def fetch_cutout(url):
    """Download a white-bg source URL, run rembg (u2net) and return an RGBA
    cutout so cuts never carry the white background rectangle."""
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        data = r.read()
    im = Image.open(io.BytesIO(data)).convert("RGB")
    return _rembg_image(im)


def master_cutout(filename):
    """Local masters/ white-bg source -> RGBA cutout (reuses the step1 cutout
    when present so rembg runs only once)."""
    stem = os.path.splitext(os.path.basename(filename))[0]
    pre = os.path.join(CDIR, stem + "-rmbg.png")
    if os.path.exists(pre):
        return Image.open(pre).convert("RGBA")
    return _rembg_image(Image.open(os.path.join(MDIR, filename)).convert("RGB"))


def hat_source_cutout(hat_id):
    """Return the hatted RGBA source for a hat, or None if unavailable.

    Local masters reuse the step1 cutout when present so rembg runs only once;
    otherwise the master is removed on demand. CDN sources are fetched + cut.
    """
    kind, ref = HATS[hat_id]["source"]
    if kind == "cdn":
        return fetch_cutout(ref)
    stem = os.path.splitext(os.path.basename(ref))[0]
    pre = os.path.join(CDIR, stem + "-rmbg.png")
    if os.path.exists(pre):
        return Image.open(pre).convert("RGBA")
    path = os.path.join(MDIR, ref)
    if not os.path.exists(path):
        return None
    return _rembg_image(Image.open(path).convert("RGB"))


def cut_mask(src, mask):
    """Keep src pixels through mask (full canvas). mask may be a soft L mask:
    paste uses it as coverage, so edges are anti-aliased."""
    out = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    out.paste(src, (0, 0), mask)
    return out


def cut_hole(layer, hole_mask):
    """Return a copy of layer whose alpha is zeroed inside hole_mask. A soft L
    mask erases proportionally (min(alpha, 255-hole))."""
    out = layer.copy()
    inv = hole_mask.point(lambda v: 255 - v)            # NOT hole
    new_a = ImageChops.darker(out.getchannel("A"), inv)  # alpha AND NOT hole
    out.putalpha(new_a)
    return out


def cut_horizontal(src, y_min=None, y_max=None):
    """Native-alpha horizontal band: keep rows y_min<=y<y_max (either optional)."""
    band = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(band)
    lo = y_min if y_min is not None else 0
    hi = (y_max - 1) if y_max is not None else H - 1
    d.rectangle([0, lo, W - 1, hi], fill=255)
    out = src.copy()
    new_a = ImageChops.darker(out.getchannel("A"), band)
    out.putalpha(new_a)
    return out


def fit_shoe_to_foot(shoe, foot):
    """Cover the bare-foot pixels that poke past the shoe at the lower outer toe
    box. For each row in the toe band, walk out from each shoe edge up to
    SHOE_FIT_RADIUS and paint the nearest shoe-edge colour while the bare FOOT
    occupies that pixel; stop at the first empty pixel so nothing hangs in air.
    """
    sa = np.asarray(shoe)                       # RGBA
    fa = np.asarray(foot)
    Hp, Wp = sa.shape[:2]
    out = sa.copy()
    for y in range(SHOE_FIT_YMIN, Hp):
        if not (sa[y, :, 3] > 8).any():
            continue
        cols = np.where(sa[y, :, 3] > 8)[0]
        for edge, step in ((int(cols.min()), -1), (int(cols.max()), 1)):
            color = sa[y, edge].copy()          # nearest shoe edge pixel colour
            x = edge + step
            for _ in range(SHOE_FIT_RADIUS):
                if x < 0 or x >= Wp:
                    break
                if not (fa[y, x, 3] > 8):       # no foot here -> stop, keep air
                    break
                if out[y, x, 3] > 8:            # already shoe
                    x += step
                    continue
                out[y, x] = color               # extend shoe over the bare toe
                x += step
    return Image.fromarray(out, "RGBA")


def checker(size, cell=32):
    img = Image.new("RGB", size, (222, 222, 222))
    d = ImageDraw.Draw(img)
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            if (x // cell + y // cell) % 2:
                d.rectangle([x, y, x + cell - 1, y + cell - 1], fill=(186, 186, 186))
    return img


def compose(layers):
    bg = checker((W, H))
    for lay in layers:
        bg.paste(lay, (0, 0), lay)
    return bg


def save_alpha_mask(mask_l, path):
    """Persist a soft L mask as RGBA PNG with the mask in the alpha channel
    (RGB 0), so the app reads one WEBP and erases body via alpha AND NOT it."""
    zero = Image.new("L", mask_l.size, 0)
    Image.merge("RGBA", (zero, zero, zero, mask_l)).save(path)


def main():
    # ---- hat sources & body-independent layers ----
    # Item hats (ellipse/color) ship one item layer + one generic hole mask;
    # non-pair head hats (frog/elf) ship one baked head layer; pair head hats
    # (wizard) ALSO ship one NEUTRAL head now (runtime relit), in addition to
    # the per-body baked truth variants kept below for the offline regression.
    hat_assets = {}       # hid -> {"mode","hat":generic RGBA,"hole":L,"info"}
    pair_src = {}         # hid -> source RGBA
    for hid, h in HATS.items():
        src = hat_source_cutout(hid)
        if src is None:
            print("skip hat (no source):", hid)
            continue
        mode = h.get("cut_mode", "color")
        rec = {"mode": mode}
        if mode == "ellipse":
            band = hat_band(hid)
            # hole only where R lands on a source pixel; trims the 1-3px
            # sliver where an ellipse runs past the real brim.
            src_on = (np.asarray(band) > 0) & (np.asarray(src)[:, :, 3] > 8)
            hole_soft = Image.fromarray((src_on * 255).astype(np.uint8), "L")
            hat_im = cut_mask(src, band)
            save_alpha_mask(hole_soft,
                            os.path.join(MASKDIR, f"hole-{hid}.png"))
        elif mode == "head":
            info = head_src_info(hid, src)
            rec["info"] = info
            if info["pair"]:
                pair_src[hid] = src
                # Runtime pair head SOURCE: the hatted source cut to the neck
                # WITHOUT the body-dependent hair gate and WITHOUT relit -
                # its alpha still covers source skin AND back-hair across the
                # transition band. The app recomputes gate = srcSkin OR
                # (srcHair AND body skin/hair) against the WORN body at runtime
                # (verified pixel-identical to per-body baked heads on
                # 2026-10-03). cut/feather are the horizontal head-cut only
                # (non-pair coverage), so no body is involved.
                src_cov0, _ = _coverage(info["alpha"], info, HEAD_OVERLAP)
                source_head = cut_mask(src, src_cov0)
                source_head.save(os.path.join(HHDIR, f"head-{hid}.png"))
                print("runtime pair head source ->", hid)
                hat_assets[hid] = rec
                continue
            src_cov, hole_soft = head_cut_coverage(info, src)
            hat_im = cut_mask(src, src_cov)
            hat_im.save(os.path.join(HHDIR, f"head-{hid}.png"))
        else:
            hat_soft, hole_soft, _h = splice_soft_masks(hid, src)
            hat_im = cut_mask(src, hat_soft)
            save_alpha_mask(hole_soft,
                            os.path.join(MASKDIR, f"hole-{hid}.png"))
        hat_im.save(os.path.join(HDIR, f"hat-{hid}.png"))
        rec["hat"], rec["hole"] = hat_im, hole_soft
        hat_assets[hid] = rec

    # ---- outfit bodies; per-hat forhat (+ per-body pair hats) ----
    available = []
    pair_hat_files = {}             # (oid,hid) -> hat file path
    for oid, o in OUTFITS.items():
        stem = o["cutout"]
        if not cutout_exists(stem):
            print("skip outfit (no cutout):", oid)
            continue
        nohat = load_cutout(stem)
        nohat.save(os.path.join(ODIR, f"outfit-{oid}-nohat.png"))
        for hid, rec in hat_assets.items():
            if rec["mode"] == "head" and rec.get("info", {}).get("pair"):
                hat_im, hole_cov = head_cut_coverage(
                    rec["info"], pair_src[hid], nohat)
                # head-ownership bulge erase uses the pair source silhouette
                info = rec["info"]
                hard_y = info["y0"] - 2 * info["feather"]
                hole_cov = head_ownership_hole(
                    pair_src[hid], nohat, info["cut"], hole_cov, hard_y)
                hp = os.path.join(HDIR, f"hat-{hid}-on-{oid}.png")
                hat_im.save(hp)
                pair_hat_files[(oid, hid)] = hp
                forhat = cut_hole(nohat, hole_cov)
            elif rec["mode"] == "head":
                # non-pair whole-head gear (frog/elf): same ownership erase
                # against this body using the gear's own hatted source
                info2 = rec["info"]
                hard_y2 = info2["y0"] - 2 * info2["feather"]
                hole = head_ownership_hole(
                    hat_source_cutout(hid), nohat,
                    info2["cut"], rec["hole"], hard_y2)
                forhat = cut_hole(nohat, hole)
            else:
                forhat = cut_hole(nohat, rec["hole"])
            forhat.save(os.path.join(ODIR, f"outfit-{oid}-forhat-{hid}.png"))
        available.append((oid, nohat))

    # internal gap: every hard gate pixel is alpha-backed -> always 0
    for hid, rec in hat_assets.items():
        print(f"hat {hid:9s} cut_mode={rec['mode']:7s} internal_gap_px=0")

    # ---- shoe layer (unchanged by hat edits; reuse when already built) ----
    shoe_p = os.path.join(SDIR, "shoe-default.png")
    if os.path.exists(shoe_p):
        shoe = Image.open(shoe_p).convert("RGBA")
    else:
        shoe = cut_horizontal(master_cutout(CORE_SHOD_MASTER),
                              y_min=SHOE_CUT - SHOE_OVERLAP)
        if available:
            shoe = fit_shoe_to_foot(shoe, available[0][1])
        shoe.save(shoe_p)

    def pair_files(oid, hid):
        """(forhat RGBA, hat RGBA) saved-file pair; None if not prebuilt."""
        fh_p = os.path.join(ODIR, f"outfit-{oid}-forhat-{hid}.png")
        if not os.path.exists(fh_p):
            return None
        fh_im = Image.open(fh_p).convert("RGBA")
        hat_p = pair_hat_files.get((oid, hid))
        hat_im = (Image.open(hat_p).convert("RGBA") if hat_p
                  else hat_assets[hid]["hat"])
        return fh_im, hat_im

    # ---- QC contact sheet: themed looks + cross mixes ----
    scenes = []
    for oid, nohat in available:
        scenes.append((f"{oid} nohat", [nohat]))
        if oid in hat_assets:
            pair = pair_files(oid, oid)
            scenes.append((f"{oid}+hat", [pair[0], shoe, pair[1]]))
    # cross: every available outfit wearing every available non-themed hat
    for oid, nohat in available:
        for hid in hat_assets:
            if hid == oid:
                continue
            pair = pair_files(oid, hid)
            if pair is None:
                continue
            scenes.append((f"cross {oid}+{hid}",
                           [pair[0], shoe, pair[1]]))

    cell = 380
    per_row = 4
    rows = (len(scenes) + per_row - 1) // per_row
    sheet = Image.new("RGB", (cell * per_row, (cell + 30) * rows), (255, 255, 255))
    for i, (label, order) in enumerate(scenes):
        comp = compose(order).resize((cell, cell), Image.LANCZOS)
        c = Image.new("RGB", (cell, cell + 30), (255, 255, 255))
        c.paste(comp, (0, 0))
        ImageDraw.Draw(c).text((6, cell + 8), label, fill=(20, 20, 20))
        sheet.paste(c, ((i % per_row) * cell, (i // per_row) * (cell + 30)))
    out = os.path.join(QDIR, "contact-compose.png")
    sheet.save(out)

    print("outfits ->", ODIR)
    print("hats    ->", HDIR)
    print("shoes   ->", SDIR)
    print("contact ->", out)


if __name__ == "__main__":
    main()

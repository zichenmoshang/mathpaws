"""Measure the binoculars outline on the full explorer master with a grid."""
import os
from PIL import Image, ImageDraw
from step2_layers import load, checker, QDIR

im = load("dress-job-explorer-full-rmbg.png")
box = (820, 950, 1240, 1420)
c = checker((box[2] - box[0], box[3] - box[1]))
c.paste(im.crop(box), (0, 0), im.crop(box))
scale = 2
c = c.resize((c.width * scale, c.height * scale), Image.LANCZOS)
d = ImageDraw.Draw(c)
for gx in range(box[0], box[2] + 1, 25):
    x = (gx - box[0]) * scale
    major = (gx % 100 == 0)
    d.line([x, 0, x, c.height], fill=(255, 0, 0) if major else (255, 170, 170), width=2 if major else 1)
    if major:
        d.text((x + 2, 2), str(gx), fill=(200, 0, 0))
for gy in range(box[1], box[3] + 1, 25):
    y = (gy - box[1]) * scale
    major = (gy % 100 == 0)
    d.line([0, y, c.width, y], fill=(255, 0, 0) if major else (255, 170, 170), width=2 if major else 1)
    if major:
        d.text((2, y + 2), str(gy), fill=(200, 0, 0))
out = os.path.join(QDIR, "acc-measure.png")
c.save(out)
print(out)

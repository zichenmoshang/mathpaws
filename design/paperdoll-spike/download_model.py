"""One-off: fetch u2net.onnx for rembg via GitHub mirrors (local network has an
SSL-intercepting cert that breaks the default pooch/github download). Verifies
size (~176 MB) before accepting.
"""
import os
import urllib3
import requests

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

DSTDIR = os.path.join(os.path.expanduser("~"), ".rembg", "models", "u2net")
os.makedirs(DSTDIR, exist_ok=True)
DST = os.path.join(DSTDIR, "u2net.onnx")
BASE = "https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2net.onnx"
MIRRORS = [
    "https://ghfast.top/" + BASE,
    "https://gh-proxy.com/" + BASE,
    "https://mirror.ghproxy.com/" + BASE,
    "https://ghproxy.net/" + BASE,
    BASE,
]

for url in MIRRORS:
    try:
        print("try", url, flush=True)
        with requests.get(url, stream=True, timeout=30, verify=False, allow_redirects=True) as r:
            r.raise_for_status()
            total = 0
            tmp = DST + ".part"
            with open(tmp, "wb") as f:
                for chunk in r.iter_content(1 << 20):
                    if chunk:
                        f.write(chunk); total += len(chunk)
            print("  downloaded", total, flush=True)
            if total > 100 * 1024 * 1024:
                os.replace(tmp, DST)
                print("OK ->", DST, total)
                break
            print("  too small, trying next")
    except Exception as e:
        print("  fail:", repr(e))
else:
    raise SystemExit("all mirrors failed")

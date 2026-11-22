"""Creates 1200x630 JPEG social-share images (Open Graph / X) for every photo, in Site/assets/og/.
Requires Pillow.  Run: python3 tools/og.py"""
import glob, os
from PIL import Image, ImageOps

SITE = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "Site"))
OUT = f"{SITE}/assets/og"
os.makedirs(OUT, exist_ok=True)
names = sorted({os.path.basename(f)[:-7] for f in glob.glob(f"{SITE}/assets/img/*-l.webp")})
for n in names:
    im = Image.open(f"{SITE}/assets/img/{n}-l.webp").convert("RGB")
    ImageOps.fit(im, (1200, 630), Image.LANCZOS, centering=(0.5, 0.45)).save(f"{OUT}/{n}.jpg", "JPEG", quality=82, optimize=True, progressive=True)
print(f"{len(names)} share images in {OUT}")

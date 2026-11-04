#!/usr/bin/env python3
"""
3GAAM photo pipeline.

Reads data/products.json. For every colorway that has a "source" file name it:
  1. cuts the shoe out of the photo (rembg / isnet-general-use) — skipped when the photo already has alpha
  2. cleans the matte (drops stray blobs, trims halo), crops to the shoe
  3. writes assets/products/<slug>/<color-id>.webp  (max 1400px) and -sm.webp (560px)
  (per-colour options in products.json: keep:'largest', alphaCut:0-255, crop:[x0,y0,x1,y1] fractions)
  4. extracts a dominant colour and writes the scene "theme" (bg / bg2 / accent) back to products.json

Usage:
  pip install rembg onnxruntime pillow numpy scipy
  python3 tools/process_photos.py --src photos-src            # only colorways whose output is missing
  python3 tools/process_photos.py --src photos-src --force    # redo everything
  python3 tools/process_photos.py --only air-jordan-1-high    # one product
  python3 tools/process_photos.py --theme-only                # recompute themes from existing webp
"""
import argparse, colorsys, json, os, sys
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'data', 'products.json')
OUT = os.path.join(ROOT, 'assets', 'products')
CACHE = os.path.join(ROOT, 'tools', '.cache')
MAX_W, SM_W = 1400, 560


def clean_alpha(img, keep='all', ratio=0.12, cut=14, crop=None):
    from scipy import ndimage
    a = np.array(img.getchannel('A'))
    if crop:                                   # [x0,y0,x1,y1] as fractions of the photo
        h, w = a.shape
        m = np.zeros_like(a); m[int(crop[1]*h):int(crop[3]*h), int(crop[0]*w):int(crop[2]*w)] = 1
        a = a * m
    a[a < cut] = 0
    lab, n = ndimage.label(a > 0)
    if n > 1:
        sizes = ndimage.sum(a > 0, lab, range(1, n + 1))
        mx = sizes.max()
        if keep == 'largest':
            ok = [i + 1 for i, s in enumerate(sizes) if s == mx]
        else:
            ok = [i + 1 for i, s in enumerate(sizes) if s >= mx * ratio]
        a = np.where(np.isin(lab, ok), a, 0)
    al = Image.fromarray(a.astype('uint8'))
    al = al.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.7))
    out = img.copy(); out.putalpha(al)
    return out


def crop_pad(img, pad=0.02):
    bb = img.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox()
    x0, y0, x1, y1 = bb
    p = int(max(x1 - x0, y1 - y0) * pad)
    return img.crop((max(0, x0 - p), max(0, y0 - p), min(img.width, x1 + p), min(img.height, y1 + p)))


def theme_from(img, world=None):
    sm = img.copy(); sm.thumbnail((220, 220))
    arr = np.array(sm).reshape(-1, 4).astype('float32')
    arr = arr[arr[:, 3] > 200][:, :3] / 255.0
    hsv = np.array([colorsys.rgb_to_hsv(*p) for p in arr[::2]])
    sat = (hsv[:, 1] > 0.30) & (hsv[:, 2] > 0.22)
    h = None
    if sat.mean() > 0.035:
        bins = np.floor(hsv[sat, 0] * 24).astype(int) % 24
        w = hsv[sat, 1] * np.sqrt(hsv[sat, 2])
        hist = np.bincount(bins, weights=w, minlength=24)
        hist = hist + np.roll(hist, 1) * .5 + np.roll(hist, -1) * .5
        h = (np.argmax(hist) + .5) / 24
        s_ = float(np.clip(hsv[sat, 1].mean(), .5, .85))
    if world:
        r, g, b = [int(world[i:i + 2], 16) / 255 for i in (1, 3, 5)]
        h, s_, _ = colorsys.rgb_to_hsv(r, g, b); s_ = float(np.clip(s_, .5, .85))
    if h is None:                       # neutral shoe -> brand blue world
        h, s_ = 0.575, 0.68
    hx = lambda hh, ss, vv: '#%02x%02x%02x' % tuple(int(c * 255) for c in colorsys.hsv_to_rgb(hh % 1, ss, vv))
    return {'bg': hx(h, s_, .46), 'bg2': hx(h - .035, min(1, s_ + .1), .17), 'accent': hx(h + .01, .55, 1.0), 'hue': round(h, 3)}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--src', default=os.path.join(ROOT, 'photos-src'))
    ap.add_argument('--only'); ap.add_argument('--force', action='store_true'); ap.add_argument('--theme-only', action='store_true')
    a = ap.parse_args()
    data = json.load(open(DATA, encoding='utf-8'))
    sess = None
    os.makedirs(CACHE, exist_ok=True)
    for p in data['products']:
        if a.only and p['slug'] != a.only: continue
        os.makedirs(os.path.join(OUT, p['slug']), exist_ok=True)
        for c in p['colors']:
            rel = f"assets/products/{p['slug']}/{c['id']}.webp"
            path = os.path.join(ROOT, rel)
            if not a.theme_only and c.get('source') and (a.force or not os.path.exists(path)):
                src = os.path.join(a.src, c['source'])
                if not os.path.exists(src):
                    print('! missing source', src); continue
                cache = os.path.join(CACHE, p['slug'] + '-' + c['id'] + '.png')
                if os.path.exists(cache) and not a.force:
                    cut = Image.open(cache).convert('RGBA')
                else:
                    im = Image.open(src)
                    if im.mode == 'RGBA' and im.getchannel('A').getextrema()[0] < 250:
                        cut = im
                    else:
                        if sess is None:
                            from rembg import new_session
                            sess = new_session('isnet-general-use')
                        from rembg import remove
                        cut = remove(im.convert('RGB'), session=sess)
                    cut = cut.convert('RGBA'); cut.save(cache)
                cut = crop_pad(clean_alpha(cut, c.get('keep', 'all'), cut=c.get('alphaCut', 14), crop=c.get('crop')))
                big = cut.copy()
                if big.width > MAX_W: big = big.resize((MAX_W, round(big.height * MAX_W / big.width)), Image.LANCZOS)
                big.save(path, 'WEBP', quality=88, method=6)
                sm = big.resize((SM_W, round(big.height * SM_W / big.width)), Image.LANCZOS)
                sm.save(path.replace('.webp', '-sm.webp'), 'WEBP', quality=84, method=6)
                print('ok', rel, big.size)
            if os.path.exists(path):
                im = Image.open(path).convert('RGBA')
                c['image'] = rel; c['imageSm'] = rel.replace('.webp', '-sm.webp')
                c['w'], c['h'] = im.size
                c['theme'] = theme_from(im, c.get('world'))
    json.dump(data, open(DATA, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    print('products.json updated')

if __name__ == '__main__':
    main()

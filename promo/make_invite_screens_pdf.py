# -*- coding: utf-8 -*-
# 초대장 화면 자료 PDF 만들기 (A4 세로, 200dpi)
import json, os, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

S = os.path.dirname(os.path.abspath(__file__))
os.chdir(S)
OUT = sys.argv[1]
FD = os.path.join(S, "SuseongDotum.ttf")
FB = os.path.join(S, "SuseongBatang.ttf")
OG = r"C:\Users\user\해오라기\suseong-story-space\public\og-invite-v2.jpg"

src = Image.open("pdfsrc.jpg").convert("RGB")
SC = 2  # 화면 1px = 캡처 2px
secs = json.load(open("pdfsrc.jpg.sections.json", encoding="utf-8"))
W, H = 1654, 2339
M = 90
NAVY = (30, 10, 84); GREY = (110, 110, 120); LIGHT = (246, 242, 255); INK = (50, 45, 80)

def f(p, s): return ImageFont.truetype(p, s)

def phone(top, h, target_w):
    crop = src.crop((0, top * SC, src.width, (top + h) * SC))
    scale = target_w / crop.width
    crop = crop.resize((target_w, int(crop.height * scale)), Image.LANCZOS)
    r = int(target_w * 0.09); bw = max(6, int(target_w * 0.022))
    fw, fh = crop.width + 2 * bw, crop.height + 2 * bw
    frame = Image.new("RGBA", (fw, fh), (0, 0, 0, 0))
    ImageDraw.Draw(frame).rounded_rectangle((0, 0, fw - 1, fh - 1), radius=r + bw, fill=NAVY)
    mask = Image.new("L", crop.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, crop.width - 1, crop.height - 1), radius=r, fill=255)
    frame.paste(crop, (bw, bw), mask)
    return frame

def shadow_paste(page, frame, x, y):
    sh = Image.new("RGBA", (frame.width + 40, frame.height + 40), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((20, 28, frame.width + 20, frame.height + 28), radius=60, fill=(30, 10, 84, 70))
    sh = sh.filter(ImageFilter.GaussianBlur(14))
    page.alpha_composite(sh, (x - 20, y - 20))
    page.alpha_composite(frame, (x, y))

def header(page, title, sub):
    d = ImageDraw.Draw(page)
    d.rectangle((0, 0, W, 150), fill=NAVY)
    d.text((M, 42), title, font=f(FD, 40), fill=(255, 255, 255))
    d.text((M, 98), sub, font=f(FB, 24), fill=(220, 210, 255))

def footer(page, n, total):
    d = ImageDraw.Draw(page)
    d.line((M, H - 95, W - M, H - 95), fill=(200, 195, 220), width=2)
    d.text((M, H - 78), "「보육을 디자인하다」 성과보고회 모바일 초대장 · https://suseong-story-space.vercel.app/invite", font=f(FB, 22), fill=GREY)
    d.text((W - M - 90, H - 78), f"{n} / {total}", font=f(FB, 22), fill=GREY)

def rounded(img, r):
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, img.width - 1, img.height - 1), radius=r, fill=255)
    return mask

pages = []

# ── 1쪽: 개요
p = Image.new("RGBA", (W, H), (255, 255, 255, 255))
header(p, "모바일 초대장 화면 자료", "『2026 AI 미래성장아카데미』 보육을 디자인하다 성과보고회 · 2026. 10. 13.(화) 수성구청 지하 대강당")
cover = phone(0, 812, 640)
shadow_paste(p, cover, M, 220)
d = ImageDraw.Draw(p)
d.text((M + cover.width // 2, 220 + cover.height + 22), "초대장 표지 (휴대폰 화면)", font=f(FD, 28), fill=NAVY, anchor="ma")
x2 = M + cover.width + 70; y = 220
d.text((x2, y), "개요", font=f(FD, 36), fill=NAVY); y += 60
body = [
    "·  링크 하나로 열리는 휴대폰용 초대장(웹페이지)입니다.",
    "·  카카오톡·문자로 주소를 보내면 아래 미리보기와 함께 전달됩니다.",
    "·  수성구 전용서체(수성돋움·수성바탕)와 뚜비 캐릭터를 적용했습니다.",
    "·  구성: 표지 → 모시는 글 → 성과보고회 안내(일시·장소·식순)",
    "    → 걸어온 길 → AI 선도기관 어린이집 14곳 → 미리 만나보기",
    "    → 오시는 길(지도 연결) → 관련 문의(전화 연결)",
]
for line in body:
    d.text((x2, y), line, font=f(FB, 26), fill=INK); y += 44
y += 30
d.text((x2, y), "카카오톡 미리보기", font=f(FD, 30), fill=NAVY); y += 48
og = Image.open(OG).convert("RGBA"); ow = W - M - x2
og = og.resize((ow, int(og.height * ow / og.width)), Image.LANCZOS)
p.paste(og, (x2, y), rounded(og, 24)); y += og.height + 50
d = ImageDraw.Draw(p)
d.text((x2, y), "초대장 주소 · QR", font=f(FD, 30), fill=NAVY); y += 48
qr = Image.open("qr-invite.png").convert("RGBA").resize((300, 300), Image.LANCZOS)
p.paste(qr, (x2, y))
d.text((x2 + 330, y + 30), "휴대폰 카메라로 QR을 비추면", font=f(FB, 24), fill=GREY)
d.text((x2 + 330, y + 66), "초대장이 바로 열립니다.", font=f(FB, 24), fill=GREY)
d.text((x2 + 330, y + 140), "제작: 영유아교육디자인연구소", font=f(FB, 22), fill=GREY)
d.text((x2 + 330, y + 176), "주최: 수성구청 아동보육과", font=f(FB, 22), fill=GREY)
d.text((x2 + 330, y + 208), "        육아종합지원센터팀", font=f(FB, 22), fill=GREY)
d.text((x2, y + 320), "https://suseong-story-space.vercel.app/invite", font=f(FB, 26), fill=INK)
pages.append(p)

# ── 2쪽~: 부분별 화면
segs = []
for s in secs[1:]:
    label = s["label"].replace("\n", " ").replace("✦", "").strip()
    segs.append((label, s["top"], s["h"]))
merged = []; tail = None
for lab, t, h in segs:
    if lab in ("오시는 길", "관련 문의", "맺음"):
        if tail is None: tail = ["오시는 길 · 관련 문의", t, h]
        else: tail[2] = t + h - tail[1]
    else:
        merged.append((lab, t, h))
if tail: merged.append(tuple(tail))

COLS = 3; gap = 40; cw = (W - 2 * M - gap * (COLS - 1)) // COLS
chunks = [merged[i:i + COLS] for i in range(0, len(merged), COLS)]
for ci, chunk in enumerate(chunks):
    p = Image.new("RGBA", (W, H), (255, 255, 255, 255))
    header(p, "초대장 화면 구성", f"아래로 내려 보는 한 장짜리 화면을 부분별로 나누어 실었습니다 ({ci + 1}/{len(chunks)})")
    for k, (lab, t, h) in enumerate(chunk):
        x = M + k * (cw + gap)
        maxh = H - 250 - 130
        tw = min(cw - 30, int(375 * maxh / (h * 1.05)))
        fr = phone(t, h, tw)
        shadow_paste(p, fr, x + (cw - fr.width) // 2, 250)
        d = ImageDraw.Draw(p)
        d.rounded_rectangle((x, 190, x + cw, 236), radius=12, fill=LIGHT)
        d.text((x + cw // 2, 213), lab, font=f(FD, 24), fill=NAVY, anchor="mm")
    pages.append(p)

total = len(pages)
for i, p in enumerate(pages): footer(p, i + 1, total)
pages[0].convert("RGB").save(OUT, save_all=True, append_images=[q.convert("RGB") for q in pages[1:]], resolution=200.0, quality=90)
print("pdf pages", total, "bytes", os.path.getsize(OUT))

import fitz
doc = fitz.open(OUT)
for i, pg in enumerate(doc):
    pg.get_pixmap(dpi=60).save(os.path.join(S, f"pdfchk{i + 1}.png"))
print("check images", len(doc))

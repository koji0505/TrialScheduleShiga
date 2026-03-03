"""
裁判員裁判スケジュールアプリ アイコン生成スクリプト
テーマ: 正義の天秤（ダークネイビー × ゴールド）
"""
from PIL import Image, ImageDraw
import os, math

SIZE   = 1024
BG     = "#1a1a2e"        # ダークネイビー
GOLD   = "#C9A84C"        # ゴールド（主体）
GOLD_L = "#EDD27A"        # ゴールド（ハイライト）
GOLD_D = "#8B6914"        # ゴールド（シャドウ）
RING   = "#2a3a6e"        # 背景リングの色

cx, cy = SIZE // 2, SIZE // 2

# ── 各部品のパラメータ ──────────────────────────────
BEAM_Y    = 390            # ビーム（横棒）の中心 Y
BEAM_W    = 640            # ビーム全幅
BEAM_H    = 26             # ビーム高さ
PIVOT_R   = 34             # 支点円の半径

COL_W     = 32             # 柱幅
COL_TOP   = BEAM_Y + 10   # 柱の上端
COL_BOT   = 730            # 柱の下端

BASE_W    = 300            # 台座幅
BASE_H    = 28             # 台座高さ
FOOT_W    = 360            # 台座フット幅
FOOT_H    = 18             # 台座フット高さ

CHAIN_X_L = cx - BEAM_W//2 + 50   # 左チェーン X
CHAIN_X_R = cx + BEAM_W//2 - 50   # 右チェーン X
CHAIN_BOT = 620            # チェーン下端 Y
CHAIN_W   = 8              # チェーン幅

PAN_W     = 190            # 皿の幅
PAN_H     = 22             # 皿の高さ
PAN_Y     = CHAIN_BOT + PAN_H // 2 + 4  # 皿中心 Y


def draw_rounded_rect(draw, xy, r, fill):
    """角丸長方形"""
    x0, y0, x1, y1 = xy
    draw.rectangle([x0+r, y0, x1-r, y1], fill=fill)
    draw.rectangle([x0, y0+r, x1, y1-r], fill=fill)
    for cx_, cy_ in [(x0+r, y0+r), (x1-r, y0+r), (x0+r, y1-r), (x1-r, y1-r)]:
        draw.ellipse([cx_-r, cy_-r, cx_+r, cy_+r], fill=fill)


def make_icon(size=SIZE):
    img  = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    s    = size / SIZE       # スケール係数

    def S(v):  return int(v * s)
    def SX(v): return int(cx * s + (v - cx) * s)
    def SY(v): return int(cy * s + (v - cy) * s)

    # ── 背景（角丸正方形） ──
    r_bg = S(120)
    draw_rounded_rect(draw, [0, 0, S(SIZE)-1, S(SIZE)-1], r_bg, BG)

    # ── 背景リング（微妙な奥行き感） ──
    ring_r = S(420)
    draw.ellipse(
        [SX(cx)-ring_r, SY(cy)-ring_r, SX(cx)+ring_r, SY(cy)+ring_r],
        fill=RING
    )

    # ── ビーム（横棒） ──
    bx0 = SX(cx - BEAM_W//2)
    bx1 = SX(cx + BEAM_W//2)
    by0 = SY(BEAM_Y - BEAM_H//2)
    by1 = SY(BEAM_Y + BEAM_H//2)
    draw_rounded_rect(draw, [bx0, by0, bx1, by1], S(8), GOLD)
    # ハイライトライン
    draw.rectangle([bx0+S(10), by0+S(3), bx1-S(10), by0+S(7)], fill=GOLD_L)

    # ── 支点（ビーム中央の円） ──
    pr = S(PIVOT_R)
    draw.ellipse(
        [SX(cx)-pr, SY(BEAM_Y)-pr, SX(cx)+pr, SY(BEAM_Y)+pr],
        fill=GOLD_L
    )
    draw.ellipse(
        [SX(cx)-S(12), SY(BEAM_Y)-S(12), SX(cx)+S(12), SY(BEAM_Y)+S(12)],
        fill=GOLD_D
    )

    # ── 柱（縦棒） ──
    draw.rectangle(
        [SX(cx)-S(COL_W//2), SY(COL_TOP), SX(cx)+S(COL_W//2), SY(COL_BOT)],
        fill=GOLD
    )
    # 柱のハイライト
    draw.rectangle(
        [SX(cx)-S(COL_W//2)+S(4), SY(COL_TOP), SX(cx)-S(COL_W//2)+S(9), SY(COL_BOT)],
        fill=GOLD_L
    )

    # ── 台座 ──
    draw_rounded_rect(draw,
        [SX(cx)-S(BASE_W//2), SY(COL_BOT), SX(cx)+S(BASE_W//2), SY(COL_BOT+BASE_H)],
        S(4), GOLD
    )
    draw_rounded_rect(draw,
        [SX(cx)-S(FOOT_W//2), SY(COL_BOT+BASE_H), SX(cx)+S(FOOT_W//2), SY(COL_BOT+BASE_H+FOOT_H)],
        S(4), GOLD_D
    )

    # ── チェーン（左右） ──
    for cx_ in [CHAIN_X_L, CHAIN_X_R]:
        # チェーンの線
        draw.rectangle(
            [SX(cx_)-S(CHAIN_W//2), SY(BEAM_Y+BEAM_H//2),
             SX(cx_)+S(CHAIN_W//2), SY(CHAIN_BOT)],
            fill=GOLD
        )
        # チェーンの節
        seg_h = S(22)
        y = SY(BEAM_Y + BEAM_H//2) + seg_h
        while y < SY(CHAIN_BOT):
            draw.ellipse(
                [SX(cx_)-S(10), y-S(7), SX(cx_)+S(10), y+S(7)],
                fill=GOLD_L
            )
            y += seg_h * 2

    # ── 皿（左右） ──
    for cx_ in [CHAIN_X_L, CHAIN_X_R]:
        px0 = SX(cx_) - S(PAN_W//2)
        px1 = SX(cx_) + S(PAN_W//2)
        py0 = SY(PAN_Y) - S(PAN_H//2)
        py1 = SY(PAN_Y) + S(PAN_H//2)
        # 皿の影
        draw.ellipse([px0+S(4), py0+S(6), px1+S(4), py1+S(6)], fill=GOLD_D)
        # 皿本体
        draw.ellipse([px0, py0, px1, py1], fill=GOLD)
        # 皿のハイライト
        draw.ellipse(
            [px0+S(20), py0+S(3), px1-S(20), py0+S(9)],
            fill=GOLD_L
        )

    return img


def save(img, path):
    # RGBAのまま保存（背景の角丸をクリップするため）
    # icon.png は PNG で保存
    rgb = Image.new("RGB", img.size, BG)
    rgb.paste(img, mask=img.split()[3])
    rgb.save(path, "PNG")
    print(f"  保存: {path}  ({img.size[0]}x{img.size[1]})")


out = os.path.join(os.path.dirname(__file__), "app", "assets")
os.makedirs(out, exist_ok=True)

print("アイコン生成中...")

icon = make_icon(1024)
save(icon, os.path.join(out, "icon.png"))
save(icon, os.path.join(out, "adaptive-icon.png"))

splash = make_icon(1024)
save(splash, os.path.join(out, "splash-icon.png"))

print("完了!")

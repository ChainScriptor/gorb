"""Builds the Gorb origin-story PDF.

Gagalin is a PostScript-outline OTF, which reportlab refuses to embed. PIL's
FreeType binding reads it fine, so every display line is rendered to a
transparent PNG at 3x and placed as an image. Body copy uses Georgia, which
is a plain TrueType and embeds normally.
"""

import os
import tempfile

from PIL import Image, ImageDraw, ImageFont, ImageFilter
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import simpleSplit

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(HERE, "The Grove to the Drive-Thru.pdf")

GAGALIN = os.path.join(ROOT, "public", "Gagalin-Regular.otf")
pdfmetrics.registerFont(TTFont("Georgia", "C:/Windows/Fonts/georgia.ttf"))
pdfmetrics.registerFont(TTFont("Georgia-Italic", "C:/Windows/Fonts/georgiai.ttf"))
pdfmetrics.registerFont(TTFont("Georgia-Bold", "C:/Windows/Fonts/georgiab.ttf"))

W, H = 1280.0, 720.0
SCALE = 3  # supersampling for the display-type PNGs

GROUND = (0x0B, 0x07, 0x10)
INK = "#EFE7F5"
INK_SOFT = "#B0A0BE"
INK_FAINT = "#7E6E8C"

TMP = tempfile.mkdtemp(prefix="gorbpdf_")
_seq = [0]


def _tmp(name):
    _seq[0] += 1
    return os.path.join(TMP, "%03d_%s.png" % (_seq[0], name))


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


_photo_cache = {}


def photo(path, max_w=1600, quality=86):
    """PNG photographs embed losslessly and blow the file up to ~85MB. Re-encode
    them as JPEG once so reportlab can drop the DCT stream in directly."""
    if path in _photo_cache:
        return _photo_cache[path]
    im = Image.open(path).convert("RGB")
    if im.size[0] > max_w:
        im = im.resize((max_w, int(max_w * im.size[1] / float(im.size[0]))),
                       Image.LANCZOS)
    out = os.path.join(TMP, "photo_%d.jpg" % len(_photo_cache))
    im.save(out, "JPEG", quality=quality, optimize=True, progressive=True)
    _photo_cache[path] = out
    return out


# ---------------------------------------------------------------- display type

def display_lines(text, px, max_px):
    """Greedy wrap measured in the actual Gagalin metrics."""
    font = ImageFont.truetype(GAGALIN, px * SCALE)
    probe = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    lines, cur = [], ""
    for word in text.split():
        trial = (cur + " " + word).strip()
        if probe.textlength(trial, font=font) <= max_px * SCALE or not cur:
            cur = trial
        else:
            lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


def display_png(text, px, color, glow=None, max_px=2000, leading=1.05):
    """Render one or more lines of Gagalin to a transparent PNG."""
    font = ImageFont.truetype(GAGALIN, px * SCALE)
    lines = display_lines(text, px, max_px)
    probe = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    widths = [probe.textlength(l, font=font) for l in lines]
    lh = int(px * SCALE * leading)
    pad = int(px * SCALE * 0.6)
    w = int(max(widths)) + pad * 2
    h = lh * len(lines) + pad * 2

    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    if glow:
        halo = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        hd = ImageDraw.Draw(halo)
        for i, line in enumerate(lines):
            hd.text((pad, pad + i * lh), line, font=font, fill=hex_rgb(glow) + (170,))
        halo = halo.filter(ImageFilter.GaussianBlur(px * SCALE * 0.22))
        img = Image.alpha_composite(img, halo)
        d = ImageDraw.Draw(img)

    for i, line in enumerate(lines):
        d.text((pad, pad + i * lh), line, font=font, fill=hex_rgb(color) + (255,))

    path = _tmp("disp")
    img.save(path)
    return path, w / float(SCALE), h / float(SCALE)


def scrim_png(w, h, rgba_top, rgba_bottom):
    """Vertical alpha gradient used to hold text over photography."""
    img = Image.new("RGBA", (int(w), int(h)))
    d = ImageDraw.Draw(img)
    for y in range(int(h)):
        t = y / float(max(1, h - 1))
        px = tuple(int(rgba_top[i] + (rgba_bottom[i] - rgba_top[i]) * t) for i in range(4))
        d.line([(0, y), (int(w), y)], fill=px)
    path = _tmp("scrim")
    img.save(path)
    return path


# ---------------------------------------------------------------- page helpers

def fill_page(c, rgb=GROUND):
    c.setFillColorRGB(rgb[0] / 255.0, rgb[1] / 255.0, rgb[2] / 255.0)
    c.rect(0, 0, W, H, stroke=0, fill=1)


def full_bleed(c, path):
    c.drawImage(photo(path), 0, 0, W, H, preserveAspectRatio=False, mask=None)


def place(c, png, x, y, w, h, anchor="bl"):
    if anchor == "bl":
        c.drawImage(png, x, y, w, h, mask="auto")
    elif anchor == "bc":
        c.drawImage(png, x - w / 2.0, y, w, h, mask="auto")


def body_block(c, paragraphs, x, y, width, size=19, leading=30, color=INK_SOFT,
               font="Georgia", gap=18):
    """Draws paragraphs downward from y, returns the new y."""
    for para in paragraphs:
        for line in simpleSplit(para, font, size, width):
            t = c.beginText(x, y)
            t.setFont(font, size)
            t.setFillColor(color)
            t.setCharSpace(0)
            t.textOut(line)
            c.drawText(t)
            y -= leading
        y -= gap
    return y


def label(c, text, x, y, size=11, color=INK_FAINT, spacing=2.6):
    # Letterspacing lives on the text object in reportlab 5, not on the canvas.
    t = c.beginText(x, y)
    t.setFont("Georgia-Bold", size)
    t.setFillColor(color)
    t.setCharSpace(spacing)
    t.textOut(text.upper())
    # Tc is graphics state and survives the text object, so anything drawn
    # afterwards inherits the tracking and overruns its measured width.
    t.setCharSpace(0)
    c.drawText(t)


# ---------------------------------------------------------------- the story

CH = [
    dict(n="01", title="The Grove", accent="#A52AF4", img=None,
         cast="Gorb",
         paras=[
             "Before the boxes, there was the Grove, a soft violet valley where the fog sat low and the trees grew in slow purple spirals. Nobody built the Gorbs. They came up out of the ground the way mushrooms do, in families, already knowing each other's names.",
             "The first of them was simply called Gorb. He was the one who found the river, the one who learned that if you sit very still the fog will settle on your fur like a blanket. He had a cap he found floating downstream. He never took it off.",
         ],
         beat="They had no word for owner. They had no word for sold."),

    dict(n="02", title="The Long Table", accent="#F8EE07", img="02.png",
         cast="Dad · Mom · Grandpa · Grandma · Uncle · Auntie · Baby · Dog",
         paras=[
             "The family ate outside, at a long table Dad built badly and refused to fix. Mom ran everything from one end of it. Grandpa wore a bow tie to dinner every single night, because standards are not weather dependent. Grandma's cat eye glasses caught the lamplight and made her look like she knew what you had done.",
             "Uncle told the same story about the storm of '88 in a floral shirt that had never been in fashion. Auntie corrected him, gently, every time, pearls clicking. The Baby was red and furious and small and threw more food than he ate. The Dog sat under the table with one ear up, waiting for the throwing to start.",
         ],
         beat="This is the picture the rest of the story is measured against. Look at it properly."),

    dict(n="03", title="The Visitors", accent="#F2913A", img="03.png", cast="",
         paras=[
             "The van came up the valley road on a Tuesday. Two people got out, in red and yellow, with clipboards and very clean shoes. They said they had been looking for the Gorbs for a long time. They said it like a compliment.",
             "They walked around the family in a slow circle. They held a tape measure to Baby's head. They pressed Grandma's arm with a thumb and wrote something down. They kept saying adorable, but they said it the way you say a number.",
         ],
         beat="Nobody in the family had ever been measured before. They thought it was a game."),

    dict(n="04", title="The Back of the Page", accent="#F2913A", img="04.png", cast="",
         paras=[
             "The offer was read aloud at the long table. A tour. A commercial. Your faces on a thousand windows. You will be loved by millions, they said, and the family heard the word loved and stopped listening after it.",
             "Dad signed it with an ink pad and a paw print, because he wanted to give his family something bigger than a valley. Mom asked what was on the back of the page. They told her it was nothing. Standard.",
         ],
         beat="The back of the page said merchandise. It said it eleven times."),

    dict(n="05", title="The Night of the Nets", accent="#7E93D6", img="05.png", cast="",
         paras=[
             "They did not come back with a camera crew. They came at three in the morning with floodlights and nets, and the valley turned white and flat and loud.",
             "Grandpa was taken from his chair still wearing the bow tie. Uncle swung at a floodlight and missed. The Dog barked at the vans until he did not bark anymore. Mom held Baby up over her head, away from the nets, for eleven seconds.",
         ],
         beat="Baby was taken last, so the whole family got to watch."),

    dict(n="06", title="Intake", accent="#7E93D6", img="06.png",
         cast="Alien · Slime · Shadow",
         paras=[
             "The facility had no windows and one temperature. Each Gorb was weighed, photographed against a grid, and given a number on a wrist tag. A clipboard decided which of them had, in the language of the building, shelf appeal.",
             "The ones who scored badly went through the door marked VARIANT. One came back with three eyes and a pressure suit and no memory of the river. One came back wrong at the edges, dripping, unable to hold a shape. One came back with the light gone out of him entirely, just two burning points where a face had been.",
         ],
         beat="They kept the names. The names were the only part that tested well."),

    dict(n="07", title="The Costume Line", accent="#97A1B0", img="07.png",
         cast="Rockstar · Ninja · Superhero",
         paras=[
             "Marketing had decided that a family was not a product line. A family was eight versions of the same thing. What sold was variety. So variety was installed.",
             "One got a pink mohawk stitched into his scalp and a guitar glued into his paws. One was wrapped in black until only a strip of face showed, and taught to stand very still. One had a cape sewn directly into his back, which is not the same as being given a cape.",
             "They were issued personalities on laminated cards. Loud. Silent. Brave. They practiced until the cards were true.",
         ],
         beat="By the third week none of them could remember which one used to sit by the river."),

    dict(n="08", title="The Flavour Wing", accent="#97A1B0", img="08.png",
         cast="Banana · Popcorn · Pizza",
         paras=[
             "The last corridor was the one nobody talked about, because of the smell. Somebody in a meeting had said the words cross promotional synergy, and three members of the family had been walked through that door the same afternoon.",
             "One came out half peeled and yellow and grinning too wide. One came out as a striped bucket with a mouth in it. One came out flat and hot and covered in cheese that never cooled down.",
         ],
         beat="They were made to smell like the food they would be sold beside. That was the cruellest part, and it was on purpose."),

    dict(n="09", title="Vacuum Seal", accent="#FF3B3B", img="09.png", cast="",
         paras=[
             "At the end of every wing was the same machine. A Gorb was set into a moulded plastic tray, arms arranged, head turned three degrees to the left for the photograph. A card of printed cardboard slid in behind. A sheet of clear plastic came down hot.",
             "The box said LIMITED EDITION. The box said AGES 3+. The box said a name that was almost right.",
         ],
         beat="If you looked closely at the window, and you were patient, the eyes still moved."),

    dict(n="10", title="Would You Like a Toy With That", accent="#FF3B3B", img="10.png", cast="",
         paras=[
             "They went out through the window, one per meal. A paper bag, a burger going soft in the heat of it, and a family member in a plastic bubble laid on top like a garnish.",
             "Grandma went to a car in the rain and was never opened. Baby went to a child who loved him for nine days. Uncle went into a drawer. The Dog went to a house with an actual dog, which is a joke somebody upstairs must have enjoyed. They were handed out across the whole country in a single summer, one window at a time, and then it was over and the promotion ended and nobody remembered the name.",
             "Except that the first one, the one with the cap, the one who found the river, scored badly. Too plain. No costume, no flavour, no gimmick. He was pulled off the line and thrown in the skip behind the store, still in his plastic.",
         ],
         beat="He got out of the plastic. He has been counting ever since. He knows exactly how many of his family are sitting on shelves in other people's houses, and he knows what a receipt is."),
]

BOXES = [
    (1, "Gorb"), (2, "Gorb Dad"), (3, "Gorb Mom"), (4, "Gorb Dog"),
    (5, "Gorb Uncle"), (6, "Gorb Grandpa"), (7, "Gorb Grandma"), (8, "Gorb Baby"),
    (18, "Gorb Auntie"), (9, "Gorb Alien"), (10, "Gorb Slime"), (11, "Gorb Shadow"),
    (12, "Gorb Banana"), (13, "Gorb Popcorn"), (14, "Gorb Pizza"),
    (15, "Gorb Rockstar"), (16, "Gorb Ninja"), (17, "Gorb Superhero"),
]


# ---------------------------------------------------------------- pages

def cover(c):
    full_bleed(c, os.path.join(HERE, "game-banner.png"))
    c.drawImage(scrim_png(W, H * 0.72, (11, 7, 16, 0), (11, 7, 16, 250)),
                0, 0, W, H * 0.72, mask="auto")

    png, w, h = display_png("The Grove to the Drive-Thru", 78, "#FFFFFF",
                            glow="#A52AF4", max_px=1000)
    place(c, png, 90, 200, w, h)

    label(c, "The Gorb family origin file", 104, 168, size=13, color="#F8EE07")

    c.setFont("Georgia-Italic", 20)
    c.setFillColor(INK_SOFT)
    c.drawString(104, 126, "Ten chapters, from the valley where they grew")
    c.drawString(104, 100, "to the window where they were handed away with a burger.")


def chapter_image_page(c, ch):
    full_bleed(c, os.path.join(HERE, ch["img"]))
    c.drawImage(scrim_png(W, 320, (11, 7, 16, 0), (11, 7, 16, 245)),
                0, 0, W, 320, mask="auto")

    png, w, h = display_png(ch["n"], 150, ch["accent"], glow=ch["accent"])
    place(c, png, 74, 92, w, h)

    png, w, h = display_png(ch["title"], 60, "#FFFFFF", max_px=880)
    place(c, png, 250, 100, w, h)

    if ch["cast"]:
        label(c, ch["cast"], 262, 82, size=10, color="#C9BBD6")


def chapter_text_page(c, ch):
    fill_page(c)

    # Oversized ghost numeral fills the right third, which the reading
    # column deliberately leaves empty.
    png, w, h = display_png(ch["n"], 300, ch["accent"])
    ghost = Image.open(png)
    ghost.putalpha(ghost.getchannel("A").point(lambda a: int(a * 0.09)))
    faded = _tmp("ghost")
    ghost.save(faded)
    place(c, faded, W - w + 40, H / 2.0 - h / 2.0, w, h)

    c.setFillColor(ch["accent"])
    c.rect(90, H - 92, 120, 4, stroke=0, fill=1)

    label(c, "Chapter " + ch["n"], 90, H - 132, size=11, color=INK_FAINT)

    png, w, h = display_png(ch["title"], 46, "#FFFFFF", max_px=780)
    place(c, png, 82, H - 216, w, h)

    y = body_block(c, ch["paras"], 92, H - 272, 800, size=19, leading=32)

    png, w, h = display_png(ch["beat"], 29, ch["accent"], glow=ch["accent"], max_px=820)
    place(c, png, 82, max(56, y - h + 34), w, h)


def boxes_pages(c):
    # Six per page rather than nine: three rows do not clear the bottom
    # margin once each cell carries a caption, and the boxes need the size
    # to stay readable.
    per_page = 6
    cols = 3
    cw, chh = 340.0, 180.0
    x0, y0 = 110.0, H - 250.0
    gx, gy = 30.0, 35.0

    for start in range(0, len(BOXES), per_page):
        fill_page(c)
        c.setFillColor("#F8EE07")
        c.rect(90, H - 92, 120, 4, stroke=0, fill=1)
        label(c, "Appendix", 90, H - 132, size=11, color=INK_FAINT)
        png, w, h = display_png("The Whole Family, Boxed", 40, "#FFFFFF", max_px=900)
        place(c, png, 82, H - 196, w, h)

        for i, (num, name) in enumerate(BOXES[start:start + per_page]):
            col, row = i % cols, i // cols
            x = x0 + col * (cw + gx)
            y = y0 - row * (chh + gy)
            src = os.path.join(HERE, "boxes", "%d.webp" % num)
            im = Image.open(src)
            ar = im.size[0] / float(im.size[1])
            dh = chh
            dw = dh * ar
            if dw > cw:
                dw = cw
                dh = dw / ar
            c.drawImage(photo(src, max_w=700), x + (cw - dw) / 2.0, y - dh, dw, dh, mask=None)
            c.setFont("Georgia-Bold", 12)
            c.setFillColor("#F8EE07")
            c.drawCentredString(x + cw / 2.0, y - dh - 22, name)

        # One grid per page: without this both halves land on top of each other.
        c.showPage()


def closing(c):
    fill_page(c, (0, 0, 0))
    png, w, h = display_png("ill find you and i ll gorb you", 74, "#FF1F1F",
                            glow="#FF1F1F", max_px=1000)
    place(c, png, W / 2.0, H / 2.0 - h / 2.0 + 30, w, h, anchor="bc")

    c.setFont("Georgia-Italic", 17)
    c.setFillColor("#8A7A96")
    c.drawCentredString(W / 2.0, 150,
                        "Every Gorb someone buys is a family member still on a shelf.")
    c.drawCentredString(W / 2.0, 122, "The one with the cap is still counting.")


def main():
    c = canvas.Canvas(OUT, pagesize=(W, H))
    c.setTitle("The Grove to the Drive-Thru")
    c.setAuthor("Gorb Family Rescue")
    c.setSubject("The Gorb family origin story")

    cover(c)
    c.showPage()

    for ch in CH:
        if ch["img"]:
            chapter_image_page(c, ch)
            c.showPage()
        chapter_text_page(c, ch)
        c.showPage()

    boxes_pages(c)  # ends each of its own pages

    closing(c)
    c.showPage()

    c.save()
    print("WROTE", OUT, os.path.getsize(OUT), "bytes")


if __name__ == "__main__":
    main()

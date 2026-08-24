#!/usr/bin/env python3
"""Generate deterministic MaglaSync launch and Chrome Web Store artwork."""

from pathlib import Path
from shutil import copyfile
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
STORE = ASSETS / "store"
SITE = ROOT / "site"
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

INK = "#111827"
MUTED = "#64748b"
PURPLE = "#6d28d9"
PURPLE_2 = "#8b5cf6"
PURPLE_SOFT = "#f1eafe"
GREEN = "#10b981"
LINE = "#e2e8f0"
PAPER = "#f8fafc"
WHITE = "#ffffff"


def font(size, bold=False):
    return ImageFont.truetype(FONT_BOLD if bold else FONT, size)


def save_png(image, path):
    path = Path(path)
    temporary = path.with_name(f".{path.name}.tmp")
    image.save(temporary, format="PNG", optimize=True)
    if temporary.stat().st_size < 100:
        raise RuntimeError(f"Generated PNG is empty: {path}")
    temporary.replace(path)


def gradient(size, start=(17, 24, 39), end=(46, 16, 101)):
    width, height = size
    image = Image.new("RGB", size)
    pixels = image.load()
    for y in range(height):
        for x in range(width):
            t = (x / max(width - 1, 1) + y / max(height - 1, 1)) / 2
            pixels[x, y] = tuple(round(a + (b - a) * t) for a, b in zip(start, end))
    return image


def rr(draw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def label(draw, xy, value, size, fill, bold=False, anchor=None):
    draw.text(xy, value, font=font(size, bold), fill=fill, anchor=anchor)


def pill(draw, x, y, value, fill=PURPLE_SOFT, color="#4c1d95", dot=None, pad=16, height=40):
    f = font(16, True)
    text_width = draw.textlength(value, font=f)
    dot_space = 20 if dot else 0
    width = int(text_width + pad * 2 + dot_space)
    rr(draw, (x, y, x + width, y + height), height // 2, fill)
    if dot:
        draw.ellipse((x + pad, y + 16, x + pad + 8, y + 24), fill=dot)
    label(draw, (x + pad + dot_space, y + height // 2), value, 16, color, True, "lm")
    return width


def logo(draw, x, y, size=64, dark=False):
    rr(draw, (x, y, x + size, y + size), int(size * .28), INK if dark else PURPLE)
    label(draw, (x + size / 2, y + size / 2 + 1), "M", int(size * .52), WHITE, True, "mm")


def browser_chrome(draw, box, title, accent=PURPLE):
    x1, y1, x2, y2 = box
    rr(draw, box, 22, WHITE)
    draw.rounded_rectangle((x1, y1, x2, y1 + 58), radius=22, fill=INK)
    draw.rectangle((x1, y1 + 36, x2, y1 + 58), fill=INK)
    for i, color in enumerate(("#fb7185", "#fbbf24", "#34d399")):
        draw.ellipse((x1 + 20 + i * 20, y1 + 22, x1 + 30 + i * 20, y1 + 32), fill=color)
    rr(draw, (x1 + 92, y1 + 15, x2 - 24, y1 + 43), 12, "#273449")
    label(draw, (x1 + 110, y1 + 29), title, 12, "#cbd5e1", False, "lm")
    draw.rectangle((x1, y1 + 58, x1 + 6, y2), fill=accent)


def social_preview():
    image = gradient((1280, 640))
    draw = ImageDraw.Draw(image)
    draw.ellipse((1020, -180, 1480, 280), fill="#48217e")
    draw.ellipse((930, 430, 1360, 860), fill="#35165d")
    logo(draw, 74, 72, 72)
    label(draw, (170, 108), "MAGLASYNC", 26, WHITE, True, "lm")
    label(draw, (74, 190), "One project.", 52, WHITE, True)
    label(draw, (74, 252), "Every AI chat", 52, WHITE, True)
    label(draw, (74, 314), "remembers.", 52, WHITE, True)
    label(draw, (76, 390), "Automatic continuity between ChatGPT, Claude, and Gemini.", 20, "#ddd6fe")
    x = 76
    for value in ("FREE", "LOCAL", "NO API KEY"):
        width = pill(draw, x, 438, value, "#35245a", WHITE, GREEN, 15, 38)
        x += width + 10
    label(draw, (76, 548), "340867-ux.github.io/MaglaSync", 17, "#a7b2c6")

    rr(draw, (830, 88, 1194, 548), 28, PAPER)
    rr(draw, (830, 88, 1194, 164), 28, INK)
    draw.rectangle((830, 138, 1194, 164), fill=INK)
    logo(draw, 852, 107, 38)
    label(draw, (902, 126), "MaglaSync", 17, WHITE, True, "lm")
    label(draw, (902, 147), "FREE · LOCAL CONTINUITY", 9, "#94a3b8", True, "lm")
    draw.ellipse((1157, 121, 1171, 135), fill=GREEN)
    rows = [
        ("ChatGPT", "Project conversation", "CAPTURED"),
        ("Claude", "New chat context", "LOADED"),
        ("Gemini", "Next project step", "READY"),
    ]
    for index, (name, detail, status) in enumerate(rows):
        y = 188 + index * 94
        rr(draw, (852, y, 1172, y + 74), 15, WHITE, LINE)
        rr(draw, (870, y + 18, 906, y + 54), 10, PURPLE_SOFT)
        label(draw, (888, y + 36), name[0], 15, PURPLE, True, "mm")
        label(draw, (920, y + 25), name, 14, INK, True)
        label(draw, (920, y + 47), detail, 10, MUTED)
        label(draw, (1152, y + 37), status, 9, "#047857", True, "rm")
    rr(draw, (852, 486, 1172, 522), 18, PURPLE)
    label(draw, (1012, 504), "Context stays in your browser", 12, WHITE, True, "mm")
    save_png(image, ASSETS / "social-preview.png")
    save_png(image, SITE / "social-preview.png")


def promo(size, compact=False):
    image = gradient(size)
    draw = ImageDraw.Draw(image)
    width, height = size
    draw.ellipse((width * .72, -height * .45, width * 1.17, height * .7), fill="#48217e")
    logo_size = 50 if compact else 72
    logo(draw, int(width * .08), int(height * .18), logo_size)
    title_size = 38 if compact else 58
    sub_size = 15 if compact else 21
    label(draw, (int(width * .08), int(height * .50)), "MaglaSync", title_size, WHITE, True)
    label(draw, (int(width * .08), int(height * .70)), "Every AI chat remembers.", sub_size, "#ddd6fe", True)
    if not compact:
        x = int(width * .62)
        for i, name in enumerate(("ChatGPT", "Claude", "Gemini")):
            y = int(height * .19) + i * 108
            rr(draw, (x, y, width - 80, y + 76), 18, "#ffffff")
            draw.ellipse((x + 22, y + 28, x + 34, y + 40), fill=GREEN)
            label(draw, (x + 50, y + 35), name, 16, INK, True, "lm")
            label(draw, (width - 104, y + 35), ("CAPTURED", "LOADED", "READY")[i], 10, "#047857", True, "rm")
    return image


def screenshot_dashboard():
    image = Image.new("RGB", (1280, 800), "#f5f7fb")
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 0, 1280, 70), fill=WHITE)
    logo(draw, 42, 16, 38, True)
    label(draw, (94, 35), "MaglaSync", 18, INK, True, "lm")
    pill(draw, 208, 20, "FREE", PURPLE_SOFT, PURPLE, None, 12, 30)
    draw.ellipse((1030, 30, 1042, 42), fill=GREEN)
    label(draw, (1052, 36), "Stored only in this browser", 12, MUTED, False, "lm")

    label(draw, (58, 115), "AUTOMATIC CONTINUITY FOR AI CHATS", 12, PURPLE, True)
    label(draw, (58, 150), "One project. Every supported chat.", 38, INK, True)
    label(draw, (58, 204), "Your current project state, ready for the next ChatGPT, Claude, or Gemini conversation.", 16, MUTED)

    rr(draw, (58, 258, 602, 706), 18, WHITE, LINE)
    label(draw, (86, 290), "FREE PROJECT", 11, PURPLE, True)
    label(draw, (86, 320), "Project passport", 23, INK, True)
    pill(draw, 470, 286, "VERIFIED", "#ecfdf5", "#047857", GREEN, 12, 30)
    label(draw, (86, 372), "PROJECT NAME", 10, MUTED, True)
    rr(draw, (86, 390, 574, 436), 9, PAPER, LINE)
    label(draw, (102, 413), "Launch MaglaSync Free", 14, INK, False, "lm")
    label(draw, (86, 464), "EXACT RESULT", 10, MUTED, True)
    rr(draw, (86, 482, 574, 550), 9, PAPER, LINE)
    label(draw, (102, 505), "Every new AI chat continues the same project", 13, INK)
    label(draw, (102, 528), "without manual handoff documents.", 13, INK)
    rr(draw, (86, 582, 574, 630), 10, PURPLE)
    label(draw, (330, 606), "SAVE PROJECT", 13, WHITE, True, "mm")

    rr(draw, (624, 258, 1222, 706), 18, WHITE, LINE)
    label(draw, (652, 290), "SYNC STATUS", 11, PURPLE, True)
    label(draw, (652, 320), "Automatic flow", 23, INK, True)
    pill(draw, 1095, 286, "LOCAL", "#ecfdf5", "#047857", GREEN, 12, 30)
    steps = [
        ("1", "Open an AI chat", "ChatGPT, Claude, or Gemini is recognised."),
        ("2", "Context is loaded", "The empty composer is filled for your review."),
        ("3", "New facts are saved", "Messages and structured updates return locally."),
    ]
    for i, (num, heading, detail) in enumerate(steps):
        y = 372 + i * 76
        rr(draw, (652, y, 688, y + 36), 10, PURPLE_SOFT)
        label(draw, (670, y + 18), num, 13, PURPLE, True, "mm")
        label(draw, (708, y + 5), heading, 14, INK, True)
        label(draw, (708, y + 28), detail, 11, MUTED)
        if i < 2:
            draw.line((670, y + 39, 670, y + 70), fill="#ddd6fe", width=2)
    for i, (count, name) in enumerate((("84", "MESSAGES"), ("11", "UPDATES"), ("5", "CHATS"))):
        x = 652 + i * 180
        rr(draw, (x, 610, x + 166, 672), 11, PAPER, LINE)
        label(draw, (x + 83, 634), count, 22, INK, True, "mm")
        label(draw, (x + 83, 656), name, 9, MUTED, True, "mm")
    save_png(image, STORE / "screenshot-dashboard.png")


def screenshot_sync():
    image = gradient((1280, 800), (15, 23, 42), (49, 19, 95))
    draw = ImageDraw.Draw(image)
    label(draw, (640, 68), "Continue in another AI chat without starting over", 34, WHITE, True, "mm")
    label(draw, (640, 112), "MaglaSync captures the state locally and prepares the next conversation.", 15, "#ddd6fe", False, "mm")

    browser_chrome(draw, (48, 166, 550, 690), "chatgpt.com · project conversation", "#10a37f")
    label(draw, (82, 250), "YOU", 10, PURPLE, True)
    rr(draw, (82, 270, 512, 338), 14, "#eef2ff")
    label(draw, (102, 293), "We approved the local-first release.", 14, INK)
    label(draw, (102, 318), "Next: publish and collect real feedback.", 14, INK)
    label(draw, (82, 382), "AI", 10, "#047857", True)
    rr(draw, (82, 402, 512, 506), 14, PAPER, LINE)
    label(draw, (102, 425), "Decision recorded. v1.0.0 is ready.", 14, INK)
    label(draw, (102, 454), "Verified: tests, release, and privacy boundary.", 12, MUTED)
    label(draw, (102, 482), "Next step: first public users.", 12, MUTED)
    rr(draw, (82, 560, 512, 626), 14, "#ecfdf5", "#a7f3d0")
    draw.ellipse((104, 584, 118, 598), fill=GREEN)
    label(draw, (132, 592), "Captured locally by MaglaSync", 13, "#047857", True, "lm")

    rr(draw, (570, 344, 710, 476), 30, PURPLE)
    logo(draw, 604, 366, 72)
    label(draw, (640, 456), "SYNC", 11, WHITE, True, "mm")
    draw.line((536, 410, 568, 410), fill="#c4b5fd", width=5)
    draw.polygon(((562, 400), (580, 410), (562, 420)), fill="#c4b5fd")
    draw.line((710, 410, 742, 410), fill="#c4b5fd", width=5)
    draw.polygon(((736, 400), (754, 410), (736, 420)), fill="#c4b5fd")

    browser_chrome(draw, (730, 166, 1232, 690), "claude.ai · new chat", "#d97757")
    label(draw, (764, 250), "NEW EMPTY CHAT", 10, PURPLE, True)
    rr(draw, (764, 274, 1194, 532), 14, PAPER, LINE)
    label(draw, (786, 304), "[MAGLASYNC CONTEXT]", 12, PURPLE, True)
    label(draw, (786, 340), "Goal", 11, MUTED, True)
    label(draw, (786, 363), "Ship a useful local continuity extension.", 13, INK)
    label(draw, (786, 404), "Latest decision", 11, MUTED, True)
    label(draw, (786, 427), "Release v1.0.0 and collect real feedback.", 13, INK)
    label(draw, (786, 468), "Verified", 11, MUTED, True)
    label(draw, (786, 491), "Tests, release, and privacy boundary passed.", 13, INK)
    rr(draw, (764, 560, 1194, 626), 14, "#eef2ff", "#c4b5fd")
    draw.ellipse((786, 584, 800, 598), fill=PURPLE_2)
    label(draw, (814, 592), "Context loaded — review, then press Send", 13, PURPLE, True, "lm")
    save_png(image, STORE / "screenshot-chat-sync.png")


def demo_frame(step):
    image = gradient((1000, 560), (15, 23, 42), (46, 16, 101))
    draw = ImageDraw.Draw(image)
    titles = (
        ("1 · CAPTURE", "Finish a project step in ChatGPT"),
        ("2 · JOURNAL", "MaglaSync saves the factual state locally"),
        ("3 · CONTINUE", "Open Claude or Gemini with context ready"),
    )
    label(draw, (64, 50), titles[step][0], 13, "#c4b5fd", True)
    label(draw, (64, 80), titles[step][1], 30, WHITE, True)
    rr(draw, (64, 138, 936, 474), 24, PAPER)

    if step == 0:
        label(draw, (96, 178), "ChatGPT · project conversation", 14, MUTED, True)
        rr(draw, (96, 214, 904, 276), 14, "#eef2ff")
        label(draw, (118, 245), "We approved the local-first release. Publish v1.0.0 next.", 16, INK, False, "lm")
        rr(draw, (96, 296, 904, 376), 14, WHITE, LINE)
        label(draw, (118, 326), "Decision recorded. Tests and privacy boundary passed.", 15, INK)
        label(draw, (118, 354), "Next step: publish and collect real user feedback.", 13, MUTED)
        rr(draw, (634, 398, 904, 446), 15, "#ecfdf5", "#a7f3d0")
        draw.ellipse((655, 417, 667, 429), fill=GREEN)
        label(draw, (681, 423), "Captured locally", 13, "#047857", True, "lm")
    elif step == 1:
        logo(draw, 96, 174, 58)
        label(draw, (170, 197), "MaglaSync local journal", 20, INK, True, "lm")
        cards = [
            ("DECISION", "Release the local-first Free edition."),
            ("VERIFIED", "Tests, packaging, and privacy checks passed."),
            ("NEXT STEP", "Publish and collect feedback from real users."),
        ]
        for i, (heading, value) in enumerate(cards):
            y = 254 + i * 64
            rr(draw, (96, y, 904, y + 49), 12, WHITE, LINE)
            label(draw, (116, y + 25), heading, 10, PURPLE, True, "lm")
            label(draw, (276, y + 25), value, 14, INK, False, "lm")
        draw.ellipse((805, 185, 817, 197), fill=GREEN)
        label(draw, (830, 191), "LOCAL ONLY", 10, "#047857", True, "lm")
    else:
        label(draw, (96, 178), "Claude · new empty chat", 14, MUTED, True)
        rr(draw, (96, 214, 904, 392), 14, WHITE, LINE)
        label(draw, (118, 241), "[MAGLASYNC CONTEXT]", 11, PURPLE, True)
        label(draw, (118, 276), "Goal: Ship a useful local continuity extension.", 14, INK)
        label(draw, (118, 308), "Latest: v1.0.0 published; tests and privacy passed.", 14, INK)
        label(draw, (118, 340), "Next: collect feedback from real users.", 14, INK)
        label(draw, (118, 372), "[END MAGLASYNC CONTEXT]", 11, MUTED, True)
        rr(draw, (592, 412, 904, 450), 13, PURPLE_SOFT)
        label(draw, (748, 431), "Review, then press Send", 12, PURPLE, True, "mm")
    label(draw, (64, 520), "Free · local · no account · no API key", 13, "#cbd5e1")
    return image


def demo_gif():
    frames = [demo_frame(index) for index in range(3)]
    output = ASSETS / "demo.gif"
    temporary = ASSETS / ".demo.gif.tmp"
    frames[0].save(
        temporary,
        format="GIF",
        save_all=True,
        append_images=frames[1:],
        duration=[1500, 1600, 2200],
        loop=0,
        disposal=2,
        optimize=True,
    )
    if temporary.stat().st_size < 100:
        raise RuntimeError("Generated demo GIF is empty.")
    temporary.replace(output)


def main():
    ASSETS.mkdir(exist_ok=True)
    STORE.mkdir(exist_ok=True)
    SITE.mkdir(exist_ok=True)
    copyfile(ROOT / "icons" / "icon128.png", SITE / "icon128.png")
    social_preview()
    save_png(promo((440, 280), compact=True), STORE / "promo-small.png")
    save_png(promo((1400, 560), compact=False), STORE / "promo-marquee.png")
    screenshot_dashboard()
    screenshot_sync()
    demo_gif()
    print("PASS launch assets: social preview, demo GIF, and Chrome Web Store artwork")


if __name__ == "__main__":
    main()

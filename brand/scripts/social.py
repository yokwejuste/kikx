import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

CARDS = [
    ("kikx-social.png", 1280, 640, "kikx", "Vendor real, editable infrastructure files into your project"),
    ("kikx-og-web.png", 1200, 630, "kikx", "Build real infrastructure files in your browser"),
    ("kikx-og-docs.png", 1200, 630, "kikx docs", "Tutorials, how-to guides, reference and explanation"),
]


def render(mark_path, bold_font, regular_font, width, height, title, tagline, out):
    image = Image.new("RGB", (width, height), "#0a0a0a")
    draw = ImageDraw.Draw(image)
    size = int(height * 0.36)
    mark = Image.open(mark_path).convert("RGBA").resize((size, size), Image.LANCZOS)
    title_font = ImageFont.truetype(bold_font, int(height * 0.25))
    tagline_font = ImageFont.truetype(regular_font, int(height * 0.052))
    gap = int(height * 0.05)
    box = draw.textbbox((0, 0), title, font=title_font)
    x = (width - (size + gap + box[2] - box[0])) // 2
    y = int(height * 0.40) - size // 2
    image.paste(mark, (x, y), mark)
    draw.text((x + size + gap - box[0], y + size // 2 - (box[1] + box[3]) // 2), title, font=title_font, fill="#fafafa")
    line = draw.textbbox((0, 0), tagline, font=tagline_font)
    draw.text(((width - (line[2] - line[0])) // 2 - line[0], int(height * 0.72)), tagline, font=tagline_font, fill="#a1a1a1")
    image.save(out, optimize=True)


mark_path, bold_font, regular_font, out_dir = sys.argv[1:5]
for name, width, height, title, tagline in CARDS:
    render(mark_path, bold_font, regular_font, width, height, title, tagline, Path(out_dir) / name)

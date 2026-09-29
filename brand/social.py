import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

TAGLINE = "Vendor real, editable infrastructure files into your project"


def render(mark_path, bold_font, regular_font, width, height, out):
    image = Image.new("RGB", (width, height), "#0a0a0a")
    draw = ImageDraw.Draw(image)
    size = int(height * 0.36)
    mark = Image.open(mark_path).convert("RGBA").resize((size, size), Image.LANCZOS)
    title = ImageFont.truetype(bold_font, int(height * 0.25))
    tagline = ImageFont.truetype(regular_font, int(height * 0.052))
    gap = int(height * 0.05)
    box = draw.textbbox((0, 0), "kikx", font=title)
    x = (width - (size + gap + box[2] - box[0])) // 2
    y = int(height * 0.40) - size // 2
    image.paste(mark, (x, y), mark)
    draw.text((x + size + gap - box[0], y + size // 2 - (box[1] + box[3]) // 2), "kikx", font=title, fill="#fafafa")
    line = draw.textbbox((0, 0), TAGLINE, font=tagline)
    draw.text(((width - (line[2] - line[0])) // 2 - line[0], int(height * 0.72)), TAGLINE, font=tagline, fill="#a1a1a1")
    image.save(out, optimize=True)


mark_path, bold_font, regular_font = sys.argv[1:4]
render(mark_path, bold_font, regular_font, 1280, 640, Path("kikx-social.png"))

RSVG      ?= rsvg-convert
PYTHON    ?= python3
CHROME    ?= /Applications/Google Chrome.app/Contents/MacOS/Google Chrome
FONT_DIR  ?=
SVG        = images/svg
PNG        = images/png
SOCIAL     = images/social
ICO        = images/ico/kikx.ico
ICON_SIZES = 16 32 48 64 128 180 192 256 512
MARK_SIZES = 64 128 256 512
ICO_SIZES  = 16 32 48 64 128 256

all: png ico install

png:
	mkdir -p $(PNG)
	for size in $(ICON_SIZES); do $(RSVG) -w $$size $(SVG)/kikx-app-icon.svg -o $(PNG)/kikx-app-icon-$$size.png; done
	for size in $(MARK_SIZES); do \
		$(RSVG) -w $$size $(SVG)/kikx-mark.svg -o $(PNG)/kikx-mark-$$size.png; \
		$(RSVG) -w $$size $(SVG)/kikx-mark-white.svg -o $(PNG)/kikx-mark-white-$$size.png; \
	done

ico: png
	mkdir -p $(dir $(ICO))
	$(PYTHON) -c "from PIL import Image; sizes = '$(ICO_SIZES)'.split(); images = [Image.open(f'$(PNG)/kikx-app-icon-{s}.png') for s in sizes]; images[-1].save('$(ICO)', sizes=[(int(s), int(s)) for s in sizes], append_images=images[:-1])"

social:
	mkdir -p $(PNG) $(SOCIAL)
	$(RSVG) -w 512 $(SVG)/kikx-mark-white.svg -o $(PNG)/kikx-mark-white-512.png
	$(PYTHON) scripts/social.py $(PNG)/kikx-mark-white-512.png $(FONT_DIR)/Geist-Bold.ttf $(FONT_DIR)/Geist-Regular.ttf $(SOCIAL)

install:
	cp $(SVG)/kikx-favicon.svg ../web/app/icon.svg
	cp $(PNG)/kikx-app-icon-180.png ../web/app/apple-icon.png
	cp $(ICO) ../web/app/favicon.ico
	cp $(PNG)/kikx-app-icon-192.png ../web/public/kikx-icon-192.png
	cp $(PNG)/kikx-app-icon-512.png ../web/public/kikx-icon-512.png
	cp $(SOCIAL)/kikx-og-web.png ../web/app/opengraph-image.png
	cp $(SOCIAL)/kikx-og-web.png ../web/app/twitter-image.png
	cp $(SVG)/kikx-favicon.svg ../docs/_static/kikx-favicon.svg
	cp $(SOCIAL)/kikx-og-docs.png ../docs/_static/kikx-og.png
	cp $(PNG)/kikx-app-icon-180.png ../docs/_static/kikx-apple-icon.png
	mkdir -p ../cli/assets
	cp $(ICO) ../cli/assets/kikx.ico

guide:
	"$(CHROME)" --headless=new --disable-gpu --no-pdf-header-footer --virtual-time-budget=15000 --print-to-pdf=kikx-brand-guide.pdf "file://$(CURDIR)/guide/brand-guide.html"

.PHONY: all png ico social install guide

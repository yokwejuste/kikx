RSVG      ?= rsvg-convert
PYTHON    ?= python3
FONT_DIR  ?=
ICON_SIZES = 16 32 48 64 128 180 192 256 512
MARK_SIZES = 64 128 256 512
ICO_SIZES  = 16 32 48 64 128 256

all: png ico install

png:
	mkdir -p png
	for size in $(ICON_SIZES); do $(RSVG) -w $$size kikx-app-icon.svg -o png/kikx-app-icon-$$size.png; done
	for size in $(MARK_SIZES); do \
		$(RSVG) -w $$size kikx-mark.svg -o png/kikx-mark-$$size.png; \
		$(RSVG) -w $$size kikx-mark-white.svg -o png/kikx-mark-white-$$size.png; \
	done

ico: png
	$(PYTHON) -c "from PIL import Image; sizes = '$(ICO_SIZES)'.split(); images = [Image.open(f'png/kikx-app-icon-{s}.png') for s in sizes]; images[-1].save('kikx.ico', sizes=[(int(s), int(s)) for s in sizes], append_images=images[:-1])"

social:
	$(RSVG) -w 512 kikx-mark-white.svg -o png/kikx-mark-white-512.png
	$(PYTHON) social.py png/kikx-mark-white-512.png $(FONT_DIR)/Geist-Bold.ttf $(FONT_DIR)/Geist-Regular.ttf

install:
	cp kikx-favicon.svg ../web/app/icon.svg
	cp png/kikx-app-icon-180.png ../web/app/apple-icon.png
	cp kikx.ico ../web/app/favicon.ico
	cp png/kikx-app-icon-192.png ../web/public/kikx-icon-192.png
	cp png/kikx-app-icon-512.png ../web/public/kikx-icon-512.png
	cp kikx-og-web.png ../web/app/opengraph-image.png
	cp kikx-og-web.png ../web/app/twitter-image.png
	cp kikx-favicon.svg ../docs/_static/kikx-favicon.svg
	cp kikx-og-docs.png ../docs/_static/kikx-og.png
	cp png/kikx-app-icon-180.png ../docs/_static/kikx-apple-icon.png
	mkdir -p ../cli/assets
	cp kikx.ico ../cli/assets/kikx.ico

.PHONY: all png ico social install

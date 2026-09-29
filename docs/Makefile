SPHINXOPTS    = -W --keep-going
SPHINXBUILD   = sphinx-build
SOURCEDIR     = source
BUILDDIR      = build
HTMLDIR       = $(BUILDDIR)/html
GETTEXTDIR    = $(BUILDDIR)/gettext
LOCALEDIR     = locales
LANGUAGES     = fr
PORT          = 8090

html:
	$(SPHINXBUILD) $(SPHINXOPTS) -b html -D language=en $(SOURCEDIR) $(HTMLDIR)

html-fr:
	$(SPHINXBUILD) $(SPHINXOPTS) -b html -D language=fr $(SOURCEDIR) $(HTMLDIR)/fr

html-all: html html-fr

gettext:
	$(SPHINXBUILD) $(SPHINXOPTS) -b gettext $(SOURCEDIR) $(GETTEXTDIR)

update-po: gettext
	sphinx-intl update -p $(GETTEXTDIR) -d $(LOCALEDIR) $(foreach lang,$(LANGUAGES),-l $(lang))

serve:
	sphinx-autobuild --host 127.0.0.1 --port $(PORT) $(SOURCEDIR) $(HTMLDIR)

clean:
	rm -rf $(BUILDDIR)
	find $(LOCALEDIR) -name "*.mo" -delete

.PHONY: html html-fr html-all gettext update-po serve clean

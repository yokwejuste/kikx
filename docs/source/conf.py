from pygments.lexers.shell import BashLexer

project = "kikx"
html_title = "kikx"
author = "kikx contributors"
copyright = "kikx contributors"

extensions = ["myst_parser", "sphinx_design"]

source_suffix = {".md": "markdown"}
master_doc = "index"
exclude_patterns = ["_build", "Thumbs.db", ".DS_Store"]

myst_enable_extensions = ["colon_fence"]
myst_heading_anchors = 4

html_theme = "furo"
html_theme_options = {
    "source_repository": "https://github.com/yokwejuste/kikx/",
    "source_branch": "main",
    "source_directory": "docs/source/",
}
html_show_sphinx = False
html_permalinks_icon = "¶"

language = "en"
locale_dirs = ["../locales"]
gettext_compact = False
gettext_uuid = False
gettext_location = False


def setup(app):
    app.add_lexer("dotenv", BashLexer)

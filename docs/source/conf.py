import os
import sys
from pathlib import Path

from pygments.lexers.shell import BashLexer

sys.path.insert(0, str(Path(__file__).parent / "_pygments"))

project = "kikx"
html_title = "kikx"
author = "Steve Yonkeu"
copyright = "2026 Steve Yonkeu"

extensions = ["myst_parser", "sphinx_design", "sphinx_copybutton", "sphinxext.opengraph"]

ogp_site_url = os.environ.get("KIKX_DOCS_URL") or os.environ.get("READTHEDOCS_CANONICAL_URL", "")
ogp_site_name = "kikx"
ogp_image = "_static/kikx-og.png"
ogp_image_alt = "kikx docs"
ogp_social_cards = {"enable": False}
ogp_custom_meta_tags = ['<meta name="twitter:card" content="summary_large_image">']

copybutton_prompt_text = r"\$ |>>> "
copybutton_prompt_is_regexp = True
copybutton_remove_prompts = True

source_suffix = {".md": "markdown"}
master_doc = "index"
exclude_patterns = ["_build", "_pygments", "Thumbs.db", ".DS_Store"]

myst_enable_extensions = ["colon_fence", "attrs_block"]
myst_heading_anchors = 4

API_CHANGES = ["added", "changed", "deprecated", "removed"]


def monochrome(background, foreground, muted, surface, border, accent):
    colors = {
        "color-background-primary": background,
        "color-background-secondary": background,
        "color-background-hover": surface,
        "color-background-border": border,
        "color-sidebar-background": background,
        "color-sidebar-background-border": "none",
        "color-foreground-primary": foreground,
        "color-foreground-secondary": muted,
        "color-foreground-muted": muted,
        "color-foreground-border": border,
        "color-brand-primary": accent,
        "color-brand-content": accent,
        "color-brand-visited": accent,
        "color-link-underline": accent,
        "color-link-underline--visited": accent,
        "color-code-background": surface,
        "color-code-foreground": foreground,
        "color-inline-code-background": surface,
        "color-highlight-on-target": surface,
        "color-highlighted-background": surface,
        "color-problematic": foreground,
        "color-topic-title": foreground,
        "color-topic-title-background": surface,
        "color-guilabel-background": surface,
        "color-guilabel-border": border,
        "color-admonition-title": foreground,
        "color-admonition-title-background": surface,
        "color-admonition-background": background,
    }
    for change in API_CHANGES:
        colors[f"color-api-{change}"] = foreground
        colors[f"color-api-{change}-border"] = border
    return colors


html_theme = "furo"
html_theme_options = {
    "sidebar_hide_name": True,
    "top_of_page_buttons": [],
    "source_repository": "https://github.com/yokwejuste/kikx/",
    "source_branch": "main",
    "source_directory": "docs/source/",
    "light_css_variables": monochrome("#ffffff", "#0a0a0a", "#737373", "#f5f5f5", "#e5e5e5", "#4d6b00"),
    "dark_css_variables": monochrome("#0a0a0a", "#fafafa", "#a1a1a1", "#262626", "#2e2e2e", "#c8f031"),
}
pygments_style = "kikx_style.KikxLightStyle"
pygments_dark_style = "kikx_style.KikxDarkStyle"
templates_path = ["../_templates"]
html_static_path = ["../_static"]
html_favicon = "../_static/kikx-favicon.svg"
html_css_files = ["kikx.css"]
html_js_files = ["pronounce.js"]
html_context = {
    "language_switcher": [
        ["en", "English"],
        ["fr", "Français"],
    ],
    "default_language": "en",
    "app_url": os.environ.get("KIKX_APP_URL", "/"),
}
html_sidebars = {
    "**": [
        "sidebar/scroll-start.html",
        "sidebar/brand.html",
        "sidebar/navigation.html",
        "sidebar/search.html",
        "sidebar/scroll-end.html",
    ]
}
html_show_sphinx = False
html_permalinks_icon = "¶"

language = "en"
locale_dirs = ["../locales"]
gettext_compact = False
gettext_uuid = False
gettext_location = False


def localize_site_url(app, config):
    if config.ogp_site_url and config.language != "en":
        config.ogp_site_url = f"{config.ogp_site_url.rstrip('/')}/{config.language}/"


def setup(app):
    app.add_lexer("dotenv", BashLexer)
    app.connect("config-inited", localize_site_url)

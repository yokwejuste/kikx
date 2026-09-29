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

ADMONITION_KINDS = [
    "attention",
    "caution",
    "danger",
    "error",
    "hint",
    "important",
    "note",
    "seealso",
    "tip",
    "warning",
    "admonition-todo",
]
API_CHANGES = ["added", "changed", "deprecated", "removed"]


def monochrome(background, foreground, muted, surface, border):
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
        "color-brand-primary": foreground,
        "color-brand-content": foreground,
        "color-brand-visited": foreground,
        "color-link-underline": border,
        "color-link-underline--hover": foreground,
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
    for kind in ADMONITION_KINDS:
        colors[f"color-admonition-title--{kind}"] = foreground
        colors[f"color-admonition-title-background--{kind}"] = surface
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
    "light_css_variables": monochrome("#ffffff", "#0a0a0a", "#737373", "#f5f5f5", "#e5e5e5"),
    "dark_css_variables": monochrome("#0a0a0a", "#fafafa", "#a1a1a1", "#262626", "#2e2e2e"),
}
pygments_style = "bw"
pygments_dark_style = "bw"
templates_path = ["../_templates"]
html_static_path = ["../_static"]
html_css_files = ["kikx.css"]
html_context = {
    "language_switcher": [
        ["en", "English"],
        ["fr", "Français"],
    ],
    "default_language": "en",
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


def setup(app):
    app.add_lexer("dotenv", BashLexer)

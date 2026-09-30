from pygments.style import Style
from pygments.token import (
    Comment,
    Error,
    Generic,
    Keyword,
    Name,
    Number,
    Operator,
    Punctuation,
    String,
    Text,
    Token,
)


def palette(text, accent, constant, muted, output):
    return {
        Token: text,
        Text: text,
        Error: text,
        Keyword: f"bold {accent}",
        Keyword.Constant: f"nobold {constant}",
        Name.Tag: accent,
        Name.Attribute: accent,
        Name.Builtin: accent,
        Name.Function: accent,
        Name.Class: accent,
        Name.Namespace: accent,
        Name.Variable: constant,
        Name.Constant: constant,
        Name.Label: accent,
        String: text,
        String.Escape: constant,
        String.Interpol: constant,
        Number: constant,
        Comment: f"italic {muted}",
        Comment.Preproc: f"noitalic {accent}",
        Operator: muted,
        Operator.Word: f"bold {accent}",
        Punctuation: muted,
        Generic.Prompt: f"bold {accent}",
        Generic.Output: output,
        Generic.Heading: f"bold {accent}",
        Generic.Subheading: accent,
        Generic.Inserted: accent,
        Generic.Deleted: muted,
        Generic.Emph: "italic",
        Generic.Strong: "bold",
        Generic.Error: text,
        Generic.Traceback: muted,
    }


class KikxLightStyle(Style):
    name = "kikx-light"
    background_color = "#f5f5f5"
    highlight_color = "#e5e5e5"
    styles = palette("#0a0a0a", "#4d6b00", "#5f7a14", "#737373", "#525252")


class KikxDarkStyle(Style):
    name = "kikx-dark"
    background_color = "#262626"
    highlight_color = "#2e2e2e"
    styles = palette("#fafafa", "#c8f031", "#b5d94a", "#a1a1a1", "#d4d4d4")

use std::fmt::Display;

use anstyle::{Ansi256Color, AnsiColor, Color, RgbColor, Style};
use clap::builder::Styles;

const VOLT_RGB: RgbColor = RgbColor(200, 240, 49);
const VOLT_ANSI256: Ansi256Color = Ansi256Color(191);

fn supports_truecolor() -> bool {
    std::env::var("COLORTERM")
        .is_ok_and(|value| matches!(value.to_ascii_lowercase().as_str(), "truecolor" | "24bit"))
}

fn volt_color() -> Color {
    if supports_truecolor() {
        VOLT_RGB.into()
    } else {
        VOLT_ANSI256.into()
    }
}

pub fn volt() -> Style {
    Style::new().fg_color(Some(volt_color()))
}

pub fn success() -> Style {
    volt().bold()
}

pub fn heading() -> Style {
    Style::new().bold()
}

pub fn hint() -> Style {
    Style::new().dimmed()
}

pub fn paint(style: Style, text: impl Display) -> String {
    format!("{style}{text}{style:#}")
}

pub fn help_styles() -> Styles {
    Styles::styled()
        .header(success())
        .usage(success())
        .literal(volt())
        .placeholder(hint())
        .error(Style::new().bold().fg_color(Some(AnsiColor::Red.into())))
}

use anyhow::Result;
use kikx_core::presets;

use crate::style::{heading, hint, paint, volt};

pub fn run() -> Result<()> {
    anstream::println!("{}", paint(heading(), "Preset templates:"));
    for template in presets::templates() {
        anstream::println!();
        anstream::println!(
            "  {}: {} {}",
            paint(volt(), &template.name),
            template.title,
            paint(
                hint(),
                format!("({} components)", template.components.len())
            )
        );
        anstream::println!("      {}", paint(hint(), &template.description));
    }
    anstream::println!();
    anstream::println!(
        "{}",
        paint(
            hint(),
            "Start one with `kikx setup <name>`, or add it to a project with `kikx apply <name>`."
        )
    );
    Ok(())
}

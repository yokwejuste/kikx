use anyhow::Result;
use kikx_core::presets;

pub fn run() -> Result<()> {
    println!("Preset templates:");
    for template in presets::templates() {
        println!();
        println!(
            "  {}: {} ({} components)",
            template.name,
            template.title,
            template.components.len()
        );
        println!("      {}", template.description);
    }
    println!();
    println!(
        "Start one with `kikx setup <name>`, or add it to a project with `kikx apply <name>`."
    );
    Ok(())
}

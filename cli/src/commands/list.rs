use anyhow::Result;
use kikx_core::registry;

pub fn run() -> Result<()> {
    println!("Available components:");
    for item in registry::builtin::all() {
        println!("  {}", item.reference());
    }
    println!();
    println!("You can also `kikx add <url>` or `kikx add <path-to-registry-item.json>`.");
    Ok(())
}

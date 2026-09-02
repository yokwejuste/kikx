use anyhow::Result;
use kikx_core::templates::Component;

pub fn run() -> Result<()> {
    println!("Available components:");
    for component in Component::ALL {
        println!("  k8s/{}", component.name());
    }
    Ok(())
}

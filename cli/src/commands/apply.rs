use anyhow::{Context, Result};
use kikx_core::ops::{self, ApplyParams};

use crate::cli::ApplyArgs;

pub fn run(args: ApplyArgs) -> Result<()> {
    let cwd = std::env::current_dir().context("failed to read current directory")?;

    let outcome = ops::apply_bundle(
        &cwd,
        ApplyParams {
            reference: args.reference,
            into: args.into,
            force: args.force,
        },
    )?;

    println!("Vendored {} file(s):", outcome.files_written.len());
    for path in outcome.files_written {
        println!("  {}", path.display());
    }
    Ok(())
}

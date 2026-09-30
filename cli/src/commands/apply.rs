use anyhow::Result;
use kikx_core::ops::{self, ApplyParams};

use crate::cli::ApplyArgs;
use crate::style::{paint, success};

pub fn run(args: ApplyArgs) -> Result<()> {
    let cwd = super::current_dir()?;

    let outcome = ops::apply_bundle(
        &cwd,
        ApplyParams {
            reference: args.reference,
            into: args.into,
            force: args.force,
        },
    )?;

    anstream::println!(
        "{} {} file(s):",
        paint(success(), "Vendored"),
        outcome.files_written.len()
    );
    for path in outcome.files_written {
        anstream::println!("  {}", path.display());
    }
    Ok(())
}

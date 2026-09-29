use anyhow::Result;
use kikx_core::ops::{self, SetupParams};

use crate::cli::SetupArgs;

pub fn run(args: SetupArgs) -> Result<()> {
    let cwd = super::current_dir()?;

    let outcome = ops::setup_project(
        &cwd,
        SetupParams {
            reference: args.reference,
            force: args.force,
        },
    )?;

    println!(
        "Initialized kikx project `{}` — wrote {} file(s) to {}",
        outcome.project_name,
        outcome.files_written.len(),
        outcome.output_dir.display()
    );
    for path in outcome.files_written {
        println!("  {}", path.display());
    }
    Ok(())
}

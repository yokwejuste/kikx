use anyhow::Result;
use kikx_core::ops::{self, SetupParams};

use crate::cli::SetupArgs;
use crate::style::{paint, success};

pub fn run(args: SetupArgs) -> Result<()> {
    let cwd = super::current_dir()?;

    let outcome = ops::setup_project(
        &cwd,
        SetupParams {
            reference: args.reference,
            force: args.force,
        },
    )?;

    anstream::println!(
        "{} kikx project `{}`: wrote {} file(s) to {}",
        paint(success(), "Initialized"),
        outcome.project_name,
        outcome.files_written.len(),
        outcome.output_dir.display()
    );
    for path in outcome.files_written {
        anstream::println!("  {}", path.display());
    }
    Ok(())
}

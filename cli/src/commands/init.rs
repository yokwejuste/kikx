use anyhow::Result;
use kikx_core::ops::{self, InitParams};

use crate::cli::InitArgs;

pub fn run(args: InitArgs) -> Result<()> {
    let cwd = super::current_dir()?;
    let outcome = ops::init_project(
        &cwd,
        InitParams {
            name: args.name,
            dir: args.dir,
            namespace: args.namespace,
            force: args.force,
        },
    )?;

    println!(
        "Initialized kikx project `{}`. Vendor components with `kikx add <category>/<component>` (see `kikx list`)",
        outcome.project_name
    );
    Ok(())
}

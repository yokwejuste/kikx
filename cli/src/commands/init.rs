use anyhow::{Context, Result};
use kikx_core::ops::{self, InitParams};

use crate::cli::InitArgs;

pub fn run(args: InitArgs) -> Result<()> {
    let cwd = std::env::current_dir().context("failed to read current directory")?;
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
        "Initialized kikx project `{}` — vendor components with `kikx add k8s/<component>`",
        outcome.project_name
    );
    Ok(())
}

use anyhow::Result;
use kikx_core::ops::{self, InitParams};

use crate::cli::InitArgs;
use crate::style::{hint, paint, success};

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

    anstream::println!(
        "{} kikx project `{}`. {}",
        paint(success(), "Initialized"),
        outcome.project_name,
        paint(
            hint(),
            "Vendor components with `kikx add <category>/<component>` (see `kikx list`)"
        )
    );
    Ok(())
}

use anyhow::{Context, Result};
use kikx_core::ops::{self, AddParams};

use crate::cli::AddArgs;

pub fn run(args: AddArgs) -> Result<()> {
    let cwd = std::env::current_dir().context("failed to read current directory")?;
    let outcome = ops::add_component(
        &cwd,
        AddParams {
            component: args.component,
            name: args.name,
            image: args.image,
            replicas: args.replicas,
            port: args.port,
            target_port: args.target_port,
            namespace: args.namespace,
            host: args.host,
            path: args.path,
            service: args.service,
            labels: args.labels,
            force: args.force,
            dry_run: false,
        },
    )?;

    if let Some(output_path) = outcome.output_path {
        println!("Vendored {}", output_path.display());
    }
    Ok(())
}

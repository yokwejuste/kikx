use anyhow::Result;
use kikx_core::ops::{self, AddParams, CommonFields};

use crate::cli::AddArgs;

pub fn run(args: AddArgs) -> Result<()> {
    let cwd = super::current_dir()?;
    let common = CommonFields {
        image: args.image,
        replicas: args.replicas,
        port: args.port,
        target_port: args.target_port,
        namespace: args.namespace,
        host: args.host,
        path: args.path,
        service: args.service,
    };

    let outcome = ops::add_component(
        &cwd,
        AddParams {
            reference: args.reference,
            name: args.name,
            fields: common.into_fields(args.set),
            labels: args.labels,
            force: args.force,
            dry_run: false,
        },
    )?;

    for file in outcome.files {
        println!("Vendored {}", file.path.display());
    }
    Ok(())
}

use anyhow::{Context, Result};
use kikx_core::ops::{self, AddParams};

use crate::cli::AddArgs;

pub fn run(args: AddArgs) -> Result<()> {
    let cwd = std::env::current_dir().context("failed to read current directory")?;

    let mut fields: Vec<(String, String)> = Vec::new();
    if let Some(image) = args.image {
        fields.push(("image".to_string(), image));
    }
    fields.push(("replicas".to_string(), args.replicas.to_string()));
    fields.push(("port".to_string(), args.port.to_string()));
    if let Some(target_port) = args.target_port {
        fields.push(("target_port".to_string(), target_port.to_string()));
    }
    if let Some(namespace) = args.namespace {
        fields.push(("namespace".to_string(), namespace));
    }
    if let Some(host) = args.host {
        fields.push(("host".to_string(), host));
    }
    fields.push(("path".to_string(), args.path));
    if let Some(service) = args.service {
        fields.push(("service".to_string(), service));
    }
    fields.extend(args.set);

    let outcome = ops::add_component(
        &cwd,
        AddParams {
            reference: args.reference,
            name: args.name,
            fields,
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

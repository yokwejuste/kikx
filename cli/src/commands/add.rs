use anyhow::Result;
use kikx_core::ops::{self, AddParams};

use crate::cli::AddArgs;
use crate::style::{paint, success};

pub fn run(args: AddArgs) -> Result<()> {
    let cwd = super::current_dir()?;
    let (fields, labels) = args.fields.into_fields_and_labels();

    let outcome = ops::add_component(
        &cwd,
        AddParams {
            reference: args.reference,
            name: args.name,
            fields,
            labels,
            force: args.force,
            dry_run: false,
        },
    )?;

    for file in outcome.files {
        anstream::println!("{} {}", paint(success(), "Vendored"), file.path.display());
    }
    Ok(())
}

pub mod add;
pub mod apply;
pub mod diff;
pub mod init;
pub mod list;
pub mod presets;
pub mod setup;
pub mod upgrade;

use std::path::PathBuf;

use anyhow::{Context, Result};
use kikx_core::ops::CommonFields;

use crate::cli::FieldArgs;

type Pairs = Vec<(String, String)>;

impl FieldArgs {
    fn into_fields_and_labels(self) -> (Pairs, Pairs) {
        let common = CommonFields {
            image: self.image,
            replicas: self.replicas,
            port: self.port,
            target_port: self.target_port,
            namespace: self.namespace,
            host: self.host,
            path: self.path,
            service: self.service,
        };
        (common.into_fields(self.set), self.labels)
    }
}

fn current_dir() -> Result<PathBuf> {
    std::env::current_dir().context("failed to read current directory")
}

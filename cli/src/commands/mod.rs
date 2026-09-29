pub mod add;
pub mod apply;
pub mod init;
pub mod list;
pub mod presets;
pub mod setup;
pub mod upgrade;

use std::path::PathBuf;

use anyhow::{Context, Result};

fn current_dir() -> Result<PathBuf> {
    std::env::current_dir().context("failed to read current directory")
}

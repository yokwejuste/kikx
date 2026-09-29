use std::path::{Path, PathBuf};

use anyhow::Context;

use super::error::{OpsError, OpsErrorKind, OrKind};
use super::project::{dir_project_name, ensure_no_config, save_config};
use crate::config::{KikxConfig, ProjectConfig};

pub struct InitParams {
    pub name: Option<String>,
    pub dir: PathBuf,
    pub namespace: String,
    pub force: bool,
}

#[derive(Debug)]
pub struct InitOutcome {
    pub project_name: String,
    pub config_path: PathBuf,
    pub output_dir: PathBuf,
}

pub fn init_project(project_dir: &Path, params: InitParams) -> Result<InitOutcome, OpsError> {
    ensure_no_config(project_dir, params.force)?;
    let name = params.name.unwrap_or_else(|| dir_project_name(project_dir));

    let output_dir = project_dir.join(&params.dir);
    std::fs::create_dir_all(&output_dir)
        .with_context(|| format!("failed to create output directory {}", params.dir.display()))
        .or_kind(OpsErrorKind::Io)?;

    save_config(
        project_dir,
        ProjectConfig {
            name: name.clone(),
            default_namespace: params.namespace,
            output_dir: params.dir.to_string_lossy().to_string(),
        },
    )?;

    Ok(InitOutcome {
        project_name: name,
        config_path: KikxConfig::config_path(project_dir),
        output_dir,
    })
}

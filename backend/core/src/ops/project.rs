use std::path::Path;

use anyhow::anyhow;

use super::error::{OpsError, OpsErrorKind, OrKind};
use crate::config::{KikxConfig, ProjectConfig, CONFIG_FILE_NAME, DEFAULT_PROJECT_NAME};

pub(super) fn ensure_no_config(project_dir: &Path, force: bool) -> Result<(), OpsError> {
    if KikxConfig::config_path(project_dir).exists() && !force {
        return Err(OpsError::new(
            OpsErrorKind::AlreadyExists,
            anyhow!(
                "{CONFIG_FILE_NAME} already exists in {} — pass --force to overwrite",
                project_dir.display()
            ),
        ));
    }
    Ok(())
}

pub(super) fn dir_project_name(project_dir: &Path) -> String {
    project_dir
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| DEFAULT_PROJECT_NAME.to_string())
}

pub(super) fn save_config(project_dir: &Path, project: ProjectConfig) -> Result<(), OpsError> {
    KikxConfig { project }
        .save(project_dir)
        .or_kind(OpsErrorKind::Io)
}

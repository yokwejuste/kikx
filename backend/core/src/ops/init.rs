use std::path::{Path, PathBuf};

use anyhow::{anyhow, Context};

use super::error::{OpsError, OpsErrorKind};
use crate::config::{KikxConfig, ProjectConfig, CONFIG_FILE_NAME};

pub struct InitParams {
    pub name: Option<String>,
    pub dir: PathBuf,
    pub namespace: String,
    pub force: bool,
}

pub struct InitOutcome {
    pub project_name: String,
    pub config_path: PathBuf,
    pub output_dir: PathBuf,
}

pub fn init_project(project_dir: &Path, params: InitParams) -> Result<InitOutcome, OpsError> {
    let config_path = KikxConfig::config_path(project_dir);

    if config_path.exists() && !params.force {
        return Err(OpsError::new(
            OpsErrorKind::AlreadyExists,
            anyhow!(
                "{CONFIG_FILE_NAME} already exists in {} — pass --force to overwrite",
                project_dir.display()
            ),
        ));
    }

    let name = params.name.unwrap_or_else(|| {
        project_dir
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| "kikx-project".to_string())
    });

    let output_dir = project_dir.join(&params.dir);
    std::fs::create_dir_all(&output_dir)
        .with_context(|| format!("failed to create output directory {}", params.dir.display()))
        .map_err(|e| OpsError::new(OpsErrorKind::Io, e))?;

    let config = KikxConfig {
        project: ProjectConfig {
            name: name.clone(),
            default_namespace: params.namespace,
            output_dir: params.dir.to_string_lossy().to_string(),
        },
    };
    config
        .save(project_dir)
        .map_err(|e| OpsError::new(OpsErrorKind::Io, e))?;

    Ok(InitOutcome {
        project_name: name,
        config_path,
        output_dir,
    })
}

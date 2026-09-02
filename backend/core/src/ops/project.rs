use std::path::Path;

use anyhow::Context;

use super::error::{OpsError, OpsErrorKind};
use crate::config::KikxConfig;
use crate::templates::Component;

pub struct ProjectSummary {
    pub name: String,
    pub default_namespace: String,
    pub output_dir: String,
}

pub struct VendoredFile {
    pub file_name: String,
    pub component: String,
    pub name: String,
}

pub struct ProjectState {
    pub exists: bool,
    pub project: Option<ProjectSummary>,
    pub vendored_files: Vec<VendoredFile>,
}

pub fn inspect_project(project_dir: &Path) -> Result<ProjectState, OpsError> {
    let config_path = KikxConfig::config_path(project_dir);
    if !config_path.exists() {
        return Ok(ProjectState {
            exists: false,
            project: None,
            vendored_files: Vec::new(),
        });
    }

    let config =
        KikxConfig::load(project_dir).map_err(|e| OpsError::new(OpsErrorKind::Other, e))?;
    let output_dir = project_dir.join(&config.project.output_dir);

    let mut vendored_files = Vec::new();
    if output_dir.is_dir() {
        let entries = std::fs::read_dir(&output_dir)
            .with_context(|| format!("failed to read {}", output_dir.display()))
            .map_err(|e| OpsError::new(OpsErrorKind::Io, e))?;
        for entry in entries {
            let entry = entry.map_err(|e| OpsError::new(OpsErrorKind::Io, e.into()))?;
            let file_name = entry.file_name().to_string_lossy().to_string();
            for component in Component::ALL {
                let suffix = format!("-{}.yaml", component.name());
                if let Some(name) = file_name.strip_suffix(&suffix) {
                    vendored_files.push(VendoredFile {
                        file_name: file_name.clone(),
                        component: component.name().to_string(),
                        name: name.to_string(),
                    });
                    break;
                }
            }
        }
    }
    vendored_files.sort_by(|a, b| a.file_name.cmp(&b.file_name));

    Ok(ProjectState {
        exists: true,
        project: Some(ProjectSummary {
            name: config.project.name,
            default_namespace: config.project.default_namespace,
            output_dir: config.project.output_dir,
        }),
        vendored_files,
    })
}

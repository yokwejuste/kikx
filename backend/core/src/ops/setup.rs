use std::path::{Path, PathBuf};

use super::error::{OpsError, OpsErrorKind, OrKind};
use super::manifest::{render_manifest, write_all};
use super::project::{dir_project_name, ensure_no_config, save_config};
use crate::config::{self, ProjectConfig};
use crate::presets::resolve_preset;

pub struct SetupParams {
    pub reference: String,
    pub force: bool,
}

#[derive(Debug)]
pub struct SetupOutcome {
    pub project_name: String,
    pub output_dir: PathBuf,
    pub files_written: Vec<PathBuf>,
}

pub fn setup_project(project_dir: &Path, params: SetupParams) -> Result<SetupOutcome, OpsError> {
    ensure_no_config(project_dir, params.force)?;
    let manifest = resolve_preset(&params.reference).or_kind(OpsErrorKind::Other)?;

    let (name, namespace, output_dir_str) = match &manifest.project {
        Some(p) => (
            p.name
                .clone()
                .unwrap_or_else(|| dir_project_name(project_dir)),
            p.namespace.clone(),
            p.output_dir.clone(),
        ),
        None => (
            dir_project_name(project_dir),
            config::default_namespace(),
            config::default_output_dir(),
        ),
    };

    let output_dir = project_dir.join(&output_dir_str);
    let rendered = render_manifest(&manifest, &namespace)?;
    write_all(&output_dir, &rendered, params.force)?;

    save_config(
        project_dir,
        ProjectConfig {
            name: name.clone(),
            default_namespace: namespace,
            output_dir: output_dir_str,
        },
    )?;

    Ok(SetupOutcome {
        project_name: name,
        files_written: rendered.iter().map(|f| output_dir.join(&f.path)).collect(),
        output_dir,
    })
}

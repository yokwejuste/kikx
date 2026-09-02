use std::path::{Path, PathBuf};

use anyhow::anyhow;

use super::error::{OpsError, OpsErrorKind};
use super::manifest::{render_manifest, write_all};
use crate::config::{KikxConfig, ProjectConfig, CONFIG_FILE_NAME};
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

    let manifest =
        resolve_preset(&params.reference).map_err(|e| OpsError::new(OpsErrorKind::Other, e))?;

    let default_dir_name = || {
        project_dir
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| "kikx-project".to_string())
    };
    let (name, namespace, output_dir_str) = match &manifest.project {
        Some(p) => (
            p.name.clone().unwrap_or_else(default_dir_name),
            p.namespace.clone(),
            p.output_dir.clone(),
        ),
        None => (default_dir_name(), "default".to_string(), "k8s".to_string()),
    };

    let output_dir = project_dir.join(&output_dir_str);
    let rendered = render_manifest(&manifest, &namespace)?;
    write_all(&output_dir, &rendered, params.force)?;

    let config = KikxConfig {
        project: ProjectConfig {
            name: name.clone(),
            default_namespace: namespace,
            output_dir: output_dir_str,
        },
    };
    config
        .save(project_dir)
        .map_err(|e| OpsError::new(OpsErrorKind::Io, e))?;

    Ok(SetupOutcome {
        project_name: name,
        files_written: rendered.iter().map(|f| output_dir.join(&f.path)).collect(),
        output_dir,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn write_preset(dir: &Path) -> PathBuf {
        let path = dir.join("preset.json");
        std::fs::write(
            &path,
            r#"{"name":"demo","project":{"name":"demo-app","namespace":"demo","outputDir":"k8s"},"components":[{"reference":"k8s/deployment","name":"web","fields":{"image":"nginx:1.27"}}]}"#,
        )
        .unwrap();
        path
    }

    #[test]
    fn seeds_kikx_toml_from_project_block() {
        let src = tempfile::tempdir().unwrap();
        let preset = write_preset(src.path());
        let target = tempfile::tempdir().unwrap();

        let outcome = setup_project(
            target.path(),
            SetupParams {
                reference: preset.to_str().unwrap().to_string(),
                force: false,
            },
        )
        .unwrap();

        assert_eq!(outcome.project_name, "demo-app");
        let config = std::fs::read_to_string(target.path().join("kikx.toml")).unwrap();
        assert!(config.contains("name = \"demo-app\""));
        assert!(config.contains("default_namespace = \"demo\""));
        assert!(target.path().join("k8s/web-deployment.yaml").exists());
    }

    #[test]
    fn refuses_to_overwrite_existing_config_without_force() {
        let src = tempfile::tempdir().unwrap();
        let preset = write_preset(src.path());
        let target = tempfile::tempdir().unwrap();
        std::fs::write(target.path().join(CONFIG_FILE_NAME), "existing").unwrap();

        let err = setup_project(
            target.path(),
            SetupParams {
                reference: preset.to_str().unwrap().to_string(),
                force: false,
            },
        )
        .unwrap_err();

        assert_eq!(err.kind, OpsErrorKind::AlreadyExists);
    }
}

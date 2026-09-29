use std::path::{Path, PathBuf};

use super::error::{OpsError, OpsErrorKind};
use super::manifest::{render_manifest, write_all};
use crate::presets::resolve_preset;

pub struct ApplyParams {
    pub reference: String,
    pub into: Option<PathBuf>,
    pub force: bool,
}

pub struct ApplyOutcome {
    pub files_written: Vec<PathBuf>,
}

pub fn apply_bundle(target_dir: &Path, params: ApplyParams) -> Result<ApplyOutcome, OpsError> {
    let manifest =
        resolve_preset(&params.reference).map_err(|e| OpsError::new(OpsErrorKind::Other, e))?;

    let default_namespace = manifest
        .project
        .as_ref()
        .map(|p| p.namespace.clone())
        .unwrap_or_else(crate::config::default_namespace);

    let rendered = render_manifest(&manifest, &default_namespace)?;

    let base = match &params.into {
        Some(sub) => target_dir.join(sub),
        None => target_dir.to_path_buf(),
    };
    write_all(&base, &rendered, params.force)?;

    Ok(ApplyOutcome {
        files_written: rendered.iter().map(|f| base.join(&f.path)).collect(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn write_preset(dir: &Path) -> PathBuf {
        let path = dir.join("preset.json");
        std::fs::write(
            &path,
            r#"{"name":"demo","components":[{"reference":"k8s/deployment","name":"web","fields":{"image":"nginx:1.27"}}]}"#,
        )
        .unwrap();
        path
    }

    #[test]
    fn writes_files_without_touching_kikx_toml() {
        let src = tempfile::tempdir().unwrap();
        let preset = write_preset(src.path());
        let target = tempfile::tempdir().unwrap();

        let outcome = apply_bundle(
            target.path(),
            ApplyParams {
                reference: preset.to_str().unwrap().to_string(),
                into: None,
                force: false,
            },
        )
        .unwrap();

        assert_eq!(outcome.files_written.len(), 1);
        assert!(target.path().join("web-deployment.yaml").exists());
        assert!(!target.path().join("kikx.toml").exists());
    }

    #[test]
    fn into_nests_under_a_subdirectory() {
        let src = tempfile::tempdir().unwrap();
        let preset = write_preset(src.path());
        let target = tempfile::tempdir().unwrap();

        apply_bundle(
            target.path(),
            ApplyParams {
                reference: preset.to_str().unwrap().to_string(),
                into: Some(PathBuf::from("vendor")),
                force: false,
            },
        )
        .unwrap();

        assert!(target.path().join("vendor/web-deployment.yaml").exists());
    }
}

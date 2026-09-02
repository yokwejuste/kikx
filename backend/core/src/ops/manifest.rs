use std::collections::HashSet;
use std::path::{Component, Path};

use anyhow::{anyhow, Context};

use super::add::{render_component, RenderParams, RenderedFile};
use super::error::{OpsError, OpsErrorKind};
use crate::presets::PresetManifest;

pub fn render_manifest(
    manifest: &PresetManifest,
    default_namespace: &str,
) -> Result<Vec<RenderedFile>, OpsError> {
    let mut files = Vec::new();
    for component in &manifest.components {
        let outcome = render_component(RenderParams {
            reference: component.reference.clone(),
            name: component.name.clone(),
            fields: component.fields.clone().into_iter().collect(),
            labels: component.labels.clone().into_iter().collect(),
            default_namespace: default_namespace.to_string(),
        })?;
        files.extend(outcome.files);
    }
    Ok(files)
}

fn validate_path_safety(rendered: &[RenderedFile]) -> Result<(), OpsError> {
    let mut seen = HashSet::new();
    for file in rendered {
        if file.path.is_absolute() {
            return Err(OpsError::new(
                OpsErrorKind::InvalidComponent,
                anyhow!(
                    "refusing to write `{}` — absolute paths are not allowed",
                    file.path.display()
                ),
            ));
        }
        let mut depth: i32 = 0;
        for part in file.path.components() {
            match part {
                Component::ParentDir => {
                    depth -= 1;
                    if depth < 0 {
                        return Err(OpsError::new(
                            OpsErrorKind::InvalidComponent,
                            anyhow!(
                                "refusing to write `{}` — it escapes the target directory",
                                file.path.display()
                            ),
                        ));
                    }
                }
                Component::Normal(_) => depth += 1,
                _ => {}
            }
        }
        if !seen.insert(file.path.clone()) {
            return Err(OpsError::new(
                OpsErrorKind::InvalidComponent,
                anyhow!(
                    "two files rendered to the same path: `{}`",
                    file.path.display()
                ),
            ));
        }
    }
    Ok(())
}

pub fn write_all(
    output_dir: &Path,
    rendered: &[RenderedFile],
    force: bool,
) -> Result<(), OpsError> {
    validate_path_safety(rendered)?;

    for file in rendered {
        let target = output_dir.join(&file.path);
        if target.exists() && !force {
            return Err(OpsError::new(
                OpsErrorKind::AlreadyExists,
                anyhow!(
                    "{} already exists — pass --force to overwrite",
                    target.display()
                ),
            ));
        }
    }

    for file in rendered {
        let target = output_dir.join(&file.path);
        if let Some(parent) = target.parent() {
            std::fs::create_dir_all(parent)
                .with_context(|| format!("failed to create directory {}", parent.display()))
                .map_err(|e| OpsError::new(OpsErrorKind::Io, e))?;
        }
        std::fs::write(&target, &file.content)
            .with_context(|| format!("failed to write {}", target.display()))
            .map_err(|e| OpsError::new(OpsErrorKind::Io, e))?;
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    fn file(path: &str) -> RenderedFile {
        RenderedFile {
            path: PathBuf::from(path),
            content: "x".to_string(),
        }
    }

    #[test]
    fn rejects_absolute_path() {
        let err = validate_path_safety(&[file("/etc/passwd")]).unwrap_err();
        assert_eq!(err.kind, OpsErrorKind::InvalidComponent);
    }

    #[test]
    fn rejects_path_escaping_target_dir() {
        let err = validate_path_safety(&[file("../../etc/passwd")]).unwrap_err();
        assert_eq!(err.kind, OpsErrorKind::InvalidComponent);
    }

    #[test]
    fn rejects_duplicate_rendered_paths() {
        let err = validate_path_safety(&[file("a.yaml"), file("a.yaml")]).unwrap_err();
        assert_eq!(err.kind, OpsErrorKind::InvalidComponent);
    }

    #[test]
    fn allows_nested_relative_paths() {
        assert!(validate_path_safety(&[file("roles/common/tasks/main.yml")]).is_ok());
    }

    #[test]
    fn write_all_creates_nested_directories() {
        let tmp = tempfile::tempdir().unwrap();
        write_all(tmp.path(), &[file("roles/common/tasks/main.yml")], false).unwrap();
        assert!(tmp.path().join("roles/common/tasks/main.yml").exists());
    }

    #[test]
    fn write_all_is_atomic_on_collision() {
        let tmp = tempfile::tempdir().unwrap();
        std::fs::write(tmp.path().join("a.yaml"), "existing").unwrap();
        let err = write_all(tmp.path(), &[file("new.yaml"), file("a.yaml")], false).unwrap_err();
        assert_eq!(err.kind, OpsErrorKind::AlreadyExists);
        assert!(!tmp.path().join("new.yaml").exists());
    }
}

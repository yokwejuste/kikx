use std::collections::HashSet;
use std::path::{Component, Path};

use anyhow::{anyhow, Context};

use super::add::{render_component, RenderParams, RenderedFile};
use super::error::{OpsError, OpsErrorKind, OrKind};
use crate::presets::PresetManifest;

pub(super) fn render_manifest(
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

pub(super) fn write_all(
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
                .or_kind(OpsErrorKind::Io)?;
        }
        std::fs::write(&target, &file.content)
            .with_context(|| format!("failed to write {}", target.display()))
            .or_kind(OpsErrorKind::Io)?;
    }

    Ok(())
}

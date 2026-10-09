use std::io::ErrorKind;
use std::path::{Path, PathBuf};

use anyhow::Context;

use super::add::{render_component, RenderParams, RenderedFile};
use super::apply::render_bundle;
use super::error::{OpsError, OpsErrorKind, OrKind};
use super::manifest::validate_path_safety;
use crate::config::KikxConfig;

pub enum DiffTarget {
    Component {
        reference: String,
        name: String,
        fields: Vec<(String, String)>,
        labels: Vec<(String, String)>,
    },
    Bundle {
        reference: String,
        into: Option<PathBuf>,
    },
}

#[derive(Debug, PartialEq, Eq)]
pub enum FileChange {
    Added,
    Modified { current: String },
    Unchanged,
}

#[derive(Debug)]
pub struct FileDiff {
    pub path: PathBuf,
    pub incoming: String,
    pub change: FileChange,
}

pub fn diff_project(project_dir: &Path, target: DiffTarget) -> Result<Vec<FileDiff>, OpsError> {
    match target {
        DiffTarget::Component {
            reference,
            name,
            fields,
            labels,
        } => {
            let config = KikxConfig::load(project_dir).or_kind(OpsErrorKind::NotInitialized)?;
            let outcome = render_component(RenderParams {
                reference,
                name,
                fields,
                labels,
                default_namespace: config.project.default_namespace.clone(),
            })?;
            compare(&project_dir.join(&config.project.output_dir), outcome.files)
        }
        DiffTarget::Bundle { reference, into } => {
            let rendered = render_bundle(&reference)?;
            let base = into.map_or_else(|| project_dir.to_path_buf(), |sub| project_dir.join(sub));
            compare(&base, rendered)
        }
    }
}

fn compare(base: &Path, rendered: Vec<RenderedFile>) -> Result<Vec<FileDiff>, OpsError> {
    validate_path_safety(&rendered)?;
    rendered
        .into_iter()
        .map(|file| {
            let target = base.join(&file.path);
            let change = match std::fs::read_to_string(&target) {
                Ok(current) if current == file.content => FileChange::Unchanged,
                Ok(current) => FileChange::Modified { current },
                Err(err) if err.kind() == ErrorKind::NotFound => FileChange::Added,
                Err(err) => {
                    return Err(err)
                        .with_context(|| format!("failed to read {}", target.display()))
                        .or_kind(OpsErrorKind::Io)
                }
            };
            Ok(FileDiff {
                path: target,
                incoming: file.content,
                change,
            })
        })
        .collect()
}

use std::path::{Path, PathBuf};

use super::add::RenderedFile;
use super::error::{OpsError, OpsErrorKind, OrKind};
use super::manifest::{render_manifest, write_all};
use crate::config;
use crate::presets::resolve_preset;

pub struct ApplyParams {
    pub reference: String,
    pub into: Option<PathBuf>,
    pub force: bool,
}

#[derive(Debug)]
pub struct ApplyOutcome {
    pub files_written: Vec<PathBuf>,
}

pub(super) fn render_bundle(reference: &str) -> Result<Vec<RenderedFile>, OpsError> {
    let manifest = resolve_preset(reference).or_kind(OpsErrorKind::Other)?;
    let default_namespace = manifest
        .project
        .as_ref()
        .map_or_else(config::default_namespace, |p| p.namespace.clone());
    render_manifest(&manifest, &default_namespace)
}

pub fn apply_bundle(target_dir: &Path, params: ApplyParams) -> Result<ApplyOutcome, OpsError> {
    let rendered = render_bundle(&params.reference)?;

    let base = match &params.into {
        Some(sub) => target_dir.join(sub),
        None => target_dir.to_path_buf(),
    };
    write_all(&base, &rendered, params.force)?;

    Ok(ApplyOutcome {
        files_written: rendered.iter().map(|f| base.join(&f.path)).collect(),
    })
}

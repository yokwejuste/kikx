use anyhow::{anyhow, Result};

use super::manifest::PresetManifest;
use crate::source::load_json;

pub fn resolve_preset(reference: &str) -> Result<PresetManifest> {
    load_json(reference, "kikx preset manifest").unwrap_or_else(|| {
        Err(anyhow!(
            "`{reference}` isn't a URL or an existing local file — pass a URL or path to a kikx preset manifest"
        ))
    })
}

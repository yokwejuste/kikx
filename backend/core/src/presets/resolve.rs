use anyhow::{anyhow, Result};

use super::manifest::PresetManifest;
use super::templates::template;
use crate::source::load_json;

pub fn resolve_preset(reference: &str) -> Result<PresetManifest> {
    if let Some(manifest) = template(reference) {
        return Ok(manifest);
    }
    load_json(reference, "kikx preset manifest").unwrap_or_else(|| {
        Err(anyhow!(
            "`{reference}` isn't a template name, a URL or an existing local file. Run `kikx presets` to see the templates"
        ))
    })
}

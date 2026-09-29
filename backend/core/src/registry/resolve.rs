use anyhow::{anyhow, Result};

use super::builtin;
use super::item::RegistryItem;
use crate::source::load_json;

pub fn resolve(reference: &str) -> Result<RegistryItem> {
    if let Some(item) = builtin::lookup(reference) {
        return Ok(item);
    }
    load_json(reference, "registry item").unwrap_or_else(|| {
        Err(anyhow!(
            "`{reference}` isn't a built-in component, and isn't a URL or existing local file. \
             Run `kikx list` to see built-ins, or pass a URL/path to a registry-item.json"
        ))
    })
}

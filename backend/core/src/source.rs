use std::path::Path;

use anyhow::{Context, Result};
use serde::de::DeserializeOwned;

pub(crate) fn load_json<T: DeserializeOwned>(reference: &str, what: &str) -> Option<Result<T>> {
    if reference.starts_with("http://") || reference.starts_with("https://") {
        return Some(fetch_url(reference, what));
    }
    let path = Path::new(reference);
    path.is_file().then(|| read_local_file(path, what))
}

fn fetch_url<T: DeserializeOwned>(url: &str, what: &str) -> Result<T> {
    let body: String = ureq::get(url)
        .call()
        .with_context(|| format!("failed to fetch {what} from {url}"))?
        .body_mut()
        .read_to_string()
        .with_context(|| format!("failed to read response body from {url}"))?;
    serde_json::from_str(&body).with_context(|| format!("{url} is not a valid {what}"))
}

fn read_local_file<T: DeserializeOwned>(path: &Path, what: &str) -> Result<T> {
    let body = std::fs::read_to_string(path)
        .with_context(|| format!("failed to read {}", path.display()))?;
    serde_json::from_str(&body).with_context(|| format!("{} is not a valid {what}", path.display()))
}

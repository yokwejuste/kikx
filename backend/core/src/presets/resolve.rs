use std::path::Path;

use anyhow::{anyhow, Context, Result};

use super::manifest::PresetManifest;

pub fn resolve_preset(reference: &str) -> Result<PresetManifest> {
    if reference.starts_with("http://") || reference.starts_with("https://") {
        return fetch_url(reference);
    }
    let path = Path::new(reference);
    if path.is_file() {
        return read_local_file(path);
    }
    Err(anyhow!(
        "`{reference}` isn't a URL or an existing local file — pass a URL or path to a kikx preset manifest"
    ))
}

fn fetch_url(url: &str) -> Result<PresetManifest> {
    let body: String = ureq::get(url)
        .call()
        .with_context(|| format!("failed to fetch preset from {url}"))?
        .body_mut()
        .read_to_string()
        .with_context(|| format!("failed to read response body from {url}"))?;
    serde_json::from_str(&body)
        .with_context(|| format!("{url} is not a valid kikx preset manifest"))
}

fn read_local_file(path: &Path) -> Result<PresetManifest> {
    let body = std::fs::read_to_string(path)
        .with_context(|| format!("failed to read {}", path.display()))?;
    serde_json::from_str(&body)
        .with_context(|| format!("{} is not a valid kikx preset manifest", path.display()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn resolves_local_file() {
        let tmp = tempfile::tempdir().unwrap();
        let path = tmp.path().join("preset.json");
        std::fs::write(
            &path,
            r#"{"name":"demo","components":[{"reference":"k8s/deployment","name":"web","fields":{"image":"nginx:1.27"}}]}"#,
        )
        .unwrap();

        let manifest = resolve_preset(path.to_str().unwrap()).unwrap();
        assert_eq!(manifest.name, "demo");
        assert_eq!(manifest.components.len(), 1);
        assert_eq!(manifest.components[0].reference, "k8s/deployment");
    }

    #[test]
    fn unknown_reference_errors_with_helpful_text() {
        let err = resolve_preset("not-a-real-thing").unwrap_err();
        assert!(err.to_string().contains("preset manifest"));
    }
}

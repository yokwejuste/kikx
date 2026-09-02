use std::path::Path;

use anyhow::{anyhow, Context, Result};

use super::builtin;
use super::item::RegistryItem;

pub fn resolve(reference: &str) -> Result<RegistryItem> {
    if let Some(item) = builtin::lookup(reference) {
        return Ok(item);
    }
    if reference.starts_with("http://") || reference.starts_with("https://") {
        return fetch_url(reference);
    }
    let path = Path::new(reference);
    if path.is_file() {
        return read_local_file(path);
    }
    Err(anyhow!(
        "`{reference}` isn't a built-in component, and isn't a URL or existing local file — \
         run `kikx list` to see built-ins, or pass a URL/path to a registry-item.json"
    ))
}

fn fetch_url(url: &str) -> Result<RegistryItem> {
    let body: String = ureq::get(url)
        .call()
        .with_context(|| format!("failed to fetch registry item from {url}"))?
        .body_mut()
        .read_to_string()
        .with_context(|| format!("failed to read response body from {url}"))?;
    serde_json::from_str(&body).with_context(|| format!("{url} is not a valid registry item"))
}

fn read_local_file(path: &Path) -> Result<RegistryItem> {
    let body = std::fs::read_to_string(path)
        .with_context(|| format!("failed to read {}", path.display()))?;
    serde_json::from_str(&body)
        .with_context(|| format!("{} is not a valid registry item", path.display()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn resolves_bare_and_prefixed_builtin_names() {
        assert_eq!(resolve("deployment").unwrap().reference(), "k8s/deployment");
        assert_eq!(
            resolve("k8s/deployment").unwrap().reference(),
            "k8s/deployment"
        );
        assert_eq!(
            resolve("terraform/digitalocean").unwrap().reference(),
            "terraform/digitalocean"
        );
    }

    #[test]
    fn resolves_local_file() {
        let tmp = tempfile::tempdir().unwrap();
        let path = tmp.path().join("custom.json");
        std::fs::write(
            &path,
            r#"{"name":"custom","category":"acme","files":[{"path":"{{ name }}.txt","template":"hello {{ name }}"}]}"#,
        )
        .unwrap();

        let item = resolve(path.to_str().unwrap()).unwrap();
        assert_eq!(item.reference(), "acme/custom");
        assert_eq!(item.files.len(), 1);
        assert_eq!(item.files[0].template, "hello {{ name }}");
    }

    #[test]
    fn unknown_reference_errors_with_helpful_text() {
        let err = resolve("not-a-real-thing").unwrap_err();
        assert!(err.to_string().contains("kikx list"));
    }
}

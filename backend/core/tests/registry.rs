mod common;

use common::write_file;
use std::collections::HashSet;

use kikx_core::registry::{builtin, resolve};
use minijinja::Environment;

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
    let path = write_file(
        tmp.path(),
        "custom.json",
        r#"{"name":"custom","category":"acme","files":[{"path":"{{ name }}.txt","template":"hello {{ name }}"}]}"#,
    );

    let item = resolve(&path).unwrap();
    assert_eq!(item.reference(), "acme/custom");
    assert_eq!(item.files.len(), 1);
    assert_eq!(item.files[0].template, "hello {{ name }}");
}

#[test]
fn unknown_reference_errors_with_helpful_text() {
    let err = resolve("not-a-real-thing").unwrap_err();
    assert!(err.to_string().contains("kikx list"));
}

#[test]
fn every_builtin_item_resolves_and_its_templates_parse() {
    let env = Environment::new();
    let mut references = HashSet::new();
    for item in builtin::all() {
        let reference = item.reference();
        assert!(references.insert(reference.clone()), "{reference} twice");
        assert!(!item.files.is_empty(), "{reference} has no files");
        assert_eq!(resolve(&reference).unwrap().reference(), reference);
        for file in &item.files {
            env.template_from_str(&file.path)
                .unwrap_or_else(|e| panic!("{reference} path {}: {e}", file.path));
            env.template_from_str(&file.template)
                .unwrap_or_else(|e| panic!("{reference} template {}: {e}", file.path));
        }
    }
}

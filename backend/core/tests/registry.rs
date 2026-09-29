mod common;

use common::write_file;
use kikx_core::registry::resolve;

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

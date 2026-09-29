mod common;

use common::write_file;
use kikx_core::presets::resolve_preset;

#[test]
fn resolves_local_file() {
    let tmp = tempfile::tempdir().unwrap();
    let path = write_file(
        tmp.path(),
        "preset.json",
        r#"{"name":"demo","components":[{"reference":"k8s/deployment","name":"web","fields":{"image":"nginx:1.27"}}]}"#,
    );

    let manifest = resolve_preset(&path).unwrap();
    assert_eq!(manifest.name, "demo");
    assert_eq!(manifest.components.len(), 1);
    assert_eq!(manifest.components[0].reference, "k8s/deployment");
}

#[test]
fn unknown_reference_errors_with_helpful_text() {
    let err = resolve_preset("not-a-real-thing").unwrap_err();
    assert!(err.to_string().contains("preset manifest"));
}

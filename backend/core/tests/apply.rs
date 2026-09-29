mod common;

use std::path::{Path, PathBuf};

use common::write_file;
use kikx_core::ops::{apply_bundle, ApplyOutcome, ApplyParams, OpsError, OpsErrorKind};

const WEB_DEPLOYMENT: &str =
    r#"{"reference":"k8s/deployment","name":"web","fields":{"image":"nginx:1.27"}}"#;

fn preset(dir: &Path, components: &[&str]) -> String {
    write_file(
        dir,
        "preset.json",
        &format!(
            r#"{{"name":"demo","components":[{}]}}"#,
            components.join(",")
        ),
    )
}

fn preset_writing_to(dir: &Path, path: &str) -> String {
    let item = format!(
        r#"{{"name":"raw","category":"acme","files":[{{"path":"{path}","template":"x"}}]}}"#
    );
    let item = write_file(dir, "item.json", &item);
    let component = format!(r#"{{"reference":{},"name":"x"}}"#, serde_json::json!(item));
    preset(dir, &[&component])
}

fn apply(
    target: &Path,
    reference: String,
    into: Option<PathBuf>,
) -> Result<ApplyOutcome, OpsError> {
    apply_bundle(
        target,
        ApplyParams {
            reference,
            into,
            force: false,
        },
    )
}

#[test]
fn writes_files_without_touching_kikx_toml() {
    let src = tempfile::tempdir().unwrap();
    let target = tempfile::tempdir().unwrap();

    let outcome = apply(target.path(), preset(src.path(), &[WEB_DEPLOYMENT]), None).unwrap();

    assert_eq!(outcome.files_written.len(), 1);
    assert!(target.path().join("web-deployment.yaml").exists());
    assert!(!target.path().join("kikx.toml").exists());
}

#[test]
fn into_nests_under_a_subdirectory() {
    let src = tempfile::tempdir().unwrap();
    let target = tempfile::tempdir().unwrap();

    apply(
        target.path(),
        preset(src.path(), &[WEB_DEPLOYMENT]),
        Some(PathBuf::from("vendor")),
    )
    .unwrap();

    assert!(target.path().join("vendor/web-deployment.yaml").exists());
}

#[test]
fn rejects_absolute_path() {
    let src = tempfile::tempdir().unwrap();
    let target = tempfile::tempdir().unwrap();
    let absolute = target.path().join("abs.txt");

    let err = apply(
        target.path(),
        preset_writing_to(src.path(), absolute.to_str().unwrap()),
        None,
    )
    .unwrap_err();

    assert_eq!(err.kind, OpsErrorKind::InvalidComponent);
    assert!(!absolute.exists());
}

#[test]
fn rejects_path_escaping_target_dir() {
    let src = tempfile::tempdir().unwrap();
    let root = tempfile::tempdir().unwrap();
    let target = root.path().join("a/b");

    let err = apply(
        &target,
        preset_writing_to(src.path(), "../../escaped.txt"),
        None,
    )
    .unwrap_err();

    assert_eq!(err.kind, OpsErrorKind::InvalidComponent);
    assert!(!root.path().join("escaped.txt").exists());
}

#[test]
fn rejects_duplicate_rendered_paths() {
    let src = tempfile::tempdir().unwrap();
    let target = tempfile::tempdir().unwrap();

    let err = apply(
        target.path(),
        preset(src.path(), &[WEB_DEPLOYMENT, WEB_DEPLOYMENT]),
        None,
    )
    .unwrap_err();

    assert_eq!(err.kind, OpsErrorKind::InvalidComponent);
}

#[test]
fn allows_nested_relative_paths() {
    let src = tempfile::tempdir().unwrap();
    let target = tempfile::tempdir().unwrap();

    let result = apply(
        target.path(),
        preset_writing_to(src.path(), "roles/common/tasks/main.yml"),
        None,
    );

    assert!(result.is_ok());
}

#[test]
fn creates_nested_directories() {
    let src = tempfile::tempdir().unwrap();
    let target = tempfile::tempdir().unwrap();

    apply(
        target.path(),
        preset_writing_to(src.path(), "roles/common/tasks/main.yml"),
        None,
    )
    .unwrap();

    assert!(target.path().join("roles/common/tasks/main.yml").exists());
}

#[test]
fn is_atomic_on_collision() {
    let src = tempfile::tempdir().unwrap();
    let target = tempfile::tempdir().unwrap();
    std::fs::write(target.path().join("a-deployment.yaml"), "existing").unwrap();
    let new = r#"{"reference":"k8s/deployment","name":"new","fields":{"image":"nginx"}}"#;
    let existing = r#"{"reference":"k8s/deployment","name":"a","fields":{"image":"nginx"}}"#;

    let err = apply(target.path(), preset(src.path(), &[new, existing]), None).unwrap_err();

    assert_eq!(err.kind, OpsErrorKind::AlreadyExists);
    assert!(!target.path().join("new-deployment.yaml").exists());
}

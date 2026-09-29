mod common;

use std::path::Path;

use common::write_file;
use kikx_core::config::CONFIG_FILE_NAME;
use kikx_core::ops::{setup_project, OpsErrorKind, SetupParams};

fn write_preset(dir: &Path) -> String {
    write_file(
        dir,
        "preset.json",
        r#"{"name":"demo","project":{"name":"demo-app","namespace":"demo","outputDir":"k8s"},"components":[{"reference":"k8s/deployment","name":"web","fields":{"image":"nginx:1.27"}}]}"#,
    )
}

#[test]
fn seeds_kikx_toml_from_project_block() {
    let src = tempfile::tempdir().unwrap();
    let target = tempfile::tempdir().unwrap();

    let outcome = setup_project(
        target.path(),
        SetupParams {
            reference: write_preset(src.path()),
            force: false,
        },
    )
    .unwrap();

    assert_eq!(outcome.project_name, "demo-app");
    let config = std::fs::read_to_string(target.path().join(CONFIG_FILE_NAME)).unwrap();
    assert!(config.contains("name = \"demo-app\""));
    assert!(config.contains("default_namespace = \"demo\""));
    assert!(target.path().join("k8s/web-deployment.yaml").exists());
}

#[test]
fn refuses_to_overwrite_existing_config_without_force() {
    let src = tempfile::tempdir().unwrap();
    let target = tempfile::tempdir().unwrap();
    std::fs::write(target.path().join(CONFIG_FILE_NAME), "existing").unwrap();

    let err = setup_project(
        target.path(),
        SetupParams {
            reference: write_preset(src.path()),
            force: false,
        },
    )
    .unwrap_err();

    assert_eq!(err.kind, OpsErrorKind::AlreadyExists);
}

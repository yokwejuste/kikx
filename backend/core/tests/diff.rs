mod common;

use std::path::Path;

use common::write_file;
use kikx_core::ops::{
    diff_project, init_project, DiffTarget, FileChange, FileDiff, InitParams, OpsErrorKind,
};

fn deployment(name: &str, image: &str) -> DiffTarget {
    DiffTarget::Component {
        reference: "k8s/deployment".to_string(),
        name: name.to_string(),
        fields: vec![("image".to_string(), image.to_string())],
        labels: vec![],
    }
}

fn init(dir: &Path) {
    init_project(
        dir,
        InitParams {
            name: Some("demo".to_string()),
            dir: "infra".into(),
            namespace: "default".to_string(),
            force: false,
        },
    )
    .unwrap();
}

fn single(diffs: Vec<FileDiff>) -> FileDiff {
    assert_eq!(diffs.len(), 1);
    diffs.into_iter().next().unwrap()
}

#[test]
fn reports_a_missing_file_as_added() {
    let tmp = tempfile::tempdir().unwrap();
    init(tmp.path());

    let diff = single(diff_project(tmp.path(), deployment("web", "nginx:1.27")).unwrap());

    assert_eq!(diff.change, FileChange::Added);
    assert!(diff.path.starts_with(tmp.path().join("infra")));
    assert!(diff.incoming.contains("nginx:1.27"));
}

#[test]
fn reports_identical_and_edited_files() {
    let tmp = tempfile::tempdir().unwrap();
    init(tmp.path());
    let rendered = single(diff_project(tmp.path(), deployment("web", "nginx:1.27")).unwrap());
    std::fs::create_dir_all(rendered.path.parent().unwrap()).unwrap();
    std::fs::write(&rendered.path, &rendered.incoming).unwrap();

    let same = single(diff_project(tmp.path(), deployment("web", "nginx:1.27")).unwrap());
    assert_eq!(same.change, FileChange::Unchanged);

    let bumped = single(diff_project(tmp.path(), deployment("web", "nginx:1.28")).unwrap());
    assert_eq!(
        bumped.change,
        FileChange::Modified {
            current: rendered.incoming
        }
    );
}

#[test]
fn component_diff_needs_an_initialized_project() {
    let tmp = tempfile::tempdir().unwrap();

    let err = diff_project(tmp.path(), deployment("web", "nginx:1.27")).unwrap_err();

    assert_eq!(err.kind, OpsErrorKind::NotInitialized);
}

#[test]
fn bundle_diff_compares_under_into() {
    let src = tempfile::tempdir().unwrap();
    let target = tempfile::tempdir().unwrap();
    let preset = write_file(
        src.path(),
        "preset.json",
        r#"{"name":"demo","components":[{"reference":"k8s/deployment","name":"web","fields":{"image":"nginx:1.27"}}]}"#,
    );

    let diff = single(
        diff_project(
            target.path(),
            DiffTarget::Bundle {
                reference: preset,
                into: Some("infra".into()),
            },
        )
        .unwrap(),
    );

    assert_eq!(diff.change, FileChange::Added);
    assert!(diff.path.starts_with(target.path().join("infra")));
}

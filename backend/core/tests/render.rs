mod common;

use common::{try_render, write_file};
use kikx_core::ops::{CommonFields, OpsErrorKind};

#[test]
fn rejects_two_files_rendering_to_the_same_path() {
    let item_json = r#"{"name":"dup","category":"acme","files":[{"path":"same.txt","template":"a"},{"path":"same.txt","template":"b"}]}"#;
    let tmp = tempfile::tempdir().unwrap();
    let item = write_file(tmp.path(), "dup.json", item_json);

    let err = try_render(&item, "x", &[]).unwrap_err();

    assert_eq!(err.kind, OpsErrorKind::InvalidComponent);
}

#[test]
fn common_fields_keep_only_set_options_then_extras() {
    let fields = CommonFields {
        image: Some("nginx".to_string()),
        target_port: Some(8080),
        ..Default::default()
    }
    .into_fields([("image".to_string(), "caddy".to_string())]);

    assert_eq!(
        fields,
        vec![
            ("image".to_string(), "nginx".to_string()),
            ("target_port".to_string(), "8080".to_string()),
            ("image".to_string(), "caddy".to_string()),
        ]
    );
}

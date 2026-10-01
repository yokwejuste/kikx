mod common;

use common::{try_render, write_file};
use kikx_core::ops::{render_component, CommonFields, OpsErrorKind, RenderParams};

fn render_service(labels: &[(&str, &str)]) -> String {
    let outcome = render_component(RenderParams {
        reference: "k8s/service".to_string(),
        name: "web".to_string(),
        fields: vec![("port".to_string(), "80".to_string())],
        labels: labels
            .iter()
            .map(|(k, v)| (k.to_string(), v.to_string()))
            .collect(),
        default_namespace: "default".to_string(),
    })
    .unwrap();
    outcome.files[0].content.clone()
}

#[test]
fn service_without_extra_labels_keeps_its_output() {
    assert_eq!(
        render_service(&[]),
        "apiVersion: v1\nkind: Service\nmetadata:\n  name: web\n  namespace: default\nspec:\n  selector:\n\n    app: web\n\n  ports:\n    - port: 80\n      targetPort: 80\n      protocol: TCP\n"
    );
}

#[test]
fn service_selects_only_the_app_label_and_keeps_extra_labels_as_metadata() {
    assert_eq!(
        render_service(&[("tier", "web"), ("app", "shop")]),
        "apiVersion: v1\nkind: Service\nmetadata:\n  name: web\n  namespace: default\n  labels:\n    app: shop\n    tier: web\nspec:\n  selector:\n\n    app: shop\n\n  ports:\n    - port: 80\n      targetPort: 80\n      protocol: TCP\n"
    );
}

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

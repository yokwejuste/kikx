use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use http_body_util::BodyExt;
use serde_json::{json, Value};
use tower::ServiceExt;

fn router() -> axum::Router {
    kikx_backend::http::build_router(kikx_backend::http::default_allowed_origins())
}

async fn send(
    app: axum::Router,
    method: Method,
    uri: &str,
    body: Option<Value>,
) -> (StatusCode, Value) {
    let request = match body {
        Some(b) => Request::builder()
            .method(method)
            .uri(uri)
            .header(header::CONTENT_TYPE, "application/json")
            .body(Body::from(serde_json::to_vec(&b).unwrap()))
            .unwrap(),
        None => Request::builder()
            .method(method)
            .uri(uri)
            .body(Body::empty())
            .unwrap(),
    };
    let response = app.oneshot(request).await.unwrap();
    let status = response.status();
    let bytes = response.into_body().collect().await.unwrap().to_bytes();
    let value: Value = if bytes.is_empty() {
        Value::Null
    } else {
        serde_json::from_slice(&bytes).unwrap_or(Value::Null)
    };
    (status, value)
}

#[tokio::test]
async fn health_ok() {
    let (status, _) = send(router(), Method::GET, "/api/health", None).await;
    assert_eq!(status, StatusCode::OK);
}

#[tokio::test]
async fn list_components_returns_all_builtins() {
    let (status, body) = send(router(), Method::GET, "/api/components", None).await;
    assert_eq!(status, StatusCode::OK);
    let components = body["components"].as_array().unwrap();
    let names: Vec<&str> = components.iter().map(|v| v.as_str().unwrap()).collect();
    assert_eq!(
        names,
        vec![
            "k8s/deployment",
            "k8s/service",
            "k8s/ingress",
            "terraform/digitalocean",
            "terraform/hetzner",
            "ansible/k8s-bootstrap",
        ]
    );
}

#[tokio::test]
async fn render_deployment_happy_path() {
    let (status, body) = send(
        router(),
        Method::POST,
        "/api/render",
        Some(json!({
            "reference": "k8s/deployment",
            "name": "web",
            "image": "nginx:1.27",
            "replicas": 3,
        })),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["component"], "deployment");
    assert_eq!(body["extension"], "yaml");
    let rendered = body["rendered"].as_str().unwrap();
    assert!(rendered.contains("image: nginx:1.27"));
    assert!(rendered.contains("replicas: 3"));
    assert!(rendered.contains("namespace: default"));
}

#[tokio::test]
async fn render_deployment_without_image_is_bad_request() {
    let (status, body) = send(
        router(),
        Method::POST,
        "/api/render",
        Some(json!({ "reference": "k8s/deployment", "name": "web" })),
    )
    .await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
    assert_eq!(body["code"], "invalid_request");
    assert!(body["error"].as_str().unwrap().contains("--image"));
}

#[tokio::test]
async fn render_unknown_reference_is_bad_request() {
    let (status, body) = send(
        router(),
        Method::POST,
        "/api/render",
        Some(json!({ "reference": "k8s/bogus", "name": "web" })),
    )
    .await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
    assert_eq!(body["code"], "invalid_request");
}

#[tokio::test]
async fn render_terraform_component_via_generic_fields_and_custom_namespace() {
    let (status, body) = send(
        router(),
        Method::POST,
        "/api/render",
        Some(json!({
            "reference": "terraform/digitalocean",
            "name": "control-plane",
            "defaultNamespace": "platform",
            "fields": { "region": "nyc3", "size": "s-2vcpu-4gb", "os_image": "ubuntu-22-04-x64", "count": "2" },
        })),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["component"], "digitalocean");
    assert_eq!(body["extension"], "tf");
    let rendered = body["rendered"].as_str().unwrap();
    assert!(rendered.contains("count  = 2"));
    assert!(rendered.contains("region = \"nyc3\""));
    assert!(!rendered.contains("platform"));
}

#[tokio::test]
async fn render_ansible_playbook() {
    let (status, body) = send(
        router(),
        Method::POST,
        "/api/render",
        Some(json!({
            "reference": "ansible/k8s-bootstrap",
            "name": "cluster",
            "fields": { "hosts": "control_plane", "k8s_version": "1.31" },
        })),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    let rendered = body["rendered"].as_str().unwrap();
    assert!(rendered.contains("hosts: control_plane"));
    assert!(rendered.contains("kubelet=1.31*"));
}

#[tokio::test]
async fn registry_inspect_returns_field_schema_for_builtin() {
    let uri = "/api/registry/inspect?ref=terraform/digitalocean";
    let (status, body) = send(router(), Method::GET, uri, None).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["name"], "digitalocean");
    assert_eq!(body["category"], "terraform");
    assert_eq!(body["extension"], "tf");
    let field_names: Vec<&str> = body["fields"]
        .as_array()
        .unwrap()
        .iter()
        .map(|f| f["name"].as_str().unwrap())
        .collect();
    assert!(field_names.contains(&"region"));
}

#[tokio::test]
async fn registry_inspect_from_local_file() {
    let tmp = tempfile::tempdir().unwrap();
    let item_path = tmp.path().join("custom.json");
    std::fs::write(
        &item_path,
        r#"{"name":"widget","category":"acme","extension":"txt","fields":[{"name":"color","required":true}],"template":"{{ color }}"}"#,
    )
    .unwrap();

    let uri = format!(
        "/api/registry/inspect?ref={}",
        urlencoding_path(item_path.to_str().unwrap())
    );
    let (status, body) = send(router(), Method::GET, &uri, None).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["name"], "widget");
    assert_eq!(body["category"], "acme");
}

fn urlencoding_path(path: &str) -> String {
    path.replace('/', "%2F")
}

#[tokio::test]
async fn publish_and_fetch_project_roundtrip() {
    let app = router();
    let (status, body) = send(
        app.clone(),
        Method::POST,
        "/api/project",
        Some(json!({
            "details": { "name": "demo-app", "namespace": "demo", "outputDir": "k8s" },
            "files": [{ "fileName": "web-deployment.yaml", "component": "deployment", "content": "kind: Deployment\n" }],
        })),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    let id = body["id"].as_str().unwrap().to_string();
    assert!(!id.is_empty());

    let (status, body) = send(app, Method::GET, &format!("/api/project/{id}"), None).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["details"]["name"], "demo-app");
    assert_eq!(body["files"][0]["fileName"], "web-deployment.yaml");
}

#[tokio::test]
async fn publish_without_files_is_bad_request() {
    let (status, body) = send(
        router(),
        Method::POST,
        "/api/project",
        Some(json!({
            "details": { "name": "demo-app", "namespace": "demo", "outputDir": "k8s" },
            "files": [],
        })),
    )
    .await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
    assert_eq!(body["code"], "invalid_request");
}

#[tokio::test]
async fn get_unknown_project_is_not_found() {
    let (status, body) = send(router(), Method::GET, "/api/project/does-not-exist", None).await;
    assert_eq!(status, StatusCode::NOT_FOUND);
    assert_eq!(body["code"], "not_found");
}

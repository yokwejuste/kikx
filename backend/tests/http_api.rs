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
async fn list_components_returns_all_three() {
    let (status, body) = send(router(), Method::GET, "/api/components", None).await;
    assert_eq!(status, StatusCode::OK);
    let components = body["components"].as_array().unwrap();
    let names: Vec<&str> = components.iter().map(|v| v.as_str().unwrap()).collect();
    assert_eq!(names, vec!["deployment", "service", "ingress"]);
}

#[tokio::test]
async fn project_uninitialized_returns_exists_false() {
    let tmp = tempfile::tempdir().unwrap();
    let uri = format!("/api/project?dir={}", tmp.path().display());
    let (status, body) = send(router(), Method::GET, &uri, None).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["exists"], false);
}

#[tokio::test]
async fn project_dir_must_be_absolute() {
    let (status, body) = send(
        router(),
        Method::GET,
        "/api/project?dir=relative/path",
        None,
    )
    .await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
    assert_eq!(body["code"], "invalid_request");
}

#[tokio::test]
async fn full_flow_init_preview_write_and_conflict() {
    let tmp = tempfile::tempdir().unwrap();
    let dir = tmp.path().to_string_lossy().to_string();

    let (status, body) = send(
        router(),
        Method::POST,
        "/api/project/init",
        Some(json!({ "projectDir": dir, "name": "demo" })),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["projectName"], "demo");

    let uri = format!("/api/project?dir={dir}");
    let (status, body) = send(router(), Method::GET, &uri, None).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["exists"], true);
    assert_eq!(body["project"]["name"], "demo");
    assert!(body["vendoredFiles"].as_array().unwrap().is_empty());

    let (status, body) = send(
        router(),
        Method::POST,
        "/api/project/components/preview",
        Some(json!({
            "projectDir": dir,
            "component": "deployment",
            "name": "web",
            "image": "nginx:1.27",
        })),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["written"], false);
    assert_eq!(body["outputPath"], Value::Null);
    let rendered = body["rendered"].as_str().unwrap();
    assert!(rendered.contains("image: nginx:1.27"));

    let preview_yaml_path = tmp.path().join("k8s/web-deployment.yaml");
    assert!(
        !preview_yaml_path.exists(),
        "preview must not write to disk"
    );

    let (status, body) = send(
        router(),
        Method::POST,
        "/api/project/components",
        Some(json!({
            "projectDir": dir,
            "component": "deployment",
            "name": "web",
            "image": "nginx:1.27",
        })),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["written"], true);
    assert!(preview_yaml_path.exists());

    let (status, body) = send(
        router(),
        Method::POST,
        "/api/project/components",
        Some(json!({
            "projectDir": dir,
            "component": "deployment",
            "name": "web",
            "image": "nginx:1.27",
        })),
    )
    .await;
    assert_eq!(status, StatusCode::CONFLICT);
    assert_eq!(body["code"], "already_exists");

    let (status, body) = send(router(), Method::GET, &uri, None).await;
    assert_eq!(status, StatusCode::OK);
    let vendored = body["vendoredFiles"].as_array().unwrap();
    assert_eq!(vendored.len(), 1);
    assert_eq!(vendored[0]["fileName"], "web-deployment.yaml");
}

#[tokio::test]
async fn add_before_init_returns_not_found() {
    let tmp = tempfile::tempdir().unwrap();
    let dir = tmp.path().to_string_lossy().to_string();
    let (status, body) = send(
        router(),
        Method::POST,
        "/api/project/components",
        Some(json!({
            "projectDir": dir,
            "component": "deployment",
            "name": "web",
            "image": "nginx",
        })),
    )
    .await;
    assert_eq!(status, StatusCode::NOT_FOUND);
    assert_eq!(body["code"], "not_initialized");
}

#[tokio::test]
async fn deployment_without_image_returns_bad_request() {
    let tmp = tempfile::tempdir().unwrap();
    let dir = tmp.path().to_string_lossy().to_string();
    send(
        router(),
        Method::POST,
        "/api/project/init",
        Some(json!({ "projectDir": dir, "name": "demo" })),
    )
    .await;

    let (status, body) = send(
        router(),
        Method::POST,
        "/api/project/components",
        Some(json!({ "projectDir": dir, "component": "deployment", "name": "web" })),
    )
    .await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
    assert_eq!(body["code"], "invalid_request");
}

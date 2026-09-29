mod common;

use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use common::{router, send};
use http_body_util::BodyExt;
use tower::ServiceExt;

async fn get_with_accept(uri: &str, accept: &str) -> (StatusCode, Option<String>, String, String) {
    let request = Request::builder()
        .method(Method::GET)
        .uri(uri)
        .header(header::ACCEPT, accept)
        .body(Body::empty())
        .unwrap();
    let response = router().oneshot(request).await.unwrap();
    let status = response.status();
    let location = response
        .headers()
        .get(header::LOCATION)
        .map(|value| value.to_str().unwrap().to_string());
    let content_type = response
        .headers()
        .get(header::CONTENT_TYPE)
        .map(|value| value.to_str().unwrap().to_string())
        .unwrap_or_default();
    let bytes = response.into_body().collect().await.unwrap().to_bytes();
    (
        status,
        location,
        content_type,
        String::from_utf8(bytes.to_vec()).unwrap(),
    )
}

#[tokio::test]
async fn openapi_spec_documents_every_api_route() {
    let (status, spec) = send(router(), Method::GET, "/api/openapi.json", None).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(spec["info"]["title"], "kikx API");
    assert!(spec["info"]["contact"].is_null());
    let paths = spec["paths"].as_object().unwrap();
    for path in [
        "/api/health",
        "/api/components",
        "/api/registry",
        "/api/config",
        "/api/registry/inspect",
        "/api/presets",
        "/api/presets/{name}",
        "/api/render",
    ] {
        assert!(paths.contains_key(path), "missing {path}");
    }
    assert!(paths["/api/render"]["post"].is_object());
}

#[tokio::test]
async fn render_request_example_in_the_spec_renders() {
    let (_, spec) = send(router(), Method::GET, "/api/openapi.json", None).await;
    let example = spec["components"]["schemas"]["RenderRequest"]["example"].clone();
    let (status, body) = send(router(), Method::POST, "/api/render", Some(example)).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["files"][0]["path"], "api-deployment.yaml");
}

#[tokio::test]
async fn docs_page_loads_the_spec() {
    let (status, _, content_type, html) = get_with_accept("/docs", "text/html").await;
    assert_eq!(status, StatusCode::OK);
    assert!(content_type.starts_with("text/html"));
    assert!(html.contains("/api/openapi.json"));
}

#[tokio::test]
async fn root_redirects_to_the_docs() {
    let (status, location, _, _) = get_with_accept("/", "text/html").await;
    assert!(status.is_redirection());
    assert_eq!(location.as_deref(), Some("/docs"));
}

#[tokio::test]
async fn unknown_path_returns_a_json_not_found_by_default() {
    let (status, body) = send(router(), Method::GET, "/doc", None).await;
    assert_eq!(status, StatusCode::NOT_FOUND);
    assert_eq!(body["code"], "not_found");
    assert_eq!(body["error"], "no route for GET /doc");
}

#[tokio::test]
async fn unknown_path_returns_the_not_found_page_to_browsers() {
    let (status, _, content_type, html) =
        get_with_accept("/doc", "text/html,application/xhtml+xml").await;
    assert_eq!(status, StatusCode::NOT_FOUND);
    assert!(content_type.starts_with("text/html"));
    assert!(html.contains("404"));
    assert!(html.contains("href=\"/docs\""));
}

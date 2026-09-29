mod common;

use axum::body::Body;
use axum::http::{header, Request};
use common::router;
use tower::ServiceExt;

async fn allowed_origin(origin: &str) -> Option<String> {
    let request = Request::builder()
        .uri("/api/health")
        .header(header::ORIGIN, origin)
        .body(Body::empty())
        .unwrap();
    let response = router().oneshot(request).await.unwrap();
    response
        .headers()
        .get(header::ACCESS_CONTROL_ALLOW_ORIGIN)
        .map(|v| v.to_str().unwrap().to_string())
}

#[tokio::test]
async fn loopback_origins_match_on_any_port() {
    for origin in [
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://[::1]:8080",
        "http://localhost",
    ] {
        assert_eq!(
            allowed_origin(origin).await.as_deref(),
            Some(origin),
            "{origin}"
        );
    }
    for origin in [
        "https://example.com",
        "http://localhost.evil.com:3000",
        "null",
    ] {
        assert_eq!(allowed_origin(origin).await, None, "{origin}");
    }
}

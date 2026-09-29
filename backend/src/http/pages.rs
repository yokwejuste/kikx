use axum::http::{header, HeaderMap, Method, StatusCode, Uri};
use axum::response::{Html, IntoResponse, Redirect, Response};
use axum::Json;

use super::error::ErrorDto;

pub const DOCS_PATH: &str = "/docs";

pub async fn docs() -> Html<&'static str> {
    Html(include_str!("pages/docs.html"))
}

pub async fn root() -> Redirect {
    Redirect::to(DOCS_PATH)
}

pub async fn not_found(method: Method, uri: Uri, headers: HeaderMap) -> Response {
    let wants_html = headers
        .get(header::ACCEPT)
        .and_then(|accept| accept.to_str().ok())
        .is_some_and(|accept| accept.contains("text/html"));
    if wants_html {
        return (
            StatusCode::NOT_FOUND,
            Html(include_str!("pages/not-found.html")),
        )
            .into_response();
    }
    let body = ErrorDto {
        code: "not_found",
        error: format!("no route for {method} {}", uri.path()),
    };
    (StatusCode::NOT_FOUND, Json(body)).into_response()
}

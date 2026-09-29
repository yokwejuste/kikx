use axum::http::{Method, StatusCode, Uri};
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

pub async fn not_found(method: Method, uri: Uri) -> Response {
    let body = ErrorDto {
        code: "not_found",
        error: format!("no route for {method} {}", uri.path()),
    };
    (StatusCode::NOT_FOUND, Json(body)).into_response()
}

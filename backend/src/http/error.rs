use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use kikx_core::ops::{OpsError, OpsErrorKind};
use serde::Serialize;

#[derive(Serialize)]
pub struct ErrorDto {
    pub code: String,
    pub error: String,
}

pub struct ApiError(OpsError);

impl From<OpsError> for ApiError {
    fn from(err: OpsError) -> Self {
        Self(err)
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, code) = match self.0.kind {
            OpsErrorKind::NotInitialized => (StatusCode::NOT_FOUND, "not_initialized"),
            OpsErrorKind::AlreadyExists => (StatusCode::CONFLICT, "already_exists"),
            OpsErrorKind::InvalidComponent | OpsErrorKind::MissingField => {
                (StatusCode::BAD_REQUEST, "invalid_request")
            }
            OpsErrorKind::Io | OpsErrorKind::Other => {
                (StatusCode::INTERNAL_SERVER_ERROR, "internal")
            }
        };
        (
            status,
            Json(ErrorDto {
                code: code.to_string(),
                error: self.0.to_string(),
            }),
        )
            .into_response()
    }
}

pub struct BadRequest(pub String);

impl IntoResponse for BadRequest {
    fn into_response(self) -> Response {
        (
            StatusCode::BAD_REQUEST,
            Json(ErrorDto {
                code: "invalid_request".to_string(),
                error: self.0,
            }),
        )
            .into_response()
    }
}

pub struct NotFound(pub String);

impl IntoResponse for NotFound {
    fn into_response(self) -> Response {
        (
            StatusCode::NOT_FOUND,
            Json(ErrorDto {
                code: "not_found".to_string(),
                error: self.0,
            }),
        )
            .into_response()
    }
}

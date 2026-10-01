use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use kikx_core::ops::{OpsError, OpsErrorKind};
use serde::Serialize;
use utoipa::ToSchema;

#[derive(Serialize, ToSchema)]
pub struct ErrorDto {
    #[schema(example = "not_found")]
    pub code: &'static str,
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
            OpsErrorKind::NotFound => (StatusCode::NOT_FOUND, "not_found"),
            OpsErrorKind::AlreadyExists => (StatusCode::CONFLICT, "already_exists"),
            OpsErrorKind::InvalidComponent
            | OpsErrorKind::MissingField
            | OpsErrorKind::InvalidField => (StatusCode::BAD_REQUEST, "invalid_request"),
            OpsErrorKind::Io | OpsErrorKind::Other => {
                (StatusCode::INTERNAL_SERVER_ERROR, "internal")
            }
        };
        let body = ErrorDto {
            code,
            error: self.0.to_string(),
        };
        (status, Json(body)).into_response()
    }
}

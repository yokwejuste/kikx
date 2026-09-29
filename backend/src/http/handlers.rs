use axum::extract::Query;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use kikx_core::ops;
use kikx_core::registry;

use super::dto::{
    ComponentsResponse, ConfigResponse, RegistryInspectQuery, RegistryItemDto, RegistryResponse,
    RenderRequest, RenderResponse,
};
use super::error::{ApiError, ErrorDto};

pub async fn health() -> &'static str {
    "ok"
}

pub async fn list_components() -> Json<ComponentsResponse> {
    Json(ComponentsResponse {
        components: registry::builtin::all()
            .into_iter()
            .map(|item| item.reference())
            .collect(),
    })
}

pub async fn registry() -> Json<RegistryResponse> {
    Json(RegistryResponse {
        items: registry::builtin::all()
            .into_iter()
            .map(RegistryItemDto::from)
            .collect(),
    })
}

pub async fn config() -> Json<ConfigResponse> {
    Json(ConfigResponse::current())
}

pub async fn registry_inspect(Query(query): Query<RegistryInspectQuery>) -> Response {
    match tokio::task::spawn_blocking(move || registry::resolve(&query.reference)).await {
        Ok(Ok(item)) => (StatusCode::OK, Json(RegistryItemDto::from(item))).into_response(),
        Ok(Err(e)) => super::error::BadRequest(e.to_string()).into_response(),
        Err(join_err) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorDto {
                code: "internal".to_string(),
                error: join_err.to_string(),
            }),
        )
            .into_response(),
    }
}

pub async fn render_component(Json(body): Json<RenderRequest>) -> Response {
    let params = body.into_params();
    match tokio::task::spawn_blocking(move || ops::render_component(params)).await {
        Ok(Ok(outcome)) => (StatusCode::OK, Json(RenderResponse::from(outcome))).into_response(),
        Ok(Err(e)) => ApiError::from(e).into_response(),
        Err(join_err) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorDto {
                code: "internal".to_string(),
                error: join_err.to_string(),
            }),
        )
            .into_response(),
    }
}

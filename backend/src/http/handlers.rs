use axum::extract::{Path, Query, State};
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use kikx_core::ops;
use kikx_core::registry;

use super::dto::{
    ComponentsResponse, ProjectBundleDto, PublishProjectRequest, PublishProjectResponse,
    RegistryInspectQuery, RegistryItemDto, RenderRequest, RenderResponse,
};
use super::error::{ApiError, ErrorDto, NotFound};
use super::state::AppState;

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

pub async fn publish_project(
    State(state): State<AppState>,
    Json(body): Json<PublishProjectRequest>,
) -> Response {
    if body.details.name.trim().is_empty() {
        return super::error::BadRequest("project name is required".to_string()).into_response();
    }
    if body.files.is_empty() {
        return super::error::BadRequest(
            "add at least one component before publishing".to_string(),
        )
        .into_response();
    }

    let id = state.publish(ProjectBundleDto {
        details: body.details,
        files: body.files,
    });

    (StatusCode::OK, Json(PublishProjectResponse { id })).into_response()
}

pub async fn get_project(State(state): State<AppState>, Path(id): Path<String>) -> Response {
    match state.get(&id) {
        Some(bundle) => (StatusCode::OK, Json(bundle)).into_response(),
        None => NotFound(format!("no published project with id `{id}` — it may have expired if the backend restarted since it was published")).into_response(),
    }
}

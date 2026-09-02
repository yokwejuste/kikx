use axum::extract::Query;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use kikx_core::ops::{self, OpsError};
use kikx_core::templates::Component;
use serde::Serialize;

use super::dto::{
    AddRequest, AddResponse, ComponentsResponse, InitRequest, InitResponse, ProjectQuery,
    ProjectStateDto,
};
use super::error::{ApiError, BadRequest, ErrorDto};

async fn run_blocking<T, F>(f: F) -> Response
where
    F: FnOnce() -> Result<T, OpsError> + Send + 'static,
    T: Serialize + Send + 'static,
{
    match tokio::task::spawn_blocking(f).await {
        Ok(Ok(value)) => (StatusCode::OK, Json(value)).into_response(),
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

pub async fn health() -> &'static str {
    "ok"
}

pub async fn list_components() -> Json<ComponentsResponse> {
    Json(ComponentsResponse {
        components: Component::ALL.iter().map(|c| c.name()).collect(),
    })
}

pub async fn get_project(Query(query): Query<ProjectQuery>) -> Response {
    if !query.dir.is_absolute() {
        return BadRequest(format!(
            "`dir` must be an absolute path, got `{}`",
            query.dir.display()
        ))
        .into_response();
    }
    run_blocking(move || ops::inspect_project(&query.dir).map(ProjectStateDto::from)).await
}

pub async fn init_project(Json(body): Json<InitRequest>) -> Response {
    let (project_dir, params) = body.into_params();
    if !project_dir.is_absolute() {
        return BadRequest(format!(
            "`projectDir` must be an absolute path, got `{}`",
            project_dir.display()
        ))
        .into_response();
    }
    run_blocking(move || ops::init_project(&project_dir, params).map(InitResponse::from)).await
}

pub async fn preview_component(Json(body): Json<AddRequest>) -> Response {
    let (project_dir, params) = body.into_params(true);
    if !project_dir.is_absolute() {
        return BadRequest(format!(
            "`projectDir` must be an absolute path, got `{}`",
            project_dir.display()
        ))
        .into_response();
    }
    run_blocking(move || ops::add_component(&project_dir, params).map(AddResponse::from)).await
}

pub async fn write_component(Json(body): Json<AddRequest>) -> Response {
    let (project_dir, params) = body.into_params(false);
    if !project_dir.is_absolute() {
        return BadRequest(format!(
            "`projectDir` must be an absolute path, got `{}`",
            project_dir.display()
        ))
        .into_response();
    }
    run_blocking(move || ops::add_component(&project_dir, params).map(AddResponse::from)).await
}

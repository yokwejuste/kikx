use axum::extract::Query;
use axum::Json;
use kikx_core::ops::{self, OpsError, OpsErrorKind};
use kikx_core::registry;

use super::dto::{
    ComponentsResponse, ConfigResponse, RegistryInspectQuery, RegistryItemDto, RegistryResponse,
    RenderRequest, RenderResponse,
};
use super::error::ApiError;

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

pub async fn registry_inspect(
    Query(query): Query<RegistryInspectQuery>,
) -> Result<Json<RegistryItemDto>, ApiError> {
    let item = run_blocking(move || {
        registry::resolve(&query.reference)
            .map_err(|e| OpsError::new(OpsErrorKind::InvalidComponent, e))
    })
    .await?;
    Ok(Json(item.into()))
}

pub async fn render_component(
    Json(body): Json<RenderRequest>,
) -> Result<Json<RenderResponse>, ApiError> {
    let params = body.into_params();
    let outcome = run_blocking(move || ops::render_component(params)).await?;
    Ok(Json(outcome.into()))
}

async fn run_blocking<T: Send + 'static>(
    job: impl FnOnce() -> Result<T, OpsError> + Send + 'static,
) -> Result<T, ApiError> {
    tokio::task::spawn_blocking(job)
        .await
        .map_err(|e| OpsError::new(OpsErrorKind::Other, e))?
        .map_err(ApiError::from)
}

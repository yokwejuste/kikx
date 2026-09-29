use anyhow::anyhow;
use axum::extract::{Path, Query};
use axum::Json;
use kikx_core::ops::{self, OpsError, OpsErrorKind};
use kikx_core::presets::{self, PresetManifest};
use kikx_core::registry;

use super::dto::{
    ComponentsResponse, ConfigResponse, PresetsResponse, RegistryInspectQuery, RegistryItemDto,
    RegistryResponse, RenderRequest, RenderResponse,
};
use super::error::{ApiError, ErrorDto};

#[utoipa::path(
    get,
    path = "/api/health",
    tag = "health",
    summary = "Liveness check",
    responses((status = 200, description = "The API is up", body = String, content_type = "text/plain", example = "ok"))
)]
pub async fn health() -> &'static str {
    "ok"
}

#[utoipa::path(
    get,
    path = "/api/components",
    tag = "registry",
    summary = "List built-in component references",
    responses((status = 200, body = ComponentsResponse))
)]
pub async fn list_components() -> Json<ComponentsResponse> {
    Json(ComponentsResponse {
        components: registry::builtin::all()
            .into_iter()
            .map(|item| item.reference())
            .collect(),
    })
}

#[utoipa::path(
    get,
    path = "/api/registry",
    tag = "registry",
    summary = "Every built-in component with its fields and output files",
    responses((status = 200, body = RegistryResponse))
)]
pub async fn registry() -> Json<RegistryResponse> {
    Json(RegistryResponse {
        items: registry::builtin::all()
            .into_iter()
            .map(RegistryItemDto::from)
            .collect(),
    })
}

#[utoipa::path(
    get,
    path = "/api/config",
    tag = "registry",
    summary = "Project defaults shared by the CLI, API and dashboard",
    responses((status = 200, body = ConfigResponse))
)]
pub async fn config() -> Json<ConfigResponse> {
    Json(ConfigResponse::current())
}

#[utoipa::path(
    get,
    path = "/api/presets",
    tag = "presets",
    summary = "List the built-in preset templates",
    responses((status = 200, body = PresetsResponse))
)]
pub async fn presets() -> Json<PresetsResponse> {
    Json(PresetsResponse {
        presets: presets::templates().into_iter().map(Into::into).collect(),
    })
}

#[utoipa::path(
    get,
    path = "/api/presets/{name}",
    tag = "presets",
    summary = "One preset template's full manifest",
    params(("name" = String, Path, description = "Template name", example = "multi-tier-platform")),
    responses(
        (status = 200, body = PresetManifest),
        (status = 404, description = "No template with that name", body = ErrorDto)
    )
)]
pub async fn preset(Path(name): Path<String>) -> Result<Json<PresetManifest>, ApiError> {
    presets::template(&name).map(Json).ok_or_else(|| {
        OpsError::new(
            OpsErrorKind::NotFound,
            anyhow!("no preset template named `{name}`"),
        )
        .into()
    })
}

#[utoipa::path(
    get,
    path = "/api/registry/inspect",
    tag = "registry",
    summary = "Field schema of one component: built-in reference, URL or local file",
    params(RegistryInspectQuery),
    responses(
        (status = 200, body = RegistryItemDto),
        (status = 400, description = "The reference cannot be resolved", body = ErrorDto)
    )
)]
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

#[utoipa::path(
    post,
    path = "/api/render",
    tag = "render",
    summary = "Render a component's files without writing anything",
    request_body = RenderRequest,
    responses(
        (status = 200, body = RenderResponse),
        (status = 400, description = "Unknown component or missing field", body = ErrorDto)
    )
)]
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

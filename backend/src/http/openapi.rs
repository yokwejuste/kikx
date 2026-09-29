use axum::Json;
use utoipa::OpenApi;

use super::handlers;

#[derive(OpenApi)]
#[openapi(
    info(
        title = "kikx API",
        description = "Renders kikx components and serves the component registry, project defaults and preset templates. The API is stateless: it returns rendered files and never writes to disk."
    ),
    paths(
        handlers::health,
        handlers::list_components,
        handlers::registry,
        handlers::config,
        handlers::registry_inspect,
        handlers::presets,
        handlers::preset,
        handlers::render_component,
    ),
    tags(
        (name = "health", description = "Service status"),
        (name = "registry", description = "Components, their fields and project defaults"),
        (name = "presets", description = "Ready-made project templates"),
        (name = "render", description = "Render a component to files")
    )
)]
pub struct ApiDoc;

pub async fn spec() -> Json<utoipa::openapi::OpenApi> {
    let mut document = ApiDoc::openapi();
    document.info.contact = None;
    Json(document)
}

mod dto;
mod error;
mod handlers;
mod openapi;
mod pages;

use axum::http::{header, request::Parts, HeaderValue, Method};
use axum::routing::{get, post};
use axum::Router;
use tower_http::cors::{AllowOrigin, CorsLayer};

pub enum AllowedOrigins {
    Loopback,
    List(Vec<HeaderValue>),
}

fn is_loopback_origin(origin: &HeaderValue) -> bool {
    let Ok(origin) = origin.to_str() else {
        return false;
    };
    let Some((_, rest)) = origin.split_once("://") else {
        return false;
    };
    let host = if let Some(stripped) = rest.strip_prefix('[') {
        stripped.split(']').next().unwrap_or_default()
    } else {
        rest.split(':').next().unwrap_or_default()
    };
    matches!(host, "localhost" | "127.0.0.1" | "::1")
}

pub fn build_router(allowed_origins: AllowedOrigins) -> Router {
    let allow_origin = match allowed_origins {
        AllowedOrigins::Loopback => {
            AllowOrigin::predicate(|origin: &HeaderValue, _: &Parts| is_loopback_origin(origin))
        }
        AllowedOrigins::List(list) => AllowOrigin::list(list),
    };
    let cors = CorsLayer::new()
        .allow_origin(allow_origin)
        .allow_methods([Method::GET, Method::POST])
        .allow_headers([header::CONTENT_TYPE]);

    Router::new()
        .route("/", get(pages::root))
        .route(pages::DOCS_PATH, get(pages::docs))
        .route("/api/openapi.json", get(openapi::spec))
        .route("/api/health", get(handlers::health))
        .route("/api/components", get(handlers::list_components))
        .route("/api/registry", get(handlers::registry))
        .route("/api/config", get(handlers::config))
        .route("/api/presets", get(handlers::presets))
        .route("/api/presets/{name}", get(handlers::preset))
        .route("/api/registry/inspect", get(handlers::registry_inspect))
        .route("/api/render", post(handlers::render_component))
        .fallback(pages::not_found)
        .layer(cors)
}

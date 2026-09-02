pub mod dto;
pub mod error;
pub mod handlers;
pub mod state;

use axum::http::{header, HeaderValue, Method};
use axum::routing::{get, post};
use axum::Router;
use tower_http::cors::CorsLayer;

pub use state::AppState;

pub fn default_allowed_origins() -> Vec<HeaderValue> {
    vec![
        HeaderValue::from_static("http://localhost:3000"),
        HeaderValue::from_static("http://127.0.0.1:3000"),
    ]
}

pub fn build_router(allowed_origins: Vec<HeaderValue>) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(allowed_origins)
        .allow_methods([Method::GET, Method::POST])
        .allow_headers([header::CONTENT_TYPE]);

    Router::new()
        .route("/api/health", get(handlers::health))
        .route("/api/components", get(handlers::list_components))
        .route("/api/registry/inspect", get(handlers::registry_inspect))
        .route("/api/render", post(handlers::render_component))
        .route("/api/project", post(handlers::publish_project))
        .route("/api/project/{id}", get(handlers::get_project))
        .layer(cors)
        .with_state(AppState::default())
}

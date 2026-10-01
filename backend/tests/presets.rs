mod common;

use std::collections::HashSet;

use axum::http::{Method, StatusCode};
use common::{router, send};

#[tokio::test]
async fn lists_every_preset_template_with_a_summary() {
    let (status, body) = send(router(), Method::GET, "/api/presets", None).await;
    assert_eq!(status, StatusCode::OK);
    let presets = body["presets"].as_array().unwrap();
    assert_eq!(presets.len(), kikx_core::presets::templates().len());
    let platform = presets
        .iter()
        .find(|p| p["name"] == "multi-tier-platform")
        .unwrap();
    assert_eq!(platform["title"], "Multi-tier platform");
    assert!(platform["componentCount"].as_u64().unwrap() > 30);
}

#[tokio::test]
async fn summary_lists_each_component_reference_once() {
    let (_, body) = send(router(), Method::GET, "/api/presets", None).await;
    let summary = body["presets"]
        .as_array()
        .unwrap()
        .iter()
        .find(|p| p["name"] == "single-server")
        .unwrap();
    let references: Vec<&str> = summary["references"]
        .as_array()
        .unwrap()
        .iter()
        .map(|r| r.as_str().unwrap())
        .collect();
    let unique: HashSet<&str> = references.iter().copied().collect();
    assert_eq!(unique.len(), references.len());
    let manifest = kikx_core::presets::template("single-server").unwrap();
    let expected: HashSet<&str> = manifest
        .components
        .iter()
        .map(|c| c.reference.as_str())
        .collect();
    assert_eq!(unique, expected);
}

#[tokio::test]
async fn returns_one_template_as_a_preset_manifest() {
    let (status, body) = send(router(), Method::GET, "/api/presets/k8s-web-app", None).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["name"], "k8s-web-app");
    assert_eq!(body["project"]["outputDir"], "k8s");
    assert!(!body["components"].as_array().unwrap().is_empty());
}

#[tokio::test]
async fn unknown_template_is_not_found() {
    let (status, body) = send(router(), Method::GET, "/api/presets/nope", None).await;
    assert_eq!(status, StatusCode::NOT_FOUND);
    assert_eq!(body["code"], "not_found");
}

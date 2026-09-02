use std::collections::BTreeMap;

use serde::Serialize;

#[derive(Serialize)]
pub struct DeploymentCtx {
    pub name: String,
    pub namespace: String,
    pub image: String,
    pub replicas: u32,
    pub port: u16,
    pub labels: BTreeMap<String, String>,
}

#[derive(Serialize)]
pub struct ServiceCtx {
    pub name: String,
    pub namespace: String,
    pub port: u16,
    pub target_port: u16,
    pub selector: BTreeMap<String, String>,
}

#[derive(Serialize)]
pub struct IngressCtx {
    pub name: String,
    pub namespace: String,
    pub host: String,
    pub path: String,
    pub service_name: String,
    pub service_port: u16,
}

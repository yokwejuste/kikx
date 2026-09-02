use std::collections::HashMap;

use kikx_core::ops::{RenderOutcome, RenderParams};
use kikx_core::registry::{FieldSpec, RegistryItem};
use serde::{Deserialize, Serialize};

#[derive(Serialize)]
pub struct ComponentsResponse {
    pub components: Vec<String>,
}

#[derive(Deserialize)]
pub struct RegistryInspectQuery {
    #[serde(rename = "ref")]
    pub reference: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FieldSpecDto {
    pub name: String,
    pub required: bool,
    pub default: Option<String>,
}

impl From<FieldSpec> for FieldSpecDto {
    fn from(f: FieldSpec) -> Self {
        Self {
            name: f.name,
            required: f.required,
            default: f.default,
        }
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RegistryItemDto {
    pub name: String,
    pub category: String,
    pub title: String,
    pub description: String,
    pub fields: Vec<FieldSpecDto>,
}

impl From<RegistryItem> for RegistryItemDto {
    fn from(item: RegistryItem) -> Self {
        Self {
            name: item.name,
            category: item.category,
            title: item.title,
            description: item.description,
            fields: item.fields.into_iter().map(FieldSpecDto::from).collect(),
        }
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LabelDto {
    pub key: String,
    pub value: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RenderRequest {
    pub reference: String,
    pub name: String,
    pub image: Option<String>,
    #[serde(default = "default_replicas")]
    pub replicas: u32,
    #[serde(default = "default_port")]
    pub port: u16,
    pub target_port: Option<u16>,
    pub namespace: Option<String>,
    pub host: Option<String>,
    #[serde(default = "default_path")]
    pub path: String,
    pub service: Option<String>,
    #[serde(default)]
    pub labels: Vec<LabelDto>,
    #[serde(default)]
    pub fields: HashMap<String, String>,
    #[serde(default = "default_namespace")]
    pub default_namespace: String,
}

fn default_replicas() -> u32 {
    1
}

fn default_port() -> u16 {
    80
}

fn default_path() -> String {
    "/".to_string()
}

fn default_namespace() -> String {
    "default".to_string()
}

impl RenderRequest {
    pub fn into_params(self) -> RenderParams {
        let mut fields: Vec<(String, String)> = Vec::new();
        if let Some(image) = self.image {
            fields.push(("image".to_string(), image));
        }
        fields.push(("replicas".to_string(), self.replicas.to_string()));
        fields.push(("port".to_string(), self.port.to_string()));
        if let Some(target_port) = self.target_port {
            fields.push(("target_port".to_string(), target_port.to_string()));
        }
        if let Some(namespace) = self.namespace {
            fields.push(("namespace".to_string(), namespace));
        }
        if let Some(host) = self.host {
            fields.push(("host".to_string(), host));
        }
        fields.push(("path".to_string(), self.path));
        if let Some(service) = self.service {
            fields.push(("service".to_string(), service));
        }
        fields.extend(self.fields);

        RenderParams {
            reference: self.reference,
            name: self.name,
            fields,
            labels: self.labels.into_iter().map(|l| (l.key, l.value)).collect(),
            default_namespace: self.default_namespace,
        }
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RenderedFileDto {
    pub path: String,
    pub content: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RenderResponse {
    pub component: String,
    pub files: Vec<RenderedFileDto>,
}

impl From<RenderOutcome> for RenderResponse {
    fn from(o: RenderOutcome) -> Self {
        Self {
            component: o.component,
            files: o
                .files
                .into_iter()
                .map(|f| RenderedFileDto {
                    path: f.path.display().to_string(),
                    content: f.content,
                })
                .collect(),
        }
    }
}

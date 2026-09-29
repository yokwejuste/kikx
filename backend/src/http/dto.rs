use std::collections::HashMap;

use kikx_core::ops::{RenderOutcome, RenderParams};
use kikx_core::config;
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
pub struct FieldOptionDto {
    pub value: String,
    pub label: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FieldSpecDto {
    pub name: String,
    pub required: bool,
    pub default: Option<String>,
    pub description: Option<String>,
    pub example: Option<String>,
    pub options: Vec<FieldOptionDto>,
}

impl From<FieldSpec> for FieldSpecDto {
    fn from(f: FieldSpec) -> Self {
        Self {
            name: f.name,
            required: f.required,
            default: f.default,
            description: f.description,
            example: f.example,
            options: f
                .options
                .into_iter()
                .map(|o| FieldOptionDto {
                    label: if o.label.is_empty() { o.value.clone() } else { o.label },
                    value: o.value,
                })
                .collect(),
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
    pub reference: String,
    pub fields: Vec<FieldSpecDto>,
    /// Output path templates, e.g. `{{ name }}-inventory.ini`.
    pub files: Vec<String>,
}

impl From<RegistryItem> for RegistryItemDto {
    fn from(item: RegistryItem) -> Self {
        Self {
            reference: item.reference(),
            name: item.name,
            category: item.category,
            title: item.title,
            description: item.description,
            fields: item.fields.into_iter().map(FieldSpecDto::from).collect(),
            files: item.files.into_iter().map(|f| f.path).collect(),
        }
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RegistryResponse {
    pub items: Vec<RegistryItemDto>,
}

/// Project defaults, so clients never have to repeat them.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConfigResponse {
    pub default_namespace: String,
    pub default_output_dir: String,
    pub default_project_name: String,
}

impl ConfigResponse {
    pub fn current() -> Self {
        Self {
            default_namespace: config::DEFAULT_NAMESPACE.to_string(),
            default_output_dir: config::DEFAULT_OUTPUT_DIR.to_string(),
            default_project_name: config::DEFAULT_PROJECT_NAME.to_string(),
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
    pub replicas: Option<u32>,
    pub port: Option<u16>,
    pub target_port: Option<u16>,
    pub namespace: Option<String>,
    pub host: Option<String>,
    pub path: Option<String>,
    pub service: Option<String>,
    #[serde(default)]
    pub labels: Vec<LabelDto>,
    #[serde(default)]
    pub fields: HashMap<String, String>,
    #[serde(default = "config::default_namespace")]
    pub default_namespace: String,
}

impl RenderRequest {
    pub fn into_params(self) -> RenderParams {
        let mut fields: Vec<(String, String)> = Vec::new();
        if let Some(image) = self.image {
            fields.push(("image".to_string(), image));
        }
        // Only what the caller sent: unset fields fall back to the registry's own defaults.
        if let Some(replicas) = self.replicas {
            fields.push(("replicas".to_string(), replicas.to_string()));
        }
        if let Some(port) = self.port {
            fields.push(("port".to_string(), port.to_string()));
        }
        if let Some(target_port) = self.target_port {
            fields.push(("target_port".to_string(), target_port.to_string()));
        }
        if let Some(namespace) = self.namespace {
            fields.push(("namespace".to_string(), namespace));
        }
        if let Some(host) = self.host {
            fields.push(("host".to_string(), host));
        }
        if let Some(path) = self.path {
            fields.push(("path".to_string(), path));
        }
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

use std::collections::HashMap;

use kikx_core::config;
use kikx_core::ops::{CommonFields, RenderOutcome, RenderParams};
use kikx_core::presets::PresetManifest;
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
                    label: if o.label.is_empty() {
                        o.value.clone()
                    } else {
                        o.label
                    },
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

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PresetSummaryDto {
    pub name: String,
    pub title: String,
    pub description: String,
    pub component_count: usize,
}

impl From<PresetManifest> for PresetSummaryDto {
    fn from(manifest: PresetManifest) -> Self {
        Self {
            component_count: manifest.components.len(),
            name: manifest.name,
            title: manifest.title,
            description: manifest.description,
        }
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PresetsResponse {
    pub presets: Vec<PresetSummaryDto>,
}

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
    #[serde(flatten)]
    pub common: CommonFields,
    #[serde(default)]
    pub labels: Vec<LabelDto>,
    #[serde(default)]
    pub fields: HashMap<String, String>,
    #[serde(default = "config::default_namespace")]
    pub default_namespace: String,
}

impl RenderRequest {
    pub fn into_params(self) -> RenderParams {
        RenderParams {
            reference: self.reference,
            name: self.name,
            fields: self.common.into_fields(self.fields),
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

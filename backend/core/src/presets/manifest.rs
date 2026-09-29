use std::collections::HashMap;

use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[serde(rename_all = "camelCase")]
pub struct PresetComponent {
    pub reference: String,
    pub name: String,
    #[serde(default)]
    pub fields: HashMap<String, String>,
    #[serde(default)]
    pub labels: HashMap<String, String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[serde(rename_all = "camelCase")]
pub struct PresetProject {
    #[serde(default)]
    pub name: Option<String>,
    #[serde(default = "crate::config::default_namespace")]
    pub namespace: String,
    #[serde(default = "crate::config::default_output_dir")]
    pub output_dir: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[serde(rename_all = "camelCase")]
pub struct PresetManifest {
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub title: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub project: Option<PresetProject>,
    pub components: Vec<PresetComponent>,
}

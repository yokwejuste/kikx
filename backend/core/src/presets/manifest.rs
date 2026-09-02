use std::collections::HashMap;

use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
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
#[serde(rename_all = "camelCase")]
pub struct PresetProject {
    #[serde(default)]
    pub name: Option<String>,
    pub namespace: String,
    pub output_dir: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PresetManifest {
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub project: Option<PresetProject>,
    pub components: Vec<PresetComponent>,
}

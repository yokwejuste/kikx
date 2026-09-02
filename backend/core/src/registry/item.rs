use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct FieldSpec {
    pub name: String,
    #[serde(default)]
    pub required: bool,
    #[serde(default)]
    pub default: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct RegistryItem {
    pub name: String,
    pub category: String,
    pub extension: String,
    #[serde(default)]
    pub title: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub fields: Vec<FieldSpec>,
    pub template: String,
}

impl RegistryItem {
    pub fn reference(&self) -> String {
        format!("{}/{}", self.category, self.name)
    }
}

use serde::{Deserialize, Serialize};

/// One allowed value for a field that has a fixed set of choices.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct FieldOption {
    pub value: String,
    #[serde(default)]
    pub label: String,
}

/// Everything a UI needs to render a field — defaults, examples and choices live here, in the
/// registry, so neither the CLI nor the dashboard has to repeat them.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct FieldSpec {
    pub name: String,
    #[serde(default)]
    pub required: bool,
    #[serde(default)]
    pub default: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
    /// A sample value shown as a hint; never used as a value.
    #[serde(default)]
    pub example: Option<String>,
    #[serde(default)]
    pub options: Vec<FieldOption>,
}

impl FieldSpec {
    pub fn new(name: &str) -> Self {
        Self {
            name: name.to_string(),
            required: false,
            default: None,
            description: None,
            example: None,
            options: Vec::new(),
        }
    }

    pub fn required(mut self) -> Self {
        self.required = true;
        self
    }

    pub fn default_value(mut self, value: &str) -> Self {
        self.default = Some(value.to_string());
        self
    }

    pub fn describe(mut self, text: &str) -> Self {
        self.description = Some(text.to_string());
        self
    }

    pub fn example(mut self, value: &str) -> Self {
        self.example = Some(value.to_string());
        self
    }

    pub fn options(mut self, options: &[(&str, &str)]) -> Self {
        self.options = options
            .iter()
            .map(|(value, label)| FieldOption {
                value: value.to_string(),
                label: label.to_string(),
            })
            .collect();
        self
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct RegistryFile {
    pub path: String,
    pub template: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct RegistryItem {
    pub name: String,
    pub category: String,
    #[serde(default)]
    pub title: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub fields: Vec<FieldSpec>,
    pub files: Vec<RegistryFile>,
}

impl RegistryItem {
    pub fn reference(&self) -> String {
        format!("{}/{}", self.category, self.name)
    }
}

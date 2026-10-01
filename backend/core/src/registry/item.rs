use serde::{Deserialize, Serialize};

use crate::net::{self, NetError};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct FieldOption {
    pub value: String,
    #[serde(default)]
    pub label: String,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[serde(rename_all = "lowercase")]
pub enum FieldFormat {
    Ip,
    Cidr,
}

impl FieldFormat {
    pub fn name(self) -> &'static str {
        match self {
            Self::Ip => "ip",
            Self::Cidr => "cidr",
        }
    }

    pub fn normalize(self, value: &str) -> Result<String, NetError> {
        match self {
            Self::Ip => net::parse_address(value).map(|address| address.to_string()),
            Self::Cidr => net::parse_range(value).map(|range| range.to_string()),
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct FieldSpec {
    pub name: String,
    #[serde(default)]
    pub required: bool,
    #[serde(default)]
    pub default: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub example: Option<String>,
    #[serde(default)]
    pub options: Vec<FieldOption>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub format: Option<FieldFormat>,
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
            format: None,
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

    pub fn format(mut self, format: FieldFormat) -> Self {
        self.format = Some(format);
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

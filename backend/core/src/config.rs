use std::path::{Path, PathBuf};

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};

pub const CONFIG_FILE_NAME: &str = "kikx.toml";

/// Shared by the CLI, the HTTP API and (through `/api/config`) the web dashboard.
pub const DEFAULT_NAMESPACE: &str = "default";
pub const DEFAULT_OUTPUT_DIR: &str = "k8s";
pub const DEFAULT_PROJECT_NAME: &str = "kikx-project";

#[derive(Serialize, Deserialize)]
pub struct KikxConfig {
    pub project: ProjectConfig,
}

#[derive(Serialize, Deserialize)]
pub struct ProjectConfig {
    pub name: String,
    #[serde(default = "default_namespace")]
    pub default_namespace: String,
    #[serde(default = "default_output_dir")]
    pub output_dir: String,
}

pub fn default_namespace() -> String {
    DEFAULT_NAMESPACE.to_string()
}

pub fn default_output_dir() -> String {
    DEFAULT_OUTPUT_DIR.to_string()
}

impl KikxConfig {
    pub fn config_path(cwd: &Path) -> PathBuf {
        cwd.join(CONFIG_FILE_NAME)
    }

    pub fn load(cwd: &Path) -> Result<Self> {
        let path = Self::config_path(cwd);
        let text = std::fs::read_to_string(&path).with_context(|| {
            format!(
                "no {CONFIG_FILE_NAME} found in {} — run `kikx init` first",
                cwd.display()
            )
        })?;
        toml::from_str(&text).with_context(|| format!("failed to parse {}", path.display()))
    }

    pub fn save(&self, cwd: &Path) -> Result<()> {
        let path = Self::config_path(cwd);
        let text = toml::to_string_pretty(self).context("failed to serialize kikx.toml")?;
        std::fs::write(&path, text).with_context(|| format!("failed to write {}", path.display()))
    }
}

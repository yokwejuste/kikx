use std::path::{Path, PathBuf};

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};

pub const CONFIG_FILE_NAME: &str = "kikx.toml";

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

fn default_namespace() -> String {
    "default".to_string()
}

fn default_output_dir() -> String {
    "k8s".to_string()
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

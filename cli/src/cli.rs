use std::path::PathBuf;

use clap::{Args, Parser, Subcommand};

#[derive(Parser)]
#[command(
    name = "kikx",
    version,
    about = "Vendor real, editable Kubernetes manifests into your project"
)]
pub struct Cli {
    #[command(subcommand)]
    pub command: Commands,
}

#[derive(Subcommand)]
pub enum Commands {
    /// Initialize a kikx project in the current directory
    Init(InitArgs),
    /// Vendor a component's rendered manifest into the project
    Add(AddArgs),
    /// List available components
    List,
}

#[derive(Args)]
pub struct InitArgs {
    /// Project name; defaults to the current directory's name
    #[arg(long)]
    pub name: Option<String>,

    /// Output directory for vendored manifests
    #[arg(long, default_value = "k8s")]
    pub dir: PathBuf,

    /// Default namespace recorded in kikx.toml
    #[arg(long, default_value = "default")]
    pub namespace: String,

    /// Overwrite an existing kikx.toml
    #[arg(long)]
    pub force: bool,
}

#[derive(Args)]
pub struct AddArgs {
    /// Component to vendor, e.g. "deployment" or "k8s/deployment"
    pub component: String,

    #[arg(long)]
    pub name: String,

    /// Required for the deployment component
    #[arg(long)]
    pub image: Option<String>,

    #[arg(long, default_value_t = 1)]
    pub replicas: u32,

    #[arg(long, default_value_t = 80)]
    pub port: u16,

    /// Service only; defaults to --port
    #[arg(long)]
    pub target_port: Option<u16>,

    /// Overrides the project's default namespace
    #[arg(long)]
    pub namespace: Option<String>,

    /// Ingress only; defaults to "<name>.example.com"
    #[arg(long)]
    pub host: Option<String>,

    /// Ingress only
    #[arg(long, default_value = "/")]
    pub path: String,

    /// Ingress only; backend service name, defaults to --name
    #[arg(long)]
    pub service: Option<String>,

    /// Extra labels as KEY=VALUE, repeatable
    #[arg(long = "label", value_parser = parse_key_val)]
    pub labels: Vec<(String, String)>,

    /// Overwrite an existing output file
    #[arg(long)]
    pub force: bool,
}

fn parse_key_val(s: &str) -> Result<(String, String), String> {
    s.split_once('=')
        .map(|(k, v)| (k.to_string(), v.to_string()))
        .ok_or_else(|| format!("expected KEY=VALUE, got `{s}`"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_key_val_splits_on_first_equals() {
        assert_eq!(
            parse_key_val("tier=backend").unwrap(),
            ("tier".to_string(), "backend".to_string())
        );
    }

    #[test]
    fn parse_key_val_rejects_missing_equals() {
        assert!(parse_key_val("no-equals-here").is_err());
    }
}

use std::path::PathBuf;

use clap::{Args, Parser, Subcommand};
use kikx_core::config::{DEFAULT_NAMESPACE, DEFAULT_OUTPUT_DIR};

#[derive(Parser)]
#[command(
    name = "kikx",
    version,
    about = "Vendor real, editable infrastructure files into your project"
)]
pub struct Cli {
    #[command(subcommand)]
    pub command: Commands,
}

#[derive(Subcommand)]
pub enum Commands {
    Init(InitArgs),
    Add(AddArgs),
    List,
    Setup(SetupArgs),
    Apply(ApplyArgs),
}

#[derive(Args)]
pub struct InitArgs {
    #[arg(long)]
    pub name: Option<String>,

    #[arg(long, default_value = DEFAULT_OUTPUT_DIR)]
    pub dir: PathBuf,

    #[arg(long, default_value = DEFAULT_NAMESPACE)]
    pub namespace: String,

    #[arg(long)]
    pub force: bool,
}

#[derive(Args)]
pub struct AddArgs {
    pub reference: String,

    #[arg(long)]
    pub name: String,

    #[arg(long)]
    pub image: Option<String>,

    #[arg(long, help = "Replicas (default from the registry, see `kikx list`)")]
    pub replicas: Option<u32>,

    #[arg(long)]
    pub port: Option<u16>,

    #[arg(long)]
    pub target_port: Option<u16>,

    #[arg(long)]
    pub namespace: Option<String>,

    #[arg(long)]
    pub host: Option<String>,

    #[arg(long)]
    pub path: Option<String>,

    #[arg(long)]
    pub service: Option<String>,

    #[arg(long = "label", value_parser = parse_key_val)]
    pub labels: Vec<(String, String)>,

    #[arg(long = "set", value_parser = parse_key_val)]
    pub set: Vec<(String, String)>,

    #[arg(long)]
    pub force: bool,
}

#[derive(Args)]
pub struct SetupArgs {
    pub reference: String,

    #[arg(long)]
    pub force: bool,
}

#[derive(Args)]
pub struct ApplyArgs {
    pub reference: String,

    #[arg(long)]
    pub into: Option<PathBuf>,

    #[arg(long)]
    pub force: bool,
}

fn parse_key_val(s: &str) -> Result<(String, String), String> {
    s.split_once('=')
        .map(|(k, v)| (k.to_string(), v.to_string()))
        .ok_or_else(|| format!("expected KEY=VALUE, got `{s}`"))
}

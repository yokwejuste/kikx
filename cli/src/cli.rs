use std::path::PathBuf;

use clap::{Args, Parser, Subcommand};
use kikx_core::config::{DEFAULT_NAMESPACE, DEFAULT_OUTPUT_DIR};

use crate::style;

pub const BANNER: &str = concat!(
    "██      ▄██▀\n",
    "██    ▄██▀\n",
    "██  ▄██▀       kikx ",
    env!("CARGO_PKG_VERSION"),
    "\n",
    "██▄██▀         Vendor real, editable infrastructure files into your project\n",
    "██▀ ▀██▄\n",
    "██    ▀██▄▄▄  ●",
);

#[derive(Parser)]
#[command(
    name = "kikx",
    version,
    about = "Vendor real, editable infrastructure files into your project",
    before_help = BANNER,
    help_template = "{before-help}{usage-heading} {usage}\n\n{all-args}{after-help}",
    arg_required_else_help = true,
    styles = style::help_styles()
)]
pub struct Cli {
    #[command(subcommand)]
    pub command: Commands,
}

#[derive(Subcommand)]
pub enum Commands {
    #[command(about = "Create kikx.toml in the current directory")]
    Init(InitArgs),
    #[command(about = "Render a component and write its files into the project")]
    Add(AddArgs),
    #[command(about = "List the built-in components with their fields")]
    List,
    #[command(about = "List the built-in preset templates")]
    Presets,
    #[command(about = "Bootstrap a new project from a preset template, file or URL")]
    Setup(SetupArgs),
    #[command(about = "Vendor a preset template, file or URL into an existing project")]
    Apply(ApplyArgs),
    #[command(about = "Upgrade kikx to the latest release")]
    Upgrade(UpgradeArgs),
}

#[derive(Args)]
pub struct UpgradeArgs {
    #[arg(short = 'c', long, help = "Only report whether a newer release exists")]
    pub check: bool,

    #[arg(
        short = 'v',
        long,
        help = "Install this release instead of the latest, for example 0.2.0"
    )]
    pub version: Option<String>,
}

#[derive(Args)]
pub struct InitArgs {
    #[arg(short = 'n', long)]
    pub name: Option<String>,

    #[arg(short = 'd', long, default_value = DEFAULT_OUTPUT_DIR)]
    pub dir: PathBuf,

    #[arg(short = 'N', long, default_value = DEFAULT_NAMESPACE)]
    pub namespace: String,

    #[arg(short = 'f', long)]
    pub force: bool,
}

#[derive(Args)]
pub struct AddArgs {
    pub reference: String,

    #[arg(short = 'n', long)]
    pub name: String,

    #[arg(short = 'i', long)]
    pub image: Option<String>,

    #[arg(
        short = 'r',
        long,
        help = "Replicas (default from the registry, see `kikx list`)"
    )]
    pub replicas: Option<u32>,

    #[arg(short = 'p', long)]
    pub port: Option<u16>,

    #[arg(short = 't', long)]
    pub target_port: Option<u16>,

    #[arg(short = 'N', long)]
    pub namespace: Option<String>,

    #[arg(short = 'H', long)]
    pub host: Option<String>,

    #[arg(short = 'P', long)]
    pub path: Option<String>,

    #[arg(short = 'S', long)]
    pub service: Option<String>,

    #[arg(short = 'l', long = "label", value_parser = parse_key_val)]
    pub labels: Vec<(String, String)>,

    #[arg(short = 's', long = "set", value_parser = parse_key_val)]
    pub set: Vec<(String, String)>,

    #[arg(short = 'f', long)]
    pub force: bool,
}

#[derive(Args)]
pub struct SetupArgs {
    pub reference: String,

    #[arg(short = 'f', long)]
    pub force: bool,
}

#[derive(Args)]
pub struct ApplyArgs {
    pub reference: String,

    #[arg(short = 'i', long)]
    pub into: Option<PathBuf>,

    #[arg(short = 'f', long)]
    pub force: bool,
}

fn parse_key_val(s: &str) -> Result<(String, String), String> {
    s.split_once('=')
        .map(|(k, v)| (k.to_string(), v.to_string()))
        .ok_or_else(|| format!("expected KEY=VALUE, got `{s}`"))
}

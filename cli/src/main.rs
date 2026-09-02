use clap::Parser;
use kikx::cli::Cli;

fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();
    kikx::run(cli)
}

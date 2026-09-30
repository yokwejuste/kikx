pub mod cli;
mod commands;
mod style;

use cli::{Cli, Commands};

pub fn run(cli: Cli) -> anyhow::Result<()> {
    match cli.command {
        Commands::Init(args) => commands::init::run(args),
        Commands::Add(args) => commands::add::run(args),
        Commands::List => commands::list::run(),
        Commands::Presets => commands::presets::run(),
        Commands::Setup(args) => commands::setup::run(args),
        Commands::Apply(args) => commands::apply::run(args),
        Commands::Upgrade(args) => commands::upgrade::run(args),
    }
}

pub mod cli;
pub mod commands;

use cli::{Cli, Commands};

pub fn run(cli: Cli) -> anyhow::Result<()> {
    match cli.command {
        Commands::Init(args) => commands::init::run(args),
        Commands::Add(args) => commands::add::run(args),
        Commands::List => commands::list::run(),
    }
}

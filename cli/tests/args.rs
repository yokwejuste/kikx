use clap::Parser;
use kikx::cli::{Cli, Commands};

fn parse_labels(label: &str) -> Result<Vec<(String, String)>, clap::Error> {
    let cli = Cli::try_parse_from([
        "kikx",
        "add",
        "k8s/deployment",
        "--name",
        "web",
        "--label",
        label,
    ])?;
    match cli.command {
        Commands::Add(args) => Ok(args.fields.labels),
        _ => unreachable!("parsed an `add` command"),
    }
}

#[test]
fn key_val_splits_on_first_equals() {
    assert_eq!(
        parse_labels("tier=backend").unwrap(),
        vec![("tier".to_string(), "backend".to_string())]
    );
}

#[test]
fn key_val_rejects_missing_equals() {
    let err = parse_labels("no-equals-here").unwrap_err();
    assert!(err.to_string().contains("expected KEY=VALUE"));
}

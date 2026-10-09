use anyhow::{bail, Result};
use kikx_core::ops::{self, DiffTarget, FileChange};
use similar::{ChangeTag, TextDiff};

use crate::cli::DiffArgs;
use crate::style::{heading, hint, paint, removed, success, volt};

pub fn run(args: DiffArgs) -> Result<()> {
    let cwd = super::current_dir()?;
    let (fields, labels) = args.fields.into_fields_and_labels();

    let target = match args.name {
        Some(name) => DiffTarget::Component {
            reference: args.reference,
            name,
            fields,
            labels,
        },
        None if fields.is_empty() && labels.is_empty() => DiffTarget::Bundle {
            reference: args.reference,
            into: args.into,
        },
        None => bail!("field and label flags need --name, which marks REFERENCE as a component"),
    };

    let diffs = ops::diff_project(&cwd, target)?;
    let (mut added, mut modified, mut unchanged) = (0, 0, 0);
    for diff in &diffs {
        let path = diff.path.strip_prefix(&cwd).unwrap_or(&diff.path).display();
        match &diff.change {
            FileChange::Added => {
                added += 1;
                anstream::println!("{} {path}", paint(success(), "Added    "));
            }
            FileChange::Unchanged => {
                unchanged += 1;
                anstream::println!("{}", paint(hint(), format!("Unchanged {path}")));
            }
            FileChange::Modified { current } => {
                modified += 1;
                anstream::println!("{} {path}", paint(heading(), "Modified "));
                print_patch(current, &diff.incoming);
            }
        }
    }

    anstream::println!(
        "\n{added} added, {modified} modified, {unchanged} unchanged. Nothing was written."
    );
    Ok(())
}

fn print_patch(current: &str, incoming: &str) {
    let text = TextDiff::from_lines(current, incoming);
    for hunk in text.unified_diff().context_radius(3).iter_hunks() {
        anstream::println!("{}", paint(volt(), hunk.header()));
        for change in hunk.iter_changes() {
            let line = change.to_string_lossy();
            let line = line.trim_end_matches('\n');
            match change.tag() {
                ChangeTag::Delete => anstream::println!("{}", paint(removed(), format!("-{line}"))),
                ChangeTag::Insert => anstream::println!("{}", paint(success(), format!("+{line}"))),
                ChangeTag::Equal => anstream::println!(" {line}"),
            }
        }
    }
}

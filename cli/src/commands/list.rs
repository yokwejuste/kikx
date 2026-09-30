use anyhow::Result;
use kikx_core::registry;

use crate::style::{heading, hint, paint, volt};

pub fn run() -> Result<()> {
    anstream::println!("{}", paint(heading(), "Available components:"));
    for item in registry::builtin::all() {
        anstream::println!();
        anstream::println!(
            "  {}: {}",
            paint(volt(), item.reference()),
            paint(hint(), &item.description)
        );
        for field in &item.fields {
            let mut notes: Vec<String> = Vec::new();
            if field.required {
                notes.push("required".to_string());
            }
            if let Some(default) = field.default.as_deref().filter(|d| !d.is_empty()) {
                notes.push(format!("default {default}"));
            }
            if let Some(example) = &field.example {
                notes.push(format!("e.g. {example}"));
            }
            if !field.options.is_empty() {
                let values: Vec<&str> = field.options.iter().map(|o| o.value.as_str()).collect();
                notes.push(format!("one of {}", values.join(", ")));
            }
            let notes = if notes.is_empty() {
                String::new()
            } else {
                format!("  {}", paint(hint(), format!("({})", notes.join("; "))))
            };
            anstream::println!("      --set {}=…{notes}", field.name);
        }
    }
    anstream::println!();
    anstream::println!(
        "{}",
        paint(
            hint(),
            "You can also `kikx add <url>` or `kikx add <path-to-registry-item.json>`."
        )
    );
    Ok(())
}

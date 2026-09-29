use anyhow::Result;
use kikx_core::registry;

pub fn run() -> Result<()> {
    println!("Available components:");
    for item in registry::builtin::all() {
        println!();
        println!("  {}: {}", item.reference(), item.description);
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
                format!("  ({})", notes.join("; "))
            };
            println!("      --set {}=…{notes}", field.name);
        }
    }
    println!();
    println!("You can also `kikx add <url>` or `kikx add <path-to-registry-item.json>`.");
    Ok(())
}

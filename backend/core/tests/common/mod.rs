#![allow(dead_code)]

use std::path::{Path, PathBuf};

use kikx_core::ops::{render_component, OpsError, RenderOutcome, RenderParams};

pub fn try_render(
    reference: &str,
    name: &str,
    fields: &[(&str, &str)],
) -> Result<RenderOutcome, OpsError> {
    render_component(RenderParams {
        reference: reference.to_string(),
        name: name.to_string(),
        fields: fields
            .iter()
            .map(|(k, v)| (k.to_string(), v.to_string()))
            .collect(),
        labels: vec![],
        default_namespace: "default".to_string(),
    })
}

pub fn render(reference: &str, name: &str, fields: &[(&str, &str)]) -> RenderOutcome {
    try_render(reference, name, fields).unwrap()
}

pub fn write_file(dir: &Path, file_name: &str, contents: &str) -> String {
    let path: PathBuf = dir.join(file_name);
    std::fs::write(&path, contents).unwrap();
    path.to_str().unwrap().to_string()
}

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

use anyhow::{anyhow, Context};
use minijinja::{Environment, Value};

use super::error::{OpsError, OpsErrorKind};
use crate::config::KikxConfig;
use crate::registry;

pub struct RenderParams {
    pub reference: String,
    pub name: String,
    pub fields: Vec<(String, String)>,
    pub labels: Vec<(String, String)>,
    pub default_namespace: String,
}

pub struct RenderOutcome {
    pub component: String,
    pub extension: String,
    pub rendered: String,
}

pub fn render_component(params: RenderParams) -> Result<RenderOutcome, OpsError> {
    let item = registry::resolve(&params.reference)
        .map_err(|e| OpsError::new(OpsErrorKind::InvalidComponent, e))?;

    let supplied: BTreeMap<&str, &str> = params
        .fields
        .iter()
        .map(|(k, v)| (k.as_str(), v.as_str()))
        .collect();

    let mut ctx: BTreeMap<String, Value> = BTreeMap::new();
    ctx.insert("name".to_string(), Value::from(params.name.clone()));
    ctx.insert(
        "namespace".to_string(),
        Value::from(
            supplied
                .get("namespace")
                .map(|v| v.to_string())
                .unwrap_or(params.default_namespace),
        ),
    );

    for field in &item.fields {
        if field.name == "namespace" {
            continue;
        }
        let value = supplied
            .get(field.name.as_str())
            .map(|v| v.to_string())
            .or_else(|| field.default.clone());
        match value {
            Some(value) => {
                ctx.insert(field.name.clone(), Value::from(value));
            }
            None if field.required => {
                return Err(OpsError::new(
                    OpsErrorKind::MissingField,
                    anyhow!("--{} is required for {}", field.name, item.reference()),
                ));
            }
            None => {}
        }
    }
    for (key, value) in &supplied {
        ctx.entry((*key).to_string())
            .or_insert_with(|| Value::from(*value));
    }

    let mut labels: BTreeMap<String, String> = params.labels.iter().cloned().collect();
    labels
        .entry("app".to_string())
        .or_insert_with(|| params.name.clone());
    ctx.insert("labels".to_string(), Value::from_serialize(&labels));

    let mut env = Environment::new();
    env.set_keep_trailing_newline(true);
    let rendered = env
        .render_str(&item.template, &ctx)
        .map_err(|e| OpsError::new(OpsErrorKind::Other, e.into()))?;

    Ok(RenderOutcome {
        component: item.name,
        extension: item.extension,
        rendered,
    })
}

pub struct AddParams {
    pub reference: String,
    pub name: String,
    pub fields: Vec<(String, String)>,
    pub labels: Vec<(String, String)>,
    pub force: bool,
    pub dry_run: bool,
}

pub struct AddOutcome {
    pub component: String,
    pub rendered: String,
    pub output_path: Option<PathBuf>,
    pub written: bool,
}

pub fn add_component(project_dir: &Path, params: AddParams) -> Result<AddOutcome, OpsError> {
    let config = KikxConfig::load(project_dir)
        .map_err(|e| OpsError::new(OpsErrorKind::NotInitialized, e))?;

    let outcome = render_component(RenderParams {
        reference: params.reference,
        name: params.name.clone(),
        fields: params.fields,
        labels: params.labels,
        default_namespace: config.project.default_namespace.clone(),
    })?;

    if params.dry_run {
        return Ok(AddOutcome {
            component: outcome.component,
            rendered: outcome.rendered,
            output_path: None,
            written: false,
        });
    }

    let output_dir = project_dir.join(&config.project.output_dir);
    std::fs::create_dir_all(&output_dir)
        .with_context(|| format!("failed to create output directory {}", output_dir.display()))
        .map_err(|e| OpsError::new(OpsErrorKind::Io, e))?;

    let output_path = output_dir.join(format!(
        "{}-{}.{}",
        params.name, outcome.component, outcome.extension
    ));
    if output_path.exists() && !params.force {
        return Err(OpsError::new(
            OpsErrorKind::AlreadyExists,
            anyhow!(
                "{} already exists — pass --force to overwrite",
                output_path.display()
            ),
        ));
    }

    std::fs::write(&output_path, &outcome.rendered)
        .with_context(|| format!("failed to write {}", output_path.display()))
        .map_err(|e| OpsError::new(OpsErrorKind::Io, e))?;

    Ok(AddOutcome {
        component: outcome.component,
        rendered: outcome.rendered,
        output_path: Some(output_path),
        written: true,
    })
}

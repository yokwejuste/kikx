use std::collections::{BTreeMap, HashSet};
use std::path::{Path, PathBuf};

use anyhow::anyhow;
use minijinja::{Environment, Value};

use super::error::{OpsError, OpsErrorKind, OrKind};
use super::manifest::write_all;
use crate::config::KikxConfig;
use crate::registry::{self, FieldSpec, RegistryItem};

pub struct RenderParams {
    pub reference: String,
    pub name: String,
    pub fields: Vec<(String, String)>,
    pub labels: Vec<(String, String)>,
    pub default_namespace: String,
}

#[derive(Debug)]
pub struct RenderedFile {
    pub path: PathBuf,
    pub content: String,
}

#[derive(Debug)]
pub struct RenderOutcome {
    pub component: String,
    pub files: Vec<RenderedFile>,
}

fn field_value(raw: &str) -> Value {
    let trimmed = raw.trim_start();
    if trimmed.starts_with('[') || trimmed.starts_with('{') {
        if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(raw) {
            return Value::from_serialize(&parsed);
        }
    }
    Value::from(raw)
}

fn checked_value(
    item: &RegistryItem,
    field: &FieldSpec,
    value: String,
) -> Result<String, OpsError> {
    match field.format {
        Some(format) if !value.trim().is_empty() => format.normalize(&value).map_err(|err| {
            OpsError::new(
                OpsErrorKind::InvalidField,
                anyhow!("field `{}` of {}: {err}", field.name, item.reference()),
            )
        }),
        _ => Ok(value),
    }
}

pub fn render_component(params: RenderParams) -> Result<RenderOutcome, OpsError> {
    let item = registry::resolve(&params.reference).or_kind(OpsErrorKind::InvalidComponent)?;

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
                .map(ToString::to_string)
                .unwrap_or(params.default_namespace),
        ),
    );

    for field in &item.fields {
        if field.name == "namespace" {
            continue;
        }
        let value = supplied
            .get(field.name.as_str())
            .map(ToString::to_string)
            .or_else(|| field.default.clone());
        match value {
            Some(value) => {
                let value = checked_value(&item, field, value)?;
                ctx.insert(field.name.clone(), field_value(&value));
            }
            None if field.required => {
                return Err(OpsError::new(
                    OpsErrorKind::MissingField,
                    anyhow!(
                        "field `{}` is required for {}",
                        field.name,
                        item.reference()
                    ),
                ));
            }
            None => {}
        }
    }
    for (key, value) in &supplied {
        ctx.entry((*key).to_string())
            .or_insert_with(|| field_value(value));
    }

    let mut labels: BTreeMap<String, String> = params.labels.iter().cloned().collect();
    labels
        .entry("app".to_string())
        .or_insert_with(|| params.name.clone());
    ctx.insert("labels".to_string(), Value::from_serialize(&labels));

    let mut env = Environment::new();
    env.set_keep_trailing_newline(true);

    let mut files = Vec::with_capacity(item.files.len());
    let mut seen_paths = HashSet::new();
    for registry_file in &item.files {
        let path_str = env
            .render_str(&registry_file.path, &ctx)
            .or_kind(OpsErrorKind::Other)?;
        let content = env
            .render_str(&registry_file.template, &ctx)
            .or_kind(OpsErrorKind::Other)?;
        let path = PathBuf::from(path_str);
        if !seen_paths.insert(path.clone()) {
            return Err(OpsError::new(
                OpsErrorKind::InvalidComponent,
                anyhow!(
                    "{} has two files that both render to `{}`",
                    item.reference(),
                    path.display()
                ),
            ));
        }
        files.push(RenderedFile { path, content });
    }

    Ok(RenderOutcome {
        component: item.name,
        files,
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

#[derive(Debug)]
pub struct AddOutcome {
    pub component: String,
    pub files: Vec<RenderedFile>,
    pub written: bool,
}

pub fn add_component(project_dir: &Path, params: AddParams) -> Result<AddOutcome, OpsError> {
    let config = KikxConfig::load(project_dir).or_kind(OpsErrorKind::NotInitialized)?;

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
            files: outcome.files,
            written: false,
        });
    }

    let output_dir = project_dir.join(&config.project.output_dir);
    write_all(&output_dir, &outcome.files, params.force)?;

    let files = outcome
        .files
        .into_iter()
        .map(|f| RenderedFile {
            path: output_dir.join(&f.path),
            content: f.content,
        })
        .collect();

    Ok(AddOutcome {
        component: outcome.component,
        files,
        written: true,
    })
}

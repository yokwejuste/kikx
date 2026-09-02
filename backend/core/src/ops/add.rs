use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

use anyhow::{anyhow, Context};

use super::error::{OpsError, OpsErrorKind};
use crate::config::KikxConfig;
use crate::context::{DeploymentCtx, IngressCtx, ServiceCtx};
use crate::templates::{self, Component};

pub struct AddParams {
    pub component: String,
    pub name: String,
    pub image: Option<String>,
    pub replicas: u32,
    pub port: u16,
    pub target_port: Option<u16>,
    pub namespace: Option<String>,
    pub host: Option<String>,
    pub path: String,
    pub service: Option<String>,
    pub labels: Vec<(String, String)>,
    pub force: bool,
    pub dry_run: bool,
}

pub struct AddOutcome {
    pub component: &'static str,
    pub rendered: String,
    pub output_path: Option<PathBuf>,
    pub written: bool,
}

pub fn add_component(project_dir: &Path, params: AddParams) -> Result<AddOutcome, OpsError> {
    let config = KikxConfig::load(project_dir)
        .map_err(|e| OpsError::new(OpsErrorKind::NotInitialized, e))?;
    let component = Component::parse(&params.component)
        .map_err(|e| OpsError::new(OpsErrorKind::InvalidComponent, e))?;

    let namespace = params
        .namespace
        .clone()
        .unwrap_or_else(|| config.project.default_namespace.clone());
    let mut labels: BTreeMap<String, String> = params.labels.iter().cloned().collect();
    labels
        .entry("app".to_string())
        .or_insert_with(|| params.name.clone());

    let rendered = match component {
        Component::Deployment => {
            let Some(image) = params.image.clone() else {
                return Err(OpsError::new(
                    OpsErrorKind::MissingField,
                    anyhow!("--image is required for k8s/deployment"),
                ));
            };
            templates::render(
                component,
                &DeploymentCtx {
                    name: params.name.clone(),
                    namespace,
                    image,
                    replicas: params.replicas,
                    port: params.port,
                    labels,
                },
            )
        }
        Component::Service => {
            let mut selector: BTreeMap<String, String> = params.labels.iter().cloned().collect();
            selector
                .entry("app".to_string())
                .or_insert_with(|| params.name.clone());
            templates::render(
                component,
                &ServiceCtx {
                    name: params.name.clone(),
                    namespace,
                    port: params.port,
                    target_port: params.target_port.unwrap_or(params.port),
                    selector,
                },
            )
        }
        Component::Ingress => {
            let host = params
                .host
                .clone()
                .unwrap_or_else(|| format!("{}.example.com", params.name));
            let service_name = params
                .service
                .clone()
                .unwrap_or_else(|| params.name.clone());
            templates::render(
                component,
                &IngressCtx {
                    name: params.name.clone(),
                    namespace,
                    host,
                    path: params.path.clone(),
                    service_name,
                    service_port: params.port,
                },
            )
        }
    }
    .map_err(|e| OpsError::new(OpsErrorKind::Other, e))?;

    if params.dry_run {
        return Ok(AddOutcome {
            component: component.name(),
            rendered,
            output_path: None,
            written: false,
        });
    }

    let output_dir = project_dir.join(&config.project.output_dir);
    std::fs::create_dir_all(&output_dir)
        .with_context(|| format!("failed to create output directory {}", output_dir.display()))
        .map_err(|e| OpsError::new(OpsErrorKind::Io, e))?;

    let output_path = output_dir.join(format!("{}-{}.yaml", params.name, component.name()));
    if output_path.exists() && !params.force {
        return Err(OpsError::new(
            OpsErrorKind::AlreadyExists,
            anyhow!(
                "{} already exists — pass --force to overwrite",
                output_path.display()
            ),
        ));
    }

    std::fs::write(&output_path, &rendered)
        .with_context(|| format!("failed to write {}", output_path.display()))
        .map_err(|e| OpsError::new(OpsErrorKind::Io, e))?;

    Ok(AddOutcome {
        component: component.name(),
        rendered,
        output_path: Some(output_path),
        written: true,
    })
}

use std::path::PathBuf;

use kikx_core::ops::{
    AddOutcome, AddParams, InitOutcome, InitParams, ProjectState, ProjectSummary, VendoredFile,
};
use serde::{Deserialize, Serialize};

#[derive(Serialize)]
pub struct ComponentsResponse {
    pub components: Vec<&'static str>,
}

#[derive(Deserialize)]
pub struct ProjectQuery {
    pub dir: PathBuf,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LabelDto {
    pub key: String,
    pub value: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectSummaryDto {
    pub name: String,
    pub default_namespace: String,
    pub output_dir: String,
}

impl From<ProjectSummary> for ProjectSummaryDto {
    fn from(s: ProjectSummary) -> Self {
        Self {
            name: s.name,
            default_namespace: s.default_namespace,
            output_dir: s.output_dir,
        }
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VendoredFileDto {
    pub file_name: String,
    pub component: String,
    pub name: String,
}

impl From<VendoredFile> for VendoredFileDto {
    fn from(f: VendoredFile) -> Self {
        Self {
            file_name: f.file_name,
            component: f.component,
            name: f.name,
        }
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectStateDto {
    pub exists: bool,
    pub project: Option<ProjectSummaryDto>,
    pub vendored_files: Vec<VendoredFileDto>,
}

impl From<ProjectState> for ProjectStateDto {
    fn from(s: ProjectState) -> Self {
        Self {
            exists: s.exists,
            project: s.project.map(ProjectSummaryDto::from),
            vendored_files: s
                .vendored_files
                .into_iter()
                .map(VendoredFileDto::from)
                .collect(),
        }
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InitRequest {
    pub project_dir: PathBuf,
    pub name: Option<String>,
    #[serde(default = "default_output_dir")]
    pub dir: PathBuf,
    #[serde(default = "default_namespace")]
    pub namespace: String,
    #[serde(default)]
    pub force: bool,
}

fn default_output_dir() -> PathBuf {
    PathBuf::from("k8s")
}

fn default_namespace() -> String {
    "default".to_string()
}

impl InitRequest {
    pub fn into_params(self) -> (PathBuf, InitParams) {
        (
            self.project_dir,
            InitParams {
                name: self.name,
                dir: self.dir,
                namespace: self.namespace,
                force: self.force,
            },
        )
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InitResponse {
    pub project_name: String,
    pub config_path: PathBuf,
    pub output_dir: PathBuf,
}

impl From<InitOutcome> for InitResponse {
    fn from(o: InitOutcome) -> Self {
        Self {
            project_name: o.project_name,
            config_path: o.config_path,
            output_dir: o.output_dir,
        }
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddRequest {
    pub project_dir: PathBuf,
    pub component: String,
    pub name: String,
    pub image: Option<String>,
    #[serde(default = "default_replicas")]
    pub replicas: u32,
    #[serde(default = "default_port")]
    pub port: u16,
    pub target_port: Option<u16>,
    pub namespace: Option<String>,
    pub host: Option<String>,
    #[serde(default = "default_path")]
    pub path: String,
    pub service: Option<String>,
    #[serde(default)]
    pub labels: Vec<LabelDto>,
    #[serde(default)]
    pub force: bool,
}

fn default_replicas() -> u32 {
    1
}

fn default_port() -> u16 {
    80
}

fn default_path() -> String {
    "/".to_string()
}

impl AddRequest {
    pub fn into_params(self, dry_run: bool) -> (PathBuf, AddParams) {
        (
            self.project_dir,
            AddParams {
                component: self.component,
                name: self.name,
                image: self.image,
                replicas: self.replicas,
                port: self.port,
                target_port: self.target_port,
                namespace: self.namespace,
                host: self.host,
                path: self.path,
                service: self.service,
                labels: self.labels.into_iter().map(|l| (l.key, l.value)).collect(),
                force: self.force,
                dry_run,
            },
        )
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AddResponse {
    pub component: &'static str,
    pub rendered: String,
    pub output_path: Option<PathBuf>,
    pub written: bool,
}

impl From<AddOutcome> for AddResponse {
    fn from(o: AddOutcome) -> Self {
        Self {
            component: o.component,
            rendered: o.rendered,
            output_path: o.output_path,
            written: o.written,
        }
    }
}

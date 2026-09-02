use std::path::{Path, PathBuf};

use anyhow::{anyhow, Context};
use serde::Deserialize;

use super::error::{OpsError, OpsErrorKind};
use crate::config::{KikxConfig, ProjectConfig, CONFIG_FILE_NAME};

#[derive(Deserialize, Debug)]
struct ProjectBundlePayload {
    details: ProjectDetailsPayload,
    files: Vec<ProjectFilePayload>,
}

#[derive(Deserialize, Debug)]
struct ProjectDetailsPayload {
    name: String,
    namespace: String,
    #[serde(rename = "outputDir")]
    output_dir: String,
}

#[derive(Deserialize, Debug)]
struct ProjectFilePayload {
    #[serde(rename = "fileName")]
    file_name: String,
    content: String,
}

pub struct SetupParams {
    pub reference: String,
    pub force: bool,
}

#[derive(Debug)]
pub struct SetupOutcome {
    pub project_name: String,
    pub output_dir: PathBuf,
    pub files_written: Vec<PathBuf>,
}

pub fn setup_project(project_dir: &Path, params: SetupParams) -> Result<SetupOutcome, OpsError> {
    let bundle = fetch_bundle(&params.reference)?;

    let config_path = KikxConfig::config_path(project_dir);
    if config_path.exists() && !params.force {
        return Err(OpsError::new(
            OpsErrorKind::AlreadyExists,
            anyhow!(
                "{CONFIG_FILE_NAME} already exists in {} — pass --force to overwrite",
                project_dir.display()
            ),
        ));
    }

    let output_dir = project_dir.join(&bundle.details.output_dir);
    std::fs::create_dir_all(&output_dir)
        .with_context(|| format!("failed to create output directory {}", output_dir.display()))
        .map_err(|e| OpsError::new(OpsErrorKind::Io, e))?;

    let config = KikxConfig {
        project: ProjectConfig {
            name: bundle.details.name.clone(),
            default_namespace: bundle.details.namespace,
            output_dir: bundle.details.output_dir,
        },
    };
    config
        .save(project_dir)
        .map_err(|e| OpsError::new(OpsErrorKind::Io, e))?;

    let mut files_written = Vec::with_capacity(bundle.files.len());
    for file in bundle.files {
        let path = output_dir.join(&file.file_name);
        std::fs::write(&path, &file.content)
            .with_context(|| format!("failed to write {}", path.display()))
            .map_err(|e| OpsError::new(OpsErrorKind::Io, e))?;
        files_written.push(path);
    }

    Ok(SetupOutcome {
        project_name: bundle.details.name,
        output_dir,
        files_written,
    })
}

fn fetch_bundle(reference: &str) -> Result<ProjectBundlePayload, OpsError> {
    if !(reference.starts_with("http://") || reference.starts_with("https://")) {
        return Err(OpsError::new(
            OpsErrorKind::InvalidComponent,
            anyhow!(
                "`{reference}` isn't a URL — pass the exact `kikx setup <url>` command the \
                 dashboard's \"Get CLI command\" button gave you"
            ),
        ));
    }

    let body: String = ureq::get(reference)
        .call()
        .with_context(|| format!("failed to fetch published project from {reference}"))
        .map_err(|e| OpsError::new(OpsErrorKind::Other, e))?
        .body_mut()
        .read_to_string()
        .with_context(|| format!("failed to read response body from {reference}"))
        .map_err(|e| OpsError::new(OpsErrorKind::Other, e))?;

    serde_json::from_str(&body)
        .with_context(|| {
            format!(
                "{reference} did not return a published project — it may have expired \
                 if the backend restarted since you published it"
            )
        })
        .map_err(|e| OpsError::new(OpsErrorKind::Other, e))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::{Read, Write};
    use std::net::TcpListener;

    fn serve_once(body: &'static str) -> String {
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let addr = listener.local_addr().unwrap();
        std::thread::spawn(move || {
            let (mut stream, _) = listener.accept().unwrap();
            let mut buf = [0u8; 1024];
            let _ = stream.read(&mut buf);
            let response = format!(
                "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                body.len(),
                body
            );
            let _ = stream.write_all(response.as_bytes());
        });
        format!("http://{addr}")
    }

    #[test]
    fn rejects_non_url_reference() {
        let err = fetch_bundle("./local-path.json").unwrap_err();
        assert!(err.to_string().contains("isn't a URL"));
    }

    #[test]
    fn setup_writes_config_and_files_from_fetched_bundle() {
        let body = r#"{"details":{"name":"demo-app","namespace":"demo","outputDir":"k8s"},"files":[{"fileName":"web-deployment.yaml","component":"deployment","content":"kind: Deployment\n"}]}"#;
        let url = serve_once(body);

        let tmp = tempfile::tempdir().unwrap();
        let outcome = setup_project(
            tmp.path(),
            SetupParams {
                reference: url,
                force: false,
            },
        )
        .unwrap();

        assert_eq!(outcome.project_name, "demo-app");
        assert_eq!(outcome.files_written.len(), 1);

        let config = std::fs::read_to_string(tmp.path().join("kikx.toml")).unwrap();
        assert!(config.contains("name = \"demo-app\""));
        assert!(config.contains("default_namespace = \"demo\""));

        let file = std::fs::read_to_string(tmp.path().join("k8s/web-deployment.yaml")).unwrap();
        assert_eq!(file, "kind: Deployment\n");
    }

    #[test]
    fn setup_refuses_to_overwrite_existing_config_without_force() {
        let body = r#"{"details":{"name":"demo-app","namespace":"demo","outputDir":"k8s"},"files":[]}"#;
        let tmp = tempfile::tempdir().unwrap();
        std::fs::write(tmp.path().join(CONFIG_FILE_NAME), "existing").unwrap();

        let err = setup_project(
            tmp.path(),
            SetupParams {
                reference: serve_once(body),
                force: false,
            },
        )
        .unwrap_err();

        assert_eq!(err.kind, OpsErrorKind::AlreadyExists);
    }
}

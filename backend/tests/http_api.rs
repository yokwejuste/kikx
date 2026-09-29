mod common;

use axum::http::{Method, StatusCode};
use common::{router, send};
use serde_json::{json, Value};

fn file_content<'a>(files: &'a Value, path: &str) -> &'a str {
    files
        .as_array()
        .unwrap()
        .iter()
        .find(|f| f["path"] == path)
        .unwrap_or_else(|| panic!("no rendered file at `{path}`"))["content"]
        .as_str()
        .unwrap()
}

#[tokio::test]
async fn health_ok() {
    let (status, _) = send(router(), Method::GET, "/api/health", None).await;
    assert_eq!(status, StatusCode::OK);
}

#[tokio::test]
async fn list_components_returns_all_builtins() {
    let (status, body) = send(router(), Method::GET, "/api/components", None).await;
    assert_eq!(status, StatusCode::OK);
    let components = body["components"].as_array().unwrap();
    let names: Vec<&str> = components.iter().map(|v| v.as_str().unwrap()).collect();
    assert_eq!(
        names,
        vec![
            "k8s/deployment",
            "k8s/service",
            "k8s/ingress",
            "terraform/digitalocean",
            "terraform/hetzner",
            "ansible/k8s-bootstrap",
            "ansible/inventory",
            "ansible/group-vars",
            "ansible/common-role",
            "ansible/role",
            "ansible/playbook",
            "ansible/site",
            "ansible/config",
        ]
    );
}

#[tokio::test]
async fn render_deployment_happy_path() {
    let (status, body) = send(
        router(),
        Method::POST,
        "/api/render",
        Some(json!({
            "reference": "k8s/deployment",
            "name": "web",
            "image": "nginx:1.27",
            "replicas": 3,
        })),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["component"], "deployment");
    let files = body["files"].as_array().unwrap();
    assert_eq!(files.len(), 1);
    assert_eq!(files[0]["path"], "web-deployment.yaml");
    let rendered = file_content(&body["files"], "web-deployment.yaml");
    assert!(rendered.contains("image: nginx:1.27"));
    assert!(rendered.contains("replicas: 3"));
    assert!(rendered.contains("namespace: default"));
}

#[tokio::test]
async fn render_deployment_without_image_is_bad_request() {
    let (status, body) = send(
        router(),
        Method::POST,
        "/api/render",
        Some(json!({ "reference": "k8s/deployment", "name": "web" })),
    )
    .await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
    assert_eq!(body["code"], "invalid_request");
    assert!(body["error"].as_str().unwrap().contains("--image"));
}

#[tokio::test]
async fn render_unknown_reference_is_bad_request() {
    let (status, body) = send(
        router(),
        Method::POST,
        "/api/render",
        Some(json!({ "reference": "k8s/bogus", "name": "web" })),
    )
    .await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
    assert_eq!(body["code"], "invalid_request");
}

#[tokio::test]
async fn render_terraform_component_via_generic_fields_and_custom_namespace() {
    let (status, body) = send(
        router(),
        Method::POST,
        "/api/render",
        Some(json!({
            "reference": "terraform/digitalocean",
            "name": "control-plane",
            "defaultNamespace": "platform",
            "fields": { "region": "nyc3", "size": "s-2vcpu-4gb", "os_image": "ubuntu-22-04-x64", "count": "2" },
        })),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["component"], "digitalocean");
    assert_eq!(body["files"][0]["path"], "control-plane-digitalocean.tf");
    let rendered = file_content(&body["files"], "control-plane-digitalocean.tf");
    assert!(rendered.contains("count  = 2"));
    assert!(rendered.contains("region = \"nyc3\""));
    assert!(!rendered.contains("platform"));
}

#[tokio::test]
async fn render_ansible_playbook() {
    let (status, body) = send(
        router(),
        Method::POST,
        "/api/render",
        Some(json!({
            "reference": "ansible/k8s-bootstrap",
            "name": "cluster",
            "fields": { "hosts": "control_plane", "k8s_version": "1.31" },
        })),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    let rendered = file_content(&body["files"], "cluster-k8s-bootstrap.yml");
    assert!(rendered.contains("hosts: control_plane"));
    assert!(rendered.contains("kubelet=1.31*"));
}

#[tokio::test]
async fn render_ansible_inventory_for_an_existing_server() {
    let (status, body) = send(
        router(),
        Method::POST,
        "/api/render",
        Some(json!({
            "reference": "ansible/inventory",
            "name": "my-vps",
            "fields": { "hosts": r#"[{"group":"control_plane","members":[{"name":"my-vps","ansible_host":"203.0.113.10"}]}]"# },
        })),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["files"][0]["path"], "my-vps-inventory.ini");
    let rendered = file_content(&body["files"], "my-vps-inventory.ini");
    assert!(rendered.contains("[control_plane]"));
    assert!(rendered.contains("my-vps ansible_host=203.0.113.10 ansible_user=root ansible_port=22"));
    assert!(!rendered.contains("ansible_ssh_private_key_file"));
}

#[tokio::test]
async fn render_ansible_inventory_without_hosts_is_bad_request() {
    let (status, body) = send(
        router(),
        Method::POST,
        "/api/render",
        Some(json!({
            "reference": "ansible/inventory",
            "name": "my-vps",
            "fields": {},
        })),
    )
    .await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
    assert!(body["error"].as_str().unwrap().contains("--hosts"));
}

#[tokio::test]
async fn render_ansible_inventory_with_multiple_groups_and_hosts() {
    let (status, body) = send(
        router(),
        Method::POST,
        "/api/render",
        Some(json!({
            "reference": "ansible/inventory",
            "name": "cluster",
            "fields": { "hosts": json!([
                { "group": "k8s_control_plane", "members": [
                    { "name": "cp-01", "ansible_host": "10.0.0.1" },
                ] },
                { "group": "k8s_workers", "members": [
                    { "name": "worker-01", "ansible_host": "10.0.1.1", "ansible_port": 2222 },
                ] },
            ]).to_string() },
        })),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    let rendered = file_content(&body["files"], "cluster-inventory.ini");
    assert!(rendered.contains("[k8s_control_plane]"));
    assert!(rendered.contains("cp-01 ansible_host=10.0.0.1 ansible_user=root ansible_port=22"));
    assert!(rendered.contains("[k8s_workers]"));
    assert!(
        rendered.contains("worker-01 ansible_host=10.0.1.1 ansible_user=root ansible_port=2222")
    );
}

#[tokio::test]
async fn render_ansible_inventory_with_children_and_vars_groups() {
    let (status, body) = send(
        router(),
        Method::POST,
        "/api/render",
        Some(json!({
            "reference": "ansible/inventory",
            "name": "cluster",
            "fields": { "hosts": json!([
                { "group": "k8s_control_plane", "members": [{ "name": "cp-01", "ansible_host": "10.0.0.1" }] },
                { "group": "k8s", "children": ["k8s_control_plane"] },
                { "group": "platform", "children": ["k8s"], "vars": { "ansible_user": "ops-admin" } },
            ]).to_string() },
        })),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    let rendered = file_content(&body["files"], "cluster-inventory.ini");
    assert!(rendered.contains("[k8s:children]"));
    assert!(rendered.contains("k8s_control_plane"));
    assert!(rendered.contains("[platform:children]"));
    assert!(rendered.contains("[platform:vars]"));
    assert!(rendered.contains("ansible_user=ops-admin"));
}

#[tokio::test]
async fn render_common_role_returns_all_four_files() {
    let (status, body) = send(
        router(),
        Method::POST,
        "/api/render",
        Some(json!({
            "reference": "ansible/common-role",
            "name": "web",
            "fields": { "timezone": "Etc/UTC" },
        })),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    let files = body["files"].as_array().unwrap();
    assert_eq!(files.len(), 4);
    let paths: Vec<&str> = files.iter().map(|f| f["path"].as_str().unwrap()).collect();
    assert!(paths.contains(&"roles/web/tasks/main.yml"));
    assert!(paths.contains(&"roles/web/defaults/main.yml"));
    assert!(paths.contains(&"roles/web/handlers/main.yml"));
    assert!(paths.contains(&"roles/web/templates/motd.j2"));

    let tasks = file_content(&body["files"], "roles/web/tasks/main.yml");
    assert!(tasks.contains("name: \"Etc/UTC\""));

    let motd = file_content(&body["files"], "roles/web/templates/motd.j2");
    assert!(motd.contains("Host: web"));
    assert!(motd.contains("{{ motd_message }}"));
}

#[tokio::test]
async fn render_group_vars_writes_group_vars_yaml() {
    let (status, body) = send(
        router(),
        Method::POST,
        "/api/render",
        Some(json!({
            "reference": "ansible/group-vars",
            "name": "web",
            "fields": { "group": "web", "vars": r#"{"app_port":"8080","env":"production"}"# },
        })),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["files"][0]["path"], "group_vars/web.yml");
    let rendered = file_content(&body["files"], "group_vars/web.yml");
    assert!(rendered.contains("app_port: 8080"));
    assert!(rendered.contains("env: production"));
}

#[tokio::test]
async fn render_playbook_assigns_roles_to_a_group() {
    let (status, body) = send(
        router(),
        Method::POST,
        "/api/render",
        Some(json!({
            "reference": "ansible/playbook",
            "name": "web-site",
            "fields": { "hosts": "web", "roles": r#"["hygiene","nginx"]"# },
        })),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["files"][0]["path"], "web-site.yml");
    let rendered = file_content(&body["files"], "web-site.yml");
    assert!(rendered.contains("hosts: web"));
    assert!(rendered.contains("- hygiene"));
    assert!(rendered.contains("- nginx"));
}

#[tokio::test]
async fn registry_inspect_returns_field_schema_for_builtin() {
    let uri = "/api/registry/inspect?ref=terraform/digitalocean";
    let (status, body) = send(router(), Method::GET, uri, None).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["name"], "digitalocean");
    assert_eq!(body["category"], "terraform");
    let field_names: Vec<&str> = body["fields"]
        .as_array()
        .unwrap()
        .iter()
        .map(|f| f["name"].as_str().unwrap())
        .collect();
    assert!(field_names.contains(&"region"));
}

#[tokio::test]
async fn registry_inspect_from_local_file() {
    let tmp = tempfile::tempdir().unwrap();
    let item_path = tmp.path().join("custom.json");
    std::fs::write(
        &item_path,
        r#"{"name":"widget","category":"acme","fields":[{"name":"color","required":true}],"files":[{"path":"{{ name }}.txt","template":"{{ color }}"}]}"#,
    )
    .unwrap();

    let uri = format!(
        "/api/registry/inspect?ref={}",
        urlencoding_path(item_path.to_str().unwrap())
    );
    let (status, body) = send(router(), Method::GET, &uri, None).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["name"], "widget");
    assert_eq!(body["category"], "acme");
}

fn urlencoding_path(path: &str) -> String {
    path.replace('/', "%2F")
}

#[tokio::test]
async fn registry_exposes_field_metadata_and_output_paths() {
    let (status, body) = send(router(), Method::GET, "/api/registry", None).await;
    assert_eq!(status, StatusCode::OK);
    let items = body["items"].as_array().unwrap();
    let hetzner = items
        .iter()
        .find(|i| i["reference"] == "terraform/hetzner")
        .unwrap();
    let os_image = hetzner["fields"]
        .as_array()
        .unwrap()
        .iter()
        .find(|f| f["name"] == "os_image")
        .unwrap();
    assert!(!os_image["options"].as_array().unwrap().is_empty());
    assert_eq!(os_image["default"], os_image["options"][0]["value"]);
    assert_eq!(hetzner["files"][0], "{{ name }}-hetzner.tf");
}

#[tokio::test]
async fn config_exposes_project_defaults() {
    let (status, body) = send(router(), Method::GET, "/api/config", None).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(
        body["defaultNamespace"],
        kikx_core::config::DEFAULT_NAMESPACE
    );
    assert_eq!(
        body["defaultOutputDir"],
        kikx_core::config::DEFAULT_OUTPUT_DIR
    );
}

#[tokio::test]
async fn omitted_fields_fall_back_to_registry_defaults() {
    let port_default = kikx_core::registry::builtin::lookup("k8s/service")
        .unwrap()
        .fields
        .into_iter()
        .find(|f| f.name == "port")
        .and_then(|f| f.default)
        .unwrap();
    let (status, body) = send(
        router(),
        Method::POST,
        "/api/render",
        Some(json!({ "reference": "k8s/service", "name": "web" })),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    let rendered = file_content(&body["files"], "web-service.yaml");
    assert!(rendered.contains(&format!("port: {port_default}")));
}

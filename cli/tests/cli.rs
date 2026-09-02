use assert_cmd::Command;
use predicates::str::contains;

fn kikx() -> Command {
    Command::cargo_bin("kikx").unwrap()
}

#[test]
fn init_creates_config_and_output_dir() {
    let tmp = tempfile::tempdir().unwrap();
    kikx()
        .current_dir(&tmp)
        .args(["init", "--name", "demo"])
        .assert()
        .success();

    assert!(tmp.path().join("kikx.toml").exists());
    assert!(tmp.path().join("k8s").is_dir());
    let config = std::fs::read_to_string(tmp.path().join("kikx.toml")).unwrap();
    assert!(config.contains("demo"));
}

#[test]
fn init_twice_without_force_fails() {
    let tmp = tempfile::tempdir().unwrap();
    kikx()
        .current_dir(&tmp)
        .args(["init", "--name", "demo"])
        .assert()
        .success();
    kikx()
        .current_dir(&tmp)
        .args(["init", "--name", "demo"])
        .assert()
        .failure()
        .stderr(contains("--force"));
}

#[test]
fn init_twice_with_force_succeeds() {
    let tmp = tempfile::tempdir().unwrap();
    kikx()
        .current_dir(&tmp)
        .args(["init", "--name", "demo"])
        .assert()
        .success();
    kikx()
        .current_dir(&tmp)
        .args(["init", "--name", "demo", "--force"])
        .assert()
        .success();
}

#[test]
fn add_before_init_fails() {
    let tmp = tempfile::tempdir().unwrap();
    kikx()
        .current_dir(&tmp)
        .args([
            "add",
            "k8s/deployment",
            "--name",
            "myapp",
            "--image",
            "nginx",
        ])
        .assert()
        .failure()
        .stderr(contains("kikx init"));
}

#[test]
fn add_deployment_happy_path() {
    let tmp = tempfile::tempdir().unwrap();
    kikx()
        .current_dir(&tmp)
        .args(["init", "--name", "demo"])
        .assert()
        .success();
    kikx()
        .current_dir(&tmp)
        .args([
            "add",
            "k8s/deployment",
            "--name",
            "myapp",
            "--image",
            "nginx:1.27",
            "--replicas",
            "3",
            "--port",
            "8080",
        ])
        .assert()
        .success();

    let path = tmp.path().join("k8s/myapp-deployment.yaml");
    let text = std::fs::read_to_string(&path).unwrap();
    assert!(text.contains("replicas: 3"));
    assert!(text.contains("image: nginx:1.27"));

    let doc: serde_yaml_ng::Value =
        serde_yaml_ng::from_str(&text).expect("rendered file must be valid YAML");
    assert_eq!(doc["kind"].as_str(), Some("Deployment"));
    assert_eq!(doc["spec"]["replicas"].as_i64(), Some(3));
}

#[test]
fn add_deployment_without_image_fails() {
    let tmp = tempfile::tempdir().unwrap();
    kikx()
        .current_dir(&tmp)
        .args(["init", "--name", "demo"])
        .assert()
        .success();
    kikx()
        .current_dir(&tmp)
        .args(["add", "k8s/deployment", "--name", "myapp"])
        .assert()
        .failure()
        .stderr(contains("--image"));
}

#[test]
fn add_service_defaults_target_port_and_matches_deployment_selector() {
    let tmp = tempfile::tempdir().unwrap();
    kikx()
        .current_dir(&tmp)
        .args(["init", "--name", "demo"])
        .assert()
        .success();
    kikx()
        .current_dir(&tmp)
        .args([
            "add",
            "k8s/deployment",
            "--name",
            "myapp",
            "--image",
            "nginx",
        ])
        .assert()
        .success();
    kikx()
        .current_dir(&tmp)
        .args(["add", "k8s/service", "--name", "myapp", "--port", "80"])
        .assert()
        .success();

    let text = std::fs::read_to_string(tmp.path().join("k8s/myapp-service.yaml")).unwrap();
    let doc: serde_yaml_ng::Value = serde_yaml_ng::from_str(&text).unwrap();
    assert_eq!(doc["spec"]["ports"][0]["targetPort"].as_i64(), Some(80));
    assert_eq!(doc["spec"]["selector"]["app"].as_str(), Some("myapp"));
}

#[test]
fn add_ingress_defaults_host() {
    let tmp = tempfile::tempdir().unwrap();
    kikx()
        .current_dir(&tmp)
        .args(["init", "--name", "demo"])
        .assert()
        .success();
    kikx()
        .current_dir(&tmp)
        .args(["add", "k8s/ingress", "--name", "myapp"])
        .assert()
        .success();

    let text = std::fs::read_to_string(tmp.path().join("k8s/myapp-ingress.yaml")).unwrap();
    assert!(text.contains("host: myapp.example.com"));
}

#[test]
fn add_collision_requires_force() {
    let tmp = tempfile::tempdir().unwrap();
    kikx()
        .current_dir(&tmp)
        .args(["init", "--name", "demo"])
        .assert()
        .success();
    kikx()
        .current_dir(&tmp)
        .args([
            "add",
            "k8s/deployment",
            "--name",
            "myapp",
            "--image",
            "nginx",
        ])
        .assert()
        .success();
    kikx()
        .current_dir(&tmp)
        .args([
            "add",
            "k8s/deployment",
            "--name",
            "myapp",
            "--image",
            "nginx",
        ])
        .assert()
        .failure()
        .stderr(contains("--force"));
    kikx()
        .current_dir(&tmp)
        .args([
            "add",
            "k8s/deployment",
            "--name",
            "myapp",
            "--image",
            "nginx:new",
            "--force",
        ])
        .assert()
        .success();
    let text = std::fs::read_to_string(tmp.path().join("k8s/myapp-deployment.yaml")).unwrap();
    assert!(text.contains("nginx:new"));
}

#[test]
fn add_unknown_component_fails() {
    let tmp = tempfile::tempdir().unwrap();
    kikx()
        .current_dir(&tmp)
        .args(["init", "--name", "demo"])
        .assert()
        .success();
    kikx()
        .current_dir(&tmp)
        .args(["add", "k8s/bogus", "--name", "myapp"])
        .assert()
        .failure()
        .stderr(contains("kikx list"));
}

#[test]
fn list_shows_all_components() {
    kikx()
        .arg("list")
        .assert()
        .success()
        .stdout(contains("k8s/deployment"))
        .stdout(contains("k8s/service"))
        .stdout(contains("k8s/ingress"))
        .stdout(contains("terraform/digitalocean"))
        .stdout(contains("terraform/hetzner"));
}

#[test]
fn add_digitalocean_server_happy_path() {
    let tmp = tempfile::tempdir().unwrap();
    kikx()
        .current_dir(&tmp)
        .args(["init", "--name", "demo"])
        .assert()
        .success();
    kikx()
        .current_dir(&tmp)
        .args([
            "add",
            "terraform/digitalocean",
            "--name",
            "control-plane",
            "--set",
            "region=nyc3",
            "--set",
            "size=s-2vcpu-4gb",
            "--set",
            "os_image=ubuntu-22-04-x64",
            "--set",
            "count=2",
        ])
        .assert()
        .success();

    let path = tmp.path().join("k8s/control-plane-digitalocean.tf");
    let text = std::fs::read_to_string(&path).unwrap();
    assert!(text.contains("count  = 2"));
    assert!(text.contains("region = \"nyc3\""));
    assert!(text.contains("resource \"digitalocean_droplet\" \"control-plane\""));
}

#[test]
fn add_ansible_bootstrap_playbook_happy_path() {
    let tmp = tempfile::tempdir().unwrap();
    kikx()
        .current_dir(&tmp)
        .args(["init", "--name", "demo"])
        .assert()
        .success();
    kikx()
        .current_dir(&tmp)
        .args([
            "add",
            "ansible/k8s-bootstrap",
            "--name",
            "cluster",
            "--set",
            "hosts=control_plane",
            "--set",
            "k8s_version=1.31",
        ])
        .assert()
        .success();

    let path = tmp.path().join("k8s/cluster-k8s-bootstrap.yml");
    let text = std::fs::read_to_string(&path).unwrap();
    assert!(text.contains("hosts: control_plane"));
    assert!(text.contains("kubelet=1.31*"));
}

#[test]
fn add_terraform_missing_region_fails() {
    let tmp = tempfile::tempdir().unwrap();
    kikx()
        .current_dir(&tmp)
        .args(["init", "--name", "demo"])
        .assert()
        .success();
    kikx()
        .current_dir(&tmp)
        .args([
            "add",
            "terraform/hetzner",
            "--name",
            "worker",
            "--set",
            "size=cx21",
            "--set",
            "os_image=ubuntu-22.04",
        ])
        .assert()
        .failure()
        .stderr(contains("--region"));
}

#[test]
fn add_custom_component_from_local_file() {
    let tmp = tempfile::tempdir().unwrap();
    kikx()
        .current_dir(&tmp)
        .args(["init", "--name", "demo"])
        .assert()
        .success();

    let item_path = tmp.path().join("custom-item.json");
    std::fs::write(
        &item_path,
        r#"{
            "name": "acme-widget",
            "category": "acme",
            "extension": "txt",
            "fields": [{"name": "color", "required": true}],
            "template": "widget {{ name }} is {{ color }}"
        }"#,
    )
    .unwrap();

    kikx()
        .current_dir(&tmp)
        .args([
            "add",
            item_path.to_str().unwrap(),
            "--name",
            "gadget",
            "--set",
            "color=blue",
        ])
        .assert()
        .success();

    let text = std::fs::read_to_string(tmp.path().join("k8s/gadget-acme-widget.txt")).unwrap();
    assert_eq!(text, "widget gadget is blue");
}

#[test]
fn setup_with_non_url_reference_fails() {
    let tmp = tempfile::tempdir().unwrap();
    kikx()
        .current_dir(&tmp)
        .args(["setup", "./not-a-url"])
        .assert()
        .failure()
        .stderr(contains("isn't a URL"));
}

#[test]
fn add_ansible_inventory_for_an_existing_server() {
    let tmp = tempfile::tempdir().unwrap();
    kikx()
        .current_dir(&tmp)
        .args(["init", "--name", "demo"])
        .assert()
        .success();
    kikx()
        .current_dir(&tmp)
        .args([
            "add",
            "ansible/inventory",
            "--name",
            "my-vps",
            "--set",
            "group=control_plane",
            "--set",
            "ansible_host=203.0.113.10",
        ])
        .assert()
        .success();

    let path = tmp.path().join("k8s/my-vps-inventory.ini");
    let text = std::fs::read_to_string(&path).unwrap();
    assert!(text.contains("[control_plane]"));
    assert!(text.contains("ansible_host=203.0.113.10"));
    assert!(text.contains("ansible_user=root"));
}

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
        .stdout(contains("deployment"))
        .stdout(contains("service"))
        .stdout(contains("ingress"));
}

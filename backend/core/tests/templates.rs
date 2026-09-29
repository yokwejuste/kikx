use std::path::Path;

use kikx_core::ops::{apply_bundle, ApplyParams};
use kikx_core::presets::{template, templates};

fn apply(name: &str) -> (tempfile::TempDir, Vec<String>) {
    let tmp = tempfile::tempdir().unwrap();
    let outcome = apply_bundle(
        tmp.path(),
        ApplyParams {
            reference: name.to_string(),
            into: None,
            force: false,
        },
    )
    .unwrap_or_else(|e| panic!("{name}: {e}"));
    let files = outcome
        .files_written
        .iter()
        .map(|f| f.strip_prefix(tmp.path()).unwrap().display().to_string())
        .collect();
    (tmp, files)
}

fn read(root: &Path, file: &str) -> String {
    std::fs::read_to_string(root.join(file)).unwrap()
}

#[test]
fn every_template_has_a_title_description_and_resolves_by_name() {
    let all = templates();
    assert_eq!(all.len(), 5);
    for manifest in all {
        assert!(!manifest.title.is_empty(), "{} has no title", manifest.name);
        assert!(
            !manifest.description.is_empty(),
            "{} has no description",
            manifest.name
        );
        assert!(template(&manifest.name).is_some());
        let (_tmp, files) = apply(&manifest.name);
        assert!(!files.is_empty(), "{} rendered nothing", manifest.name);
    }
}

#[test]
fn ansible_templates_ship_an_ansible_cfg_and_a_site_playbook() {
    for name in [
        "single-server",
        "kubeadm-cluster",
        "web-and-database",
        "multi-tier-platform",
    ] {
        let (tmp, files) = apply(name);
        assert!(files.contains(&"ansible.cfg".to_string()), "{name}");
        assert!(files.contains(&"site.yml".to_string()), "{name}");
        assert!(
            read(tmp.path(), "ansible.cfg").contains("roles_path = roles"),
            "{name}"
        );
    }
}

#[test]
fn k8s_web_app_template_renders_three_deployments_wired_to_services() {
    let (tmp, files) = apply("k8s-web-app");
    assert_eq!(files.len(), 7);
    assert!(read(tmp.path(), "frontend-ingress.yaml").contains("app.example.com"));
}

#[test]
fn multi_tier_platform_template_renders_every_component() {
    let (tmp, files) = apply("multi-tier-platform");
    assert_eq!(files.len(), 77, "{files:#?}");
    for expected in [
        "platform-inventory.ini",
        "ansible.cfg",
        "group_vars/all/main.yml",
        "playbooks/k8s.yml",
        "roles/common/templates/motd.j2",
        "lb-hetzner.tf",
    ] {
        assert!(files.iter().any(|f| f == expected), "missing {expected}");
    }
    let site = read(tmp.path(), "site.yml");
    for playbook in ["bootstrap", "edge", "app", "data", "k8s", "monitoring"] {
        assert!(site.contains(&format!("import_playbook: playbooks/{playbook}.yml")));
    }
    assert!(read(tmp.path(), "playbooks/data.yml").contains("- role: pg_replication\n      when: "));
}

#[test]
fn unknown_names_still_fall_back_to_paths_and_urls() {
    let tmp = tempfile::tempdir().unwrap();
    let err = apply_bundle(
        tmp.path(),
        ApplyParams {
            reference: "no-such-template".to_string(),
            into: None,
            force: false,
        },
    )
    .unwrap_err();
    assert!(err.to_string().contains("kikx presets"));
}

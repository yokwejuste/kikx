use std::path::{Path, PathBuf};

use kikx_core::ops::{apply_bundle, ApplyParams};

fn example(name: &str) -> String {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../examples")
        .join(name)
        .to_string_lossy()
        .into_owned()
}

fn relative(root: &Path, files: &[PathBuf]) -> Vec<String> {
    files
        .iter()
        .map(|f| f.strip_prefix(root).unwrap_or(f).display().to_string())
        .collect()
}

#[test]
fn multi_tier_platform_example_renders_every_component() {
    let tmp = tempfile::tempdir().unwrap();
    let outcome = apply_bundle(
        tmp.path(),
        ApplyParams {
            reference: example("multi-tier-platform.kikx-preset.json"),
            into: None,
            force: false,
        },
    )
    .unwrap();

    let files = relative(tmp.path(), &outcome.files_written);
    assert_eq!(files.len(), 76, "{files:#?}");
    for expected in [
        "platform-inventory.ini",
        "group_vars/all/main.yml",
        "playbooks/k8s.yml",
        "site.yml",
        "roles/common/templates/motd.j2",
        "roles/postgres/meta/main.yml",
        "edge-hetzner.tf",
        "storefront-ingress.yaml",
    ] {
        assert!(files.iter().any(|f| f == expected), "missing {expected}");
    }

    let site = std::fs::read_to_string(tmp.path().join("site.yml")).unwrap();
    for playbook in ["bootstrap", "edge", "app", "data", "k8s", "monitoring"] {
        assert!(site.contains(&format!("import_playbook: playbooks/{playbook}.yml")));
    }

    let data = std::fs::read_to_string(tmp.path().join("playbooks/data.yml")).unwrap();
    assert!(data.contains("- role: pg_replication\n      when: "));
}

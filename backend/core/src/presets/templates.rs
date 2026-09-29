use super::manifest::PresetManifest;

const TEMPLATES: &[&str] = &[
    include_str!("../../presets/k8s-web-app.kikx-preset.json"),
    include_str!("../../presets/single-server.kikx-preset.json"),
    include_str!("../../presets/kubeadm-cluster.kikx-preset.json"),
    include_str!("../../presets/web-and-database.kikx-preset.json"),
    include_str!("../../presets/multi-tier-platform.kikx-preset.json"),
];

pub fn templates() -> Vec<PresetManifest> {
    TEMPLATES
        .iter()
        .map(|source| {
            serde_json::from_str(source).expect("built-in preset templates are valid JSON")
        })
        .collect()
}

pub fn template(name: &str) -> Option<PresetManifest> {
    templates()
        .into_iter()
        .find(|template| template.name == name)
}

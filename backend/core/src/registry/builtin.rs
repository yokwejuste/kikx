use super::item::{FieldSpec, RegistryItem};

fn field(name: &str) -> FieldSpec {
    FieldSpec {
        name: name.to_string(),
        required: false,
        default: None,
    }
}

fn required_field(name: &str) -> FieldSpec {
    FieldSpec {
        name: name.to_string(),
        required: true,
        default: None,
    }
}

fn defaulted_field(name: &str, default: &str) -> FieldSpec {
    FieldSpec {
        name: name.to_string(),
        required: false,
        default: Some(default.to_string()),
    }
}

pub fn all() -> Vec<RegistryItem> {
    vec![
        RegistryItem {
            name: "deployment".to_string(),
            category: "k8s".to_string(),
            extension: "yaml".to_string(),
            title: "Deployment".to_string(),
            description: "A Kubernetes Deployment.".to_string(),
            fields: vec![
                required_field("image"),
                defaulted_field("replicas", "1"),
                defaulted_field("port", "80"),
            ],
            template: include_str!("../../templates/k8s/deployment.yaml.jinja").to_string(),
        },
        RegistryItem {
            name: "service".to_string(),
            category: "k8s".to_string(),
            extension: "yaml".to_string(),
            title: "Service".to_string(),
            description: "A Kubernetes Service.".to_string(),
            fields: vec![defaulted_field("port", "80"), field("target_port")],
            template: include_str!("../../templates/k8s/service.yaml.jinja").to_string(),
        },
        RegistryItem {
            name: "ingress".to_string(),
            category: "k8s".to_string(),
            extension: "yaml".to_string(),
            title: "Ingress".to_string(),
            description: "A Kubernetes Ingress.".to_string(),
            fields: vec![
                field("host"),
                defaulted_field("path", "/"),
                field("service"),
                defaulted_field("port", "80"),
            ],
            template: include_str!("../../templates/k8s/ingress.yaml.jinja").to_string(),
        },
        RegistryItem {
            name: "digitalocean".to_string(),
            category: "terraform".to_string(),
            extension: "tf".to_string(),
            title: "DigitalOcean Droplet".to_string(),
            description: "One or more DigitalOcean Droplets.".to_string(),
            fields: vec![
                required_field("region"),
                required_field("size"),
                required_field("os_image"),
                defaulted_field("count", "1"),
            ],
            template: include_str!("../../templates/terraform/digitalocean.tf.jinja").to_string(),
        },
        RegistryItem {
            name: "hetzner".to_string(),
            category: "terraform".to_string(),
            extension: "tf".to_string(),
            title: "Hetzner Cloud Server".to_string(),
            description: "One or more Hetzner Cloud servers.".to_string(),
            fields: vec![
                required_field("region"),
                required_field("size"),
                required_field("os_image"),
                defaulted_field("count", "1"),
            ],
            template: include_str!("../../templates/terraform/hetzner.tf.jinja").to_string(),
        },
        RegistryItem {
            name: "k8s-bootstrap".to_string(),
            category: "ansible".to_string(),
            extension: "yml".to_string(),
            title: "Kubernetes Bootstrap Playbook".to_string(),
            description: "Installs containerd, kubelet, kubeadm and kubectl on target hosts."
                .to_string(),
            fields: vec![required_field("hosts"), required_field("k8s_version")],
            template: include_str!("../../templates/ansible/k8s-bootstrap.yml.jinja").to_string(),
        },
    ]
}

pub fn lookup(reference: &str) -> Option<RegistryItem> {
    let key = reference.rsplit('/').next().unwrap_or(reference);
    all().into_iter().find(|item| item.name == key)
}

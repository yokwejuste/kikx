use super::item::{FieldSpec, RegistryFile, RegistryItem};

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

fn file(path: &str, template: &str) -> RegistryFile {
    RegistryFile {
        path: path.to_string(),
        template: template.to_string(),
    }
}

pub fn all() -> Vec<RegistryItem> {
    vec![
        RegistryItem {
            name: "deployment".to_string(),
            category: "k8s".to_string(),
            title: "Deployment".to_string(),
            description: "A Kubernetes Deployment.".to_string(),
            fields: vec![
                required_field("image"),
                defaulted_field("replicas", "1"),
                defaulted_field("port", "80"),
            ],
            files: vec![file(
                "{{ name }}-deployment.yaml",
                include_str!("../../templates/k8s/deployment.yaml.jinja"),
            )],
        },
        RegistryItem {
            name: "service".to_string(),
            category: "k8s".to_string(),
            title: "Service".to_string(),
            description: "A Kubernetes Service.".to_string(),
            fields: vec![defaulted_field("port", "80"), field("target_port")],
            files: vec![file(
                "{{ name }}-service.yaml",
                include_str!("../../templates/k8s/service.yaml.jinja"),
            )],
        },
        RegistryItem {
            name: "ingress".to_string(),
            category: "k8s".to_string(),
            title: "Ingress".to_string(),
            description: "A Kubernetes Ingress.".to_string(),
            fields: vec![
                field("host"),
                defaulted_field("path", "/"),
                field("service"),
                defaulted_field("port", "80"),
            ],
            files: vec![file(
                "{{ name }}-ingress.yaml",
                include_str!("../../templates/k8s/ingress.yaml.jinja"),
            )],
        },
        RegistryItem {
            name: "digitalocean".to_string(),
            category: "terraform".to_string(),
            title: "DigitalOcean Droplet".to_string(),
            description: "One or more DigitalOcean Droplets.".to_string(),
            fields: vec![
                required_field("region"),
                required_field("size"),
                required_field("os_image"),
                defaulted_field("count", "1"),
            ],
            files: vec![file(
                "{{ name }}-digitalocean.tf",
                include_str!("../../templates/terraform/digitalocean.tf.jinja"),
            )],
        },
        RegistryItem {
            name: "hetzner".to_string(),
            category: "terraform".to_string(),
            title: "Hetzner Cloud Server".to_string(),
            description: "One or more Hetzner Cloud servers.".to_string(),
            fields: vec![
                required_field("region"),
                required_field("size"),
                required_field("os_image"),
                defaulted_field("count", "1"),
            ],
            files: vec![file(
                "{{ name }}-hetzner.tf",
                include_str!("../../templates/terraform/hetzner.tf.jinja"),
            )],
        },
        RegistryItem {
            name: "k8s-bootstrap".to_string(),
            category: "ansible".to_string(),
            title: "Kubernetes Bootstrap Playbook".to_string(),
            description: "Installs containerd, kubelet, kubeadm and kubectl on target hosts."
                .to_string(),
            fields: vec![required_field("hosts"), required_field("k8s_version")],
            files: vec![file(
                "{{ name }}-k8s-bootstrap.yml",
                include_str!("../../templates/ansible/k8s-bootstrap.yml.jinja"),
            )],
        },
        RegistryItem {
            name: "inventory".to_string(),
            category: "ansible".to_string(),
            title: "Ansible Inventory".to_string(),
            description: "Connects a playbook to servers you already have — pair with ansible/k8s-bootstrap to configure them without provisioning anything.".to_string(),
            fields: vec![required_field("hosts")],
            files: vec![file(
                "{{ name }}-inventory.ini",
                include_str!("../../templates/ansible/inventory.ini.jinja"),
            )],
        },
        RegistryItem {
            name: "group-vars".to_string(),
            category: "ansible".to_string(),
            title: "Group Vars".to_string(),
            description: "Shared variables for one Ansible inventory group (group_vars/<group>.yml)."
                .to_string(),
            fields: vec![required_field("group"), field("vars"), field("yaml")],
            files: vec![file(
                "group_vars/{{ group }}.yml",
                include_str!("../../templates/ansible/group-vars.yml.jinja"),
            )],
        },
        RegistryItem {
            name: "common-role".to_string(),
            category: "ansible".to_string(),
            title: "Common Host-Hygiene Role".to_string(),
            description: "A real, multi-file Ansible role — base packages, timezone, swap, a templated motd.".to_string(),
            fields: vec![defaulted_field("timezone", "UTC")],
            files: vec![
                file(
                    "roles/{{ name }}/tasks/main.yml",
                    include_str!("../../templates/ansible/common-role/tasks/main.yml.jinja"),
                ),
                file(
                    "roles/{{ name }}/defaults/main.yml",
                    include_str!("../../templates/ansible/common-role/defaults/main.yml.jinja"),
                ),
                file(
                    "roles/{{ name }}/handlers/main.yml",
                    include_str!("../../templates/ansible/common-role/handlers/main.yml.jinja"),
                ),
                file(
                    "roles/{{ name }}/templates/motd.j2",
                    include_str!("../../templates/ansible/common-role/templates/motd.j2.jinja"),
                ),
            ],
        },
        RegistryItem {
            name: "playbook".to_string(),
            category: "ansible".to_string(),
            title: "Playbook".to_string(),
            description: "Assigns roles to Inventory groups — one or more plays, each targeting a group."
                .to_string(),
            fields: vec![
                field("hosts"),
                field("roles"),
                field("plays"),
                field("folder"),
            ],
            files: vec![file(
                "{% if folder %}{{ folder }}/{% endif %}{{ name }}.yml",
                include_str!("../../templates/ansible/playbook.yml.jinja"),
            )],
        },
        RegistryItem {
            name: "site".to_string(),
            category: "ansible".to_string(),
            title: "Site Playbook".to_string(),
            description: "The entry point (site.yml) that imports your playbooks in order.".to_string(),
            fields: vec![required_field("playbooks")],
            files: vec![file(
                "{{ name }}.yml",
                include_str!("../../templates/ansible/site.yml.jinja"),
            )],
        },
    ]
}

pub fn lookup(reference: &str) -> Option<RegistryItem> {
    let key = reference.rsplit('/').next().unwrap_or(reference);
    all().into_iter().find(|item| item.name == key)
}

use super::item::{FieldSpec, RegistryFile, RegistryItem};

fn f(name: &str) -> FieldSpec {
    FieldSpec::new(name)
}

fn file(path: &str, template: &str) -> RegistryFile {
    RegistryFile {
        path: path.to_string(),
        template: template.to_string(),
    }
}

fn item(
    category: &str,
    name: &str,
    title: &str,
    description: &str,
    fields: Vec<FieldSpec>,
    files: Vec<RegistryFile>,
) -> RegistryItem {
    RegistryItem {
        name: name.to_string(),
        category: category.to_string(),
        title: title.to_string(),
        description: description.to_string(),
        fields,
        files,
    }
}

const DIGITALOCEAN_IMAGES: &[(&str, &str)] = &[
    ("ubuntu-24-04-x64", "Ubuntu 24.04"),
    ("ubuntu-22-04-x64", "Ubuntu 22.04"),
    ("debian-13-x64", "Debian 13"),
    ("fedora-44-x64", "Fedora 44"),
    ("rockylinux-9-x64", "Rocky Linux 9"),
    ("almalinux-9-x64", "AlmaLinux 9"),
];

const HETZNER_IMAGES: &[(&str, &str)] = &[
    ("ubuntu-24.04", "Ubuntu 24.04"),
    ("ubuntu-22.04", "Ubuntu 22.04"),
    ("debian-12", "Debian 12"),
    ("fedora-44", "Fedora 44"),
    ("rocky-9", "Rocky Linux 9"),
    ("alma-9", "AlmaLinux 9"),
];

fn server_fields(region: &str, size: &str, images: &[(&str, &str)]) -> Vec<FieldSpec> {
    vec![
        f("region").required().example(region),
        f("size").required().example(size),
        f("os_image")
            .required()
            .default_value(images[0].0)
            .options(images)
            .describe("Any image slug the provider accepts; the list is a shortcut."),
        f("count").default_value("1"),
    ]
}

/// The built-in registry. Every default, example and choice a UI shows comes from here.
pub fn all() -> Vec<RegistryItem> {
    vec![
        item(
            "k8s",
            "deployment",
            "Deployment",
            "Pods running one container image.",
            vec![
                f("image").required().example("nginx:1.27"),
                f("replicas").default_value("1"),
                f("port").default_value("80"),
            ],
            vec![file(
                "{{ name }}-deployment.yaml",
                include_str!("../../templates/k8s/deployment.yaml.jinja"),
            )],
        ),
        item(
            "k8s",
            "service",
            "Service",
            "A stable address for pods.",
            vec![
                f("port").default_value("80"),
                f("target_port").describe("Container port; defaults to the service port."),
            ],
            vec![file(
                "{{ name }}-service.yaml",
                include_str!("../../templates/k8s/service.yaml.jinja"),
            )],
        ),
        item(
            "k8s",
            "ingress",
            "Ingress",
            "Routes HTTP traffic to a service.",
            vec![
                f("host").example("app.example.com"),
                f("path").default_value("/"),
                f("service").describe("Backend service; defaults to the ingress name."),
                f("port").default_value("80"),
            ],
            vec![file(
                "{{ name }}-ingress.yaml",
                include_str!("../../templates/k8s/ingress.yaml.jinja"),
            )],
        ),
        item(
            "terraform",
            "digitalocean",
            "DigitalOcean Droplet",
            "Terraform for one or more DigitalOcean droplets.",
            server_fields("nyc3", "s-2vcpu-4gb", DIGITALOCEAN_IMAGES),
            vec![file(
                "{{ name }}-digitalocean.tf",
                include_str!("../../templates/terraform/digitalocean.tf.jinja"),
            )],
        ),
        item(
            "terraform",
            "hetzner",
            "Hetzner Cloud Server",
            "Terraform for one or more Hetzner Cloud servers.",
            server_fields("fsn1", "cx22", HETZNER_IMAGES),
            vec![file(
                "{{ name }}-hetzner.tf",
                include_str!("../../templates/terraform/hetzner.tf.jinja"),
            )],
        ),
        item(
            "ansible",
            "k8s-bootstrap",
            "Kubernetes Bootstrap",
            "Installs containerd, kubelet, kubeadm and kubectl on target hosts.",
            vec![
                f("hosts").required().describe("An inventory group, or all."),
                f("k8s_version").required().example("1.31"),
            ],
            vec![file(
                "{{ name }}-k8s-bootstrap.yml",
                include_str!("../../templates/ansible/k8s-bootstrap.yml.jinja"),
            )],
        ),
        item(
            "ansible",
            "inventory",
            "Inventory",
            "Hosts, groups, nesting and shared vars for servers you already have.",
            vec![
                f("hosts").required(),
                f("default_user")
                    .default_value("root")
                    .describe("SSH user written for hosts that don't set one (null on a host omits it)."),
                f("default_port")
                    .default_value("22")
                    .describe("SSH port written for hosts that don't set one (null on a host omits it)."),
            ],
            vec![file(
                "{{ name }}-inventory.ini",
                include_str!("../../templates/ansible/inventory.ini.jinja"),
            )],
        ),
        item(
            "ansible",
            "group-vars",
            "Group vars",
            "Variables for one inventory group.",
            vec![
                f("group").required(),
                f("vars").describe("JSON map of simple key/value pairs."),
                f("yaml").describe("Raw YAML body, written as-is."),
                f("layout")
                    .default_value("file")
                    .options(&[("file", "group_vars/<group>.yml"), ("dir", "group_vars/<group>/main.yml")]),
            ],
            vec![file(
                "group_vars/{{ group }}{% if layout == \"dir\" %}/main{% endif %}.yml",
                include_str!("../../templates/ansible/group-vars.yml.jinja"),
            )],
        ),
        item(
            "ansible",
            "common-role",
            "Common role",
            "A starter host-hygiene role: base packages, timezone, swap, a templated motd.",
            vec![f("timezone").default_value("UTC")],
            vec![
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
        ),
        item(
            "ansible",
            "role",
            "Role skeleton",
            "An empty role (tasks, defaults, handlers, meta) to fill in.",
            vec![f("description").default_value("")],
            vec![
                file(
                    "roles/{{ name }}/tasks/main.yml",
                    include_str!("../../templates/ansible/role/tasks/main.yml.jinja"),
                ),
                file(
                    "roles/{{ name }}/defaults/main.yml",
                    include_str!("../../templates/ansible/role/defaults/main.yml.jinja"),
                ),
                file(
                    "roles/{{ name }}/handlers/main.yml",
                    include_str!("../../templates/ansible/role/handlers/main.yml.jinja"),
                ),
                file(
                    "roles/{{ name }}/meta/main.yml",
                    include_str!("../../templates/ansible/role/meta/main.yml.jinja"),
                ),
            ],
        ),
        item(
            "ansible",
            "playbook",
            "Playbook",
            "One or more plays, each running roles on an inventory group.",
            vec![
                f("hosts"),
                f("roles"),
                f("plays").describe("JSON list of plays: name, hosts, become, tags, roles, pre_tasks, post_tasks."),
                f("folder")
                    .describe("Where the file goes. Leave empty for the project root.")
                    .example("playbooks"),
            ],
            vec![file(
                "{% if folder %}{{ folder }}/{% endif %}{{ name }}.yml",
                include_str!("../../templates/ansible/playbook.yml.jinja"),
            )],
        ),
        item(
            "ansible",
            "site",
            "Site playbook",
            "The entry point that imports your playbooks in order.",
            vec![f("playbooks").required()],
            vec![file(
                "{{ name }}.yml",
                include_str!("../../templates/ansible/site.yml.jinja"),
            )],
        ),
    ]
}

pub fn lookup(reference: &str) -> Option<RegistryItem> {
    let key = reference.rsplit('/').next().unwrap_or(reference);
    all().into_iter().find(|item| item.name == key)
}

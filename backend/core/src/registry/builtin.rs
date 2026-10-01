use super::item::{FieldFormat, FieldSpec, RegistryFile, RegistryItem};

fn field(name: &str) -> FieldSpec {
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

const AWS_IMAGES: &[(&str, &str)] = &[
    (
        "ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*",
        "Ubuntu 24.04",
    ),
    (
        "ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*",
        "Ubuntu 22.04",
    ),
];

const GOOGLE_IMAGES: &[(&str, &str)] = &[
    ("ubuntu-os-cloud/ubuntu-2404-lts-amd64", "Ubuntu 24.04"),
    ("ubuntu-os-cloud/ubuntu-2204-lts", "Ubuntu 22.04"),
    ("debian-cloud/debian-12", "Debian 12"),
    ("rocky-linux-cloud/rocky-linux-9", "Rocky Linux 9"),
];

const SCALEWAY_IMAGES: &[(&str, &str)] = &[
    ("ubuntu_noble", "Ubuntu 24.04"),
    ("ubuntu_jammy", "Ubuntu 22.04"),
    ("debian_bookworm", "Debian 12"),
    ("rockylinux_9", "Rocky Linux 9"),
];

const LINODE_IMAGES: &[(&str, &str)] = &[
    ("linode/ubuntu24.04", "Ubuntu 24.04"),
    ("linode/ubuntu22.04", "Ubuntu 22.04"),
    ("linode/debian12", "Debian 12"),
    ("linode/rocky9", "Rocky Linux 9"),
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
        field("region").required().example(region),
        field("size").required().example(size),
        field("os_image")
            .required()
            .default_value(images[0].0)
            .options(images)
            .describe("Any image slug the provider accepts; the list is a shortcut."),
        field("count").default_value("1"),
        field("private_network")
            .format(FieldFormat::Cidr)
            .example("10.10.0.0/16")
            .describe("Private network range for these servers, in CIDR notation. Leave empty to use the provider's default network."),
    ]
}

const HETZNER_NETWORK_ZONES: &[(&str, &str)] = &[
    ("eu-central", "Europe (fsn1, nbg1, hel1)"),
    ("us-east", "US East (ash)"),
    ("us-west", "US West (hil)"),
    ("ap-southeast", "Asia Pacific (sin)"),
];

pub fn all() -> Vec<RegistryItem> {
    vec![
        item(
            "k8s",
            "deployment",
            "Deployment",
            "Pods running one container image.",
            vec![
                field("image").required().example("nginx:1.27"),
                field("replicas").default_value("1"),
                field("port").default_value("80"),
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
                field("port").default_value("80"),
                field("target_port").describe("Container port; defaults to the service port."),
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
                field("host").example("app.example.com"),
                field("path").default_value("/"),
                field("service").describe("Backend service; defaults to the ingress name."),
                field("port").default_value("80"),
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
            [
                server_fields("fsn1", "cx22", HETZNER_IMAGES),
                vec![field("network_zone")
                    .default_value(HETZNER_NETWORK_ZONES[0].0)
                    .options(HETZNER_NETWORK_ZONES)
                    .describe("Network zone of the private network; it must contain the server location.")],
            ]
            .concat(),
            vec![file(
                "{{ name }}-hetzner.tf",
                include_str!("../../templates/terraform/hetzner.tf.jinja"),
            )],
        ),
        item(
            "terraform",
            "aws",
            "AWS EC2 Instance",
            "Terraform for one or more AWS EC2 instances.",
            [
                server_fields("us-east-1", "t3.small", AWS_IMAGES),
                vec![field("image_owner")
                    .default_value("099720109477")
                    .describe("AWS account that publishes the image; 099720109477 is Canonical.")],
            ]
            .concat(),
            vec![file(
                "{{ name }}-aws.tf",
                include_str!("../../templates/terraform/aws.tf.jinja"),
            )],
        ),
        item(
            "terraform",
            "google",
            "Google Compute Engine Instance",
            "Terraform for one or more Google Compute Engine instances.",
            [
                server_fields("europe-west1-b", "e2-medium", GOOGLE_IMAGES),
                vec![field("project").required().example("my-project")],
            ]
            .concat(),
            vec![file(
                "{{ name }}-google.tf",
                include_str!("../../templates/terraform/google.tf.jinja"),
            )],
        ),
        item(
            "terraform",
            "scaleway",
            "Scaleway Instance",
            "Terraform for one or more Scaleway instances with public IPs.",
            server_fields("fr-par-1", "DEV1-S", SCALEWAY_IMAGES),
            vec![file(
                "{{ name }}-scaleway.tf",
                include_str!("../../templates/terraform/scaleway.tf.jinja"),
            )],
        ),
        item(
            "terraform",
            "linode",
            "Linode Instance",
            "Terraform for one or more Linode instances.",
            server_fields("eu-central", "g6-standard-1", LINODE_IMAGES),
            vec![file(
                "{{ name }}-linode.tf",
                include_str!("../../templates/terraform/linode.tf.jinja"),
            )],
        ),
        item(
            "ansible",
            "k8s-bootstrap",
            "Kubernetes Bootstrap",
            "Installs containerd, kubelet, kubeadm and kubectl on target hosts.",
            vec![
                field("hosts")
                    .required()
                    .describe("An inventory group, or all."),
                field("k8s_version").required().example("1.31"),
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
                field("hosts").required(),
                field("default_user").default_value("root").describe(
                    "SSH user written for hosts that don't set one (null on a host omits it).",
                ),
                field("default_port").default_value("22").describe(
                    "SSH port written for hosts that don't set one (null on a host omits it).",
                ),
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
                field("group").required(),
                field("vars").describe("JSON map of simple key/value pairs."),
                field("yaml").describe("Raw YAML body, written as-is."),
                field("layout").default_value("file").options(&[
                    ("file", "group_vars/<group>.yml"),
                    ("dir", "group_vars/<group>/main.yml"),
                ]),
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
            vec![field("timezone").default_value("UTC")],
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
            vec![field("description").default_value("")],
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
                field("hosts"),
                field("roles"),
                field("plays").describe(
                    "JSON list of plays: name, hosts, become, tags, roles, pre_tasks, post_tasks.",
                ),
                field("folder")
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
            vec![field("playbooks").required()],
            vec![file(
                "{{ name }}.yml",
                include_str!("../../templates/ansible/site.yml.jinja"),
            )],
        ),
        item(
            "ansible",
            "config",
            "Ansible config",
            "ansible.cfg pointing Ansible at your inventory and roles, so playbooks in subfolders find them.",
            vec![
                field("inventory").example("platform-inventory.ini"),
                field("roles_path").default_value("roles"),
            ],
            vec![file(
                "ansible.cfg",
                include_str!("../../templates/ansible/ansible-cfg.jinja"),
            )],
        ),
    ]
}

pub fn lookup(reference: &str) -> Option<RegistryItem> {
    let key = reference.rsplit('/').next().unwrap_or(reference);
    all().into_iter().find(|item| item.name == key)
}

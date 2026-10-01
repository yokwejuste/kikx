mod common;

use common::{render, try_render};
use kikx_core::ops::OpsErrorKind;

#[test]
fn every_provider_renders_one_named_file_with_its_resource() {
    let cases = [
        (
            "terraform/digitalocean",
            "digitalocean_droplet",
            vec![("region", "nyc3"), ("size", "s-1vcpu-1gb")],
        ),
        (
            "terraform/hetzner",
            "hcloud_server",
            vec![("region", "fsn1"), ("size", "cx22")],
        ),
        (
            "terraform/aws",
            "aws_instance",
            vec![("region", "us-east-1"), ("size", "t3.small")],
        ),
        (
            "terraform/google",
            "google_compute_instance",
            vec![
                ("region", "europe-west1-b"),
                ("size", "e2-medium"),
                ("project", "demo"),
            ],
        ),
        (
            "terraform/scaleway",
            "scaleway_instance_server",
            vec![("region", "fr-par-1"), ("size", "DEV1-S")],
        ),
        (
            "terraform/linode",
            "linode_instance",
            vec![("region", "eu-central"), ("size", "g6-standard-1")],
        ),
    ];
    for (reference, resource, fields) in cases {
        let provider = reference.trim_start_matches("terraform/");
        let outcome = render(reference, "edge", &fields);
        assert_eq!(outcome.files.len(), 1, "{reference}");
        assert_eq!(
            outcome.files[0].path.to_str(),
            Some(format!("edge-{provider}.tf").as_str())
        );
        let content = &outcome.files[0].content;
        assert!(
            content.contains(&format!("resource \"{resource}\" \"edge\"")),
            "{reference}"
        );
        assert!(content.contains("count"), "{reference}");
        assert!(!content.contains("{{"), "{reference} left a template tag");
    }
}

#[test]
fn aws_looks_up_the_image_from_its_owner() {
    let content = render(
        "terraform/aws",
        "web",
        &[("region", "eu-west-1"), ("size", "t3.micro")],
    )
    .files
    .remove(0)
    .content;
    assert!(content.contains("owners      = [\"099720109477\"]"));
    assert!(content.contains("ami           = data.aws_ami.web.id"));
}

#[test]
fn google_requires_a_project() {
    let err = try_render(
        "terraform/google",
        "web",
        &[("region", "europe-west1-b"), ("size", "e2-medium")],
    )
    .unwrap_err();
    assert!(err.to_string().contains("field `project` is required"));
}

fn provider_cases() -> Vec<(&'static str, Vec<(&'static str, &'static str)>)> {
    vec![
        (
            "terraform/digitalocean",
            vec![("region", "nyc3"), ("size", "s-1vcpu-1gb")],
        ),
        (
            "terraform/hetzner",
            vec![("region", "fsn1"), ("size", "cx22")],
        ),
        (
            "terraform/aws",
            vec![("region", "us-east-1"), ("size", "t3.small")],
        ),
        (
            "terraform/google",
            vec![
                ("region", "europe-west1-b"),
                ("size", "e2-medium"),
                ("project", "demo"),
            ],
        ),
        (
            "terraform/scaleway",
            vec![("region", "fr-par-1"), ("size", "DEV1-S")],
        ),
        (
            "terraform/linode",
            vec![("region", "eu-central"), ("size", "g6-standard-1")],
        ),
    ]
}

fn render_content(reference: &str, fields: &[(&str, &str)]) -> String {
    render(reference, "edge", fields).files.remove(0).content
}

#[test]
fn every_provider_renders_its_private_network_range() {
    for (reference, mut fields) in provider_cases() {
        fields.push(("private_network", "10.20.0.0/16"));
        let content = render_content(reference, &fields);
        assert!(content.contains("\"10.20.0.0/16\""), "{reference}");
        assert!(!content.contains("\n\n\n"), "{reference} left a blank gap");
        assert!(!content.contains("{%"), "{reference} left a template tag");
    }
}

#[test]
fn without_a_range_no_network_is_declared() {
    for (reference, fields) in provider_cases() {
        let content = render_content(reference, &fields);
        assert!(!content.contains("-network"), "{reference}");
        assert!(!content.contains("\n\n\n"), "{reference} left a blank gap");
    }
}

#[test]
fn networks_attach_to_the_servers() {
    let attached = [
        "vpc_uuid = digitalocean_vpc.edge.id",
        "network_id = hcloud_network.edge.id",
        "subnet_id     = aws_subnet.edge.id",
        "subnetwork = google_compute_subnetwork.edge.id",
        "pn_id = scaleway_vpc_private_network.edge.id",
        "subnet_id = linode_vpc_subnet.edge.id",
    ];
    for ((reference, mut fields), line) in provider_cases().into_iter().zip(attached) {
        fields.push(("private_network", "10.20.0.0/16"));
        assert!(
            render_content(reference, &fields).contains(line),
            "{reference}"
        );
    }
}

#[test]
fn zonal_providers_place_the_network_in_the_zone_region() {
    let google = render_content(
        "terraform/google",
        &[
            ("region", "europe-west1-b"),
            ("size", "e2-medium"),
            ("project", "demo"),
            ("private_network", "10.20.0.0/16"),
        ],
    );
    assert!(google.contains("region        = \"europe-west1\""));
    assert!(!google.contains("network = \"default\""));

    let scaleway = render_content(
        "terraform/scaleway",
        &[
            ("region", "fr-par-1"),
            ("size", "DEV1-S"),
            ("private_network", "10.20.0.0/16"),
        ],
    );
    assert!(scaleway.contains("region = \"fr-par\""));
}

#[test]
fn hetzner_puts_the_subnet_in_the_chosen_network_zone() {
    let content = render_content(
        "terraform/hetzner",
        &[
            ("region", "ash"),
            ("size", "cpx11"),
            ("private_network", "10.20.0.0/16"),
            ("network_zone", "us-east"),
        ],
    );
    assert!(content.contains("network_zone = \"us-east\""));
}

#[test]
fn a_private_network_value_is_normalised() {
    let content = render_content(
        "terraform/digitalocean",
        &[
            ("region", "nyc3"),
            ("size", "s-1vcpu-1gb"),
            ("private_network", " 10.20.0.0/16 "),
        ],
    );
    assert!(content.contains("ip_range = \"10.20.0.0/16\""));
}

#[test]
fn a_private_network_that_is_not_a_range_is_rejected() {
    for (value, hint) in [
        ("10.20.0.5/16", "use `10.20.0.0/16`"),
        ("10.20.0.0", "is not a CIDR range"),
        ("not-a-range", "is not a CIDR range"),
    ] {
        let err = try_render(
            "terraform/aws",
            "edge",
            &[
                ("region", "us-east-1"),
                ("size", "t3.small"),
                ("private_network", value),
            ],
        )
        .unwrap_err();
        assert_eq!(err.kind, OpsErrorKind::InvalidField, "{value}");
        let message = err.to_string();
        assert!(
            message.contains("field `private_network` of terraform/aws"),
            "{message}"
        );
        assert!(message.contains(hint), "{message}");
    }
}

mod common;

use common::{render, try_render};

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

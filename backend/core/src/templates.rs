use std::sync::OnceLock;

use anyhow::{anyhow, Result};
use minijinja::Environment;
use serde::Serialize;

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Component {
    Deployment,
    Service,
    Ingress,
}

impl Component {
    pub const ALL: [Component; 3] = [
        Component::Deployment,
        Component::Service,
        Component::Ingress,
    ];

    pub fn parse(raw: &str) -> Result<Self> {
        let key = raw.rsplit('/').next().unwrap_or(raw);
        match key {
            "deployment" => Ok(Component::Deployment),
            "service" => Ok(Component::Service),
            "ingress" => Ok(Component::Ingress),
            other => Err(anyhow!(
                "unknown component `{other}` — run `kikx list` to see available components"
            )),
        }
    }

    pub fn name(&self) -> &'static str {
        match self {
            Component::Deployment => "deployment",
            Component::Service => "service",
            Component::Ingress => "ingress",
        }
    }
}

fn environment() -> &'static Environment<'static> {
    static ENV: OnceLock<Environment<'static>> = OnceLock::new();
    ENV.get_or_init(|| {
        let mut env = Environment::new();
        env.set_keep_trailing_newline(true);
        env.add_template(
            "deployment",
            include_str!("../templates/k8s/deployment.yaml.jinja"),
        )
        .expect("deployment template must be valid");
        env.add_template(
            "service",
            include_str!("../templates/k8s/service.yaml.jinja"),
        )
        .expect("service template must be valid");
        env.add_template(
            "ingress",
            include_str!("../templates/k8s/ingress.yaml.jinja"),
        )
        .expect("ingress template must be valid");
        env
    })
}

pub fn render(component: Component, ctx: &impl Serialize) -> Result<String> {
    let tmpl = environment().get_template(component.name())?;
    Ok(tmpl.render(ctx)?)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_accepts_bare_and_prefixed_names() {
        assert_eq!(
            Component::parse("deployment").unwrap(),
            Component::Deployment
        );
        assert_eq!(
            Component::parse("k8s/deployment").unwrap(),
            Component::Deployment
        );
    }

    #[test]
    fn parse_rejects_unknown_component() {
        assert!(Component::parse("bogus").is_err());
    }
}

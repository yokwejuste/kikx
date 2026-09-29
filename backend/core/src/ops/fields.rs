use serde::Deserialize;

/// The named options the CLI and the HTTP API both accept alongside free-form `key=value` fields.
#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CommonFields {
    pub image: Option<String>,
    pub replicas: Option<u32>,
    pub port: Option<u16>,
    pub target_port: Option<u16>,
    pub namespace: Option<String>,
    pub host: Option<String>,
    pub path: Option<String>,
    pub service: Option<String>,
}

impl CommonFields {
    /// Only the options that were set, so the rest fall back to the registry's defaults.
    /// `extra` comes last so an explicit `key=value` overrides a named option.
    pub fn into_fields(
        self,
        extra: impl IntoIterator<Item = (String, String)>,
    ) -> Vec<(String, String)> {
        let Self {
            image,
            replicas,
            port,
            target_port,
            namespace,
            host,
            path,
            service,
        } = self;
        [
            ("image", image),
            ("replicas", replicas.map(|v| v.to_string())),
            ("port", port.map(|v| v.to_string())),
            ("target_port", target_port.map(|v| v.to_string())),
            ("namespace", namespace),
            ("host", host),
            ("path", path),
            ("service", service),
        ]
        .into_iter()
        .filter_map(|(key, value)| Some((key.to_string(), value?)))
        .chain(extra)
        .collect()
    }
}

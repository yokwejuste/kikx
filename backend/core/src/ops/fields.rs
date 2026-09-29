use serde::Deserialize;

#[derive(Debug, Default, Deserialize)]
#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
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

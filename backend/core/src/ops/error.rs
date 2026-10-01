use std::fmt;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum OpsErrorKind {
    NotInitialized,
    NotFound,
    AlreadyExists,
    InvalidComponent,
    MissingField,
    InvalidField,
    Io,
    Other,
}

#[derive(Debug)]
pub struct OpsError {
    pub kind: OpsErrorKind,
    source: anyhow::Error,
}

impl OpsError {
    pub fn new(kind: OpsErrorKind, source: impl Into<anyhow::Error>) -> Self {
        Self {
            kind,
            source: source.into(),
        }
    }
}

impl fmt::Display for OpsError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.source)
    }
}

impl std::error::Error for OpsError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        self.source.source()
    }
}

pub(crate) trait OrKind<T> {
    fn or_kind(self, kind: OpsErrorKind) -> Result<T, OpsError>;
}

impl<T, E: Into<anyhow::Error>> OrKind<T> for Result<T, E> {
    fn or_kind(self, kind: OpsErrorKind) -> Result<T, OpsError> {
        self.map_err(|e| OpsError::new(kind, e))
    }
}

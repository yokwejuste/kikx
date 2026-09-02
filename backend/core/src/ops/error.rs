use std::fmt;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum OpsErrorKind {
    NotInitialized,
    AlreadyExists,
    InvalidComponent,
    MissingField,
    Io,
    Other,
}

/// Wraps an `anyhow::Error` with a `kind` an HTTP layer can map to a status
/// code, while keeping the exact `Display` text callers already rely on
/// (the CLI's error strings, matched by `cli/tests/cli.rs`).
#[derive(Debug)]
pub struct OpsError {
    pub kind: OpsErrorKind,
    source: anyhow::Error,
}

impl OpsError {
    pub fn new(kind: OpsErrorKind, source: anyhow::Error) -> Self {
        Self { kind, source }
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

/// Error category prefixes form the narrow contract understood by the Main
/// host. Do not put source URLs, cookie values, or absolute file paths in the
/// message: those strings can enter diagnostics and telemetry.
pub(crate) enum EngineErrorKind {
    Decode,
    Output,
    Source,
}

impl EngineErrorKind {
    pub(crate) const fn prefix(self) -> &'static str {
        match self {
            Self::Decode => "[decode]",
            Self::Output => "[output]",
            Self::Source => "[source]",
        }
    }
}

pub(crate) fn error(kind: EngineErrorKind, message: &str) -> napi::Error {
    napi::Error::from_reason(format!("{} {message}", kind.prefix()))
}

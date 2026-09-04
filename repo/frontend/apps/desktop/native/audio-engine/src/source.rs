use std::path::{Path, PathBuf};

use crate::bindings::JsNativeAudioSource;
use crate::error::{error, EngineErrorKind};

/// Source locations remain native-only. Snapshots/events never contain this
/// value, preventing signed URLs and local paths entering IPC diagnostics.
#[derive(Clone)]
pub(crate) enum AudioSource {
    File(PathBuf),
    Https(String),
}

impl AudioSource {
    pub(crate) fn from_js(source: &JsNativeAudioSource) -> napi::Result<Self> {
        match source.kind.as_str() {
            "file" => {
                if source.value.contains('\0') || !Path::new(&source.value).is_absolute() {
                    return Err(error(
                        EngineErrorKind::Source,
                        "Native file sources must use an absolute path.",
                    ));
                }
                Ok(Self::File(PathBuf::from(&source.value)))
            }
            "https" => {
                let url = url::Url::parse(&source.value).map_err(|_| {
                    error(
                        EngineErrorKind::Source,
                        "Native remote sources must use a valid HTTPS URL.",
                    )
                })?;
                if url.scheme() != "https" || url.host_str().is_none() {
                    return Err(error(
                        EngineErrorKind::Source,
                        "Native remote sources must use HTTPS.",
                    ));
                }
                Ok(Self::Https(source.value.clone()))
            }
            _ => Err(error(
                EngineErrorKind::Source,
                "Native audio source kind is not supported.",
            )),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::AudioSource;
    use crate::bindings::JsNativeAudioSource;

    #[test]
    fn accepts_only_absolute_files_and_https() {
        assert!(AudioSource::from_js(&JsNativeAudioSource {
            kind: "file".to_string(),
            value: "C:\\Music\\song.flac".to_string(),
        })
        .is_ok());
        assert!(AudioSource::from_js(&JsNativeAudioSource {
            kind: "https".to_string(),
            value: "https://cdn.example.test/song.flac".to_string(),
        })
        .is_ok());
        assert!(AudioSource::from_js(&JsNativeAudioSource {
            kind: "http".to_string(),
            value: "http://cdn.example.test/song.flac".to_string(),
        })
        .is_err());
    }
}

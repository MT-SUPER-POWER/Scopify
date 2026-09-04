use std::{
    fs::File,
    io::{Cursor, Read},
    time::Duration,
};

use rodio::{Decoder, Source};

use crate::source::AudioSource;

// V1 intentionally buffers sources to give local and HTTPS playback identical
// seek semantics. Bound that buffer so a corrupt file or hostile server cannot
// exhaust the Electron Main process.
const MAX_SOURCE_BYTES: u64 = 512 * 1024 * 1024;

/// A loaded source is fully owned by the Rodio decoder. HTTPS bytes are first
/// downloaded into a seekable cursor, so `Sink::try_seek` has the same behavior
/// for local and remote audio. This is intentional V1 behavior: it favours a
/// dependable common implementation over two subtly different seek paths.
pub(crate) struct DecodedSource {
    pub(crate) decoder: Decoder<Cursor<Vec<u8>>>,
    pub(crate) duration: Option<Duration>,
}

#[derive(Clone, Copy, Debug)]
pub(crate) enum DecodeFailure {
    Decode,
    Source,
}

impl DecodeFailure {
    pub(crate) const fn message(self) -> &'static str {
        match self {
            Self::Decode => "[decode] The native audio source could not be decoded.",
            Self::Source => "[source] The native audio source could not be opened.",
        }
    }
}

pub(crate) fn open(source: &AudioSource) -> Result<DecodedSource, DecodeFailure> {
    let bytes = match source {
        AudioSource::File(path) => {
            let file = File::open(path).map_err(|_| DecodeFailure::Source)?;
            if file.metadata().map_err(|_| DecodeFailure::Source)?.len() > MAX_SOURCE_BYTES {
                return Err(DecodeFailure::Source);
            }
            read_limited(file)?
        }
        AudioSource::Https(url) => {
            let client = reqwest::blocking::Client::builder()
                .connect_timeout(Duration::from_secs(10))
                .timeout(Duration::from_secs(30))
                .redirect(reqwest::redirect::Policy::custom(|attempt| {
                    if attempt.url().scheme() != "https" {
                        attempt.error("native audio redirects must remain HTTPS")
                    } else if attempt.previous().len() > 10 {
                        attempt.error("native audio redirect limit exceeded")
                    } else {
                        attempt.follow()
                    }
                }))
                .build()
                .map_err(|_| DecodeFailure::Source)?;
            let response = client
                .get(url)
                .send()
                .and_then(reqwest::blocking::Response::error_for_status)
                .map_err(|_| DecodeFailure::Source)?;
            if response
                .content_length()
                .is_some_and(|length| length > MAX_SOURCE_BYTES)
            {
                return Err(DecodeFailure::Source);
            }
            read_limited(response)?
        }
    };
    decode_bytes(bytes)
}

fn read_limited(reader: impl Read) -> Result<Vec<u8>, DecodeFailure> {
    let mut bytes = Vec::new();
    reader
        .take(MAX_SOURCE_BYTES + 1)
        .read_to_end(&mut bytes)
        .map_err(|_| DecodeFailure::Source)?;
    if bytes.len() as u64 > MAX_SOURCE_BYTES {
        return Err(DecodeFailure::Source);
    }
    Ok(bytes)
}

fn decode_bytes(bytes: Vec<u8>) -> Result<DecodedSource, DecodeFailure> {
    let byte_len = u64::try_from(bytes.len()).map_err(|_| DecodeFailure::Decode)?;
    let decoder = Decoder::builder()
        .with_data(Cursor::new(bytes))
        .with_byte_len(byte_len)
        .with_seekable(true)
        .build()
        .map_err(|_| DecodeFailure::Decode)?;
    let duration = decoder.total_duration();
    Ok(DecodedSource { decoder, duration })
}

#[cfg(test)]
mod tests {
    use super::decode_bytes;

    // One 16-bit mono PCM sample. The literal is a fixed valid WAV fixture;
    // it drives Rodio's real decoder without a sound device or network.
    const FIXED_TONE_WAV: &[u8] = &[
        82, 73, 70, 70, 38, 0, 0, 0, 87, 65, 86, 69, 102, 109, 116, 32, 16, 0, 0, 0, 1, 0, 1, 0,
        68, 172, 0, 0, 136, 88, 1, 0, 2, 0, 16, 0, 100, 97, 116, 97, 2, 0, 0, 0, 0, 64,
    ];

    #[test]
    fn fixed_wave_fixture_reaches_the_real_decoder_without_output_hardware() {
        let mut decoded = decode_bytes(FIXED_TONE_WAV.to_vec())
            .expect("the fixed WAV fixture must decode offline");

        assert_eq!(
            decoded.duration.map(|duration| duration.as_millis()),
            Some(0)
        );
        assert!(decoded.decoder.next().is_some());
    }
}

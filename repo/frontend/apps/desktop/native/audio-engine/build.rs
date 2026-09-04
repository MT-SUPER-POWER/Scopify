fn main() {
    // NAPI-RS supplies the correct Node-API link settings for the target.
    // TypeScript declarations are emitted by `napi build`; see package.json.
    napi_build::setup();
}

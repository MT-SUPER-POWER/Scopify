# Concert ticket material

`concert-paper.png` is an original ImageGen raster asset, generated 2026-09-16 with the built-in tool. Copied unchanged from `exec-c593474c-00c2-4e7c-8526-3e166fc43cce.png`.

Reusable across the main ticket and detachable stub. No baked text, cover art, QR code or shadows. Ticket content is accessible HTML backed by the sign-in response. `TicketPaper` overlays a static PaperTexture shader; the raster background remains underneath when the shader is unavailable. Geometry and borders use CSS, not a substitute SVG paper texture.

## Generation prompt

Generate a production reusable raster MATERIAL asset for the concert ticket paper in the reference. Output ONLY a perfectly flat edge-to-edge rectangular macro scan of warm ivory concert-hall ticket cardstock, landscape 3:2. Match reference creamy ivory hue and extremely subtle organic cotton fibres, fine mottling and faint aged flecks. Mostly bright clean cream with subtle real paper microtexture, plenty of legibility for dark text later added in HTML. Entire image filled with paper. Uniform diffuse lighting, no perspective, no shadow, no edges, no frame, no perforations, no border, NO TEXT, NO letters, NO numbers, NO logos, NO artwork, no album cover, no QR code. This is a texture map not a mockup. It will be used across two independently animated ticket pieces and combined with PaperTexture shader. Texture should not have obvious repeating landmarks or deep wrinkles. Preserve the restrained refined physical paper quality of reference.

## Implementation references

- PaperTexture official API: https://shaders.paper.design/paper-texture
- Motion motion values and spring APIs: https://motion.dev/docs/react-motion-value and https://motion.dev/docs/react-use-spring
- Ticket main/stub and perforation composition inspiration: https://gist.github.com/SakuraRinDev/a325286285b257ddd11f21ea350e04bb (Cliff Pyles example; hover separation, not a draggable tear implementation). No source code or imagery copied from this example. Pointer capture, tear threshold, cancellation and completion are implemented for Scopify.

Interaction: hold the date, blank area or grip and drag up or down. Initial motion selects the curl direction. Signed pointer displacement drives the tear front at one CSS pixel per pixel of drag, using the measured ticket height. Reversing the drag unfolds the paper. No automatic completion occurs while held; release beyond 82% to finish, otherwise the paper rolls back. A 48-strip spiral exposes the paper back without duplicating WebGL canvases. Drawing is coalesced once per frame and face shading uses opacity overlays. Playback and QR controls retain their clicks; keyboard activation, Escape and the close button remain available.

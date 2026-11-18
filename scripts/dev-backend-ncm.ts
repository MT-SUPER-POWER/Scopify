// Keep Scopify's backend port while retaining the upstream startup sequence.
process.env.PORT ||= "3838";
await import("../repo/backend/api-enhanced/app.js");

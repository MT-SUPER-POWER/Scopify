// Entry of the Electron utility process that hosts the QQ Music API.
// argv: <api entry> [ts-node register module]
//
// The API calls `app.listen(port)` with no host, which binds every interface. Scopify only serves
// its own renderer, so a bare port is pinned to loopback before the API is loaded.
const net = require("node:net");

const LOOPBACK = "127.0.0.1";
const listen = net.Server.prototype.listen;
net.Server.prototype.listen = function listenOnLoopback(...args) {
  if (typeof args[0] === "number" && typeof args[1] !== "string") args.splice(1, 0, LOOPBACK);
  return listen.apply(this, args);
};

const [entry, register] = process.argv.slice(2);
if (register) require(register);
require(entry);

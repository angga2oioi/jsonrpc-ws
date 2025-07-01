const { WebSocketServer } = require("ws");
const EventEmitter = require("events");

class Server extends EventEmitter {
  constructor({ server, path = "/", port, host = "0.0.0.0" }) {
    super();
    this.methods = {};

    if (server) {
      this.wss = new WebSocketServer({ server, path });
    } else if (port) {
      this.wss = new WebSocketServer({ port, host });
    } else {
      throw new Error("Must provide either server or port");
    }

    this.wss.on("connection", (ws) => {
      ws.on("message", async (msg) => {
        let req;
        try {
          req = JSON.parse(msg);
        } catch {
          return ws.send(JSON.stringify({
            jsonrpc: "2.0",
            error: { code: -32700, message: "Parse error" },
            id: null
          }));
        }

        if (req.jsonrpc !== "2.0" || typeof req.method !== "string" || !("id" in req)) {
          return ws.send(JSON.stringify({
            jsonrpc: "2.0",
            error: { code: -32600, message: "Invalid Request" },
            id: req.id ?? null
          }));
        }

        const fn = this.methods[req.method];
        if (!fn) {
          return ws.send(JSON.stringify({
            jsonrpc: "2.0",
            error: {
              code: -32601,
              message: `Method not found: '${req.method}'`
            },
            id: req.id
          }));
        }

        try {
          const result = await fn(req.params ?? {});
          ws.send(JSON.stringify({
            jsonrpc: "2.0",
            result,
            id: req.id
          }));
        } catch (err) {
          this.emit("socket-error", err);
          ws.send(JSON.stringify({
            jsonrpc: "2.0",
            error: {
              code: -32603,
              message: err.message || "Internal error"
            },
            id: req.id
          }));
        }
      });

      ws.on("error", (err) => this.emit("socket-error", err));
    });

    this.wss.on("error", (err) => this.emit("error", err));
  }

  register(method, handler) {
    this.methods[method] = handler;
  }

  close(cb) {
    this.wss.close(cb);
  }
}

module.exports = Server;

//@ts-check

const WebSocket = require("ws");
const EventEmitter = require("events");

class Client extends EventEmitter {
  constructor(urls, options = {}) {
    super();
    this.urls = Array.isArray(urls) ? urls : [urls]; // support both string and array
    this.currentUrlIndex = 0;

    this.options = {
      reconnectInterval: 1000,
      maxRetries: 10,
      ...options
    };

    this.ws = null;
    this.pending = new Map();
    this.id = 1;

    this.retryCount = 0;
    this.shouldReconnect = true;

    this.connect();
  }

  get currentUrl() {
    return this.urls[this.currentUrlIndex];
  }

  connect() {
    this.ws = new WebSocket(this.currentUrl);

    this.ws.on("open", () => {
      this.retryCount = 0;
      this.emit("open");
    });

    this.ws.on("message", (msg) => {
      let res;
      try {
        res = JSON.parse(msg);
      } catch {
        return;
      }

      if (res.id && this.pending.has(res.id)) {
        const { resolve, reject } = this.pending.get(res.id);
        this.pending.delete(res.id);
        res.error ? reject(res.error) : resolve(res.result);
      }
    });

    this.ws.on("close", (e) => {
      this.emit("close", e);
      if (this.shouldReconnect) this.tryReconnect();
    });

    this.ws.on("error", (err) => {
      this.emit("error", err);
    });
  }

  tryReconnect() {
    if (this.options.maxRetries > 0 && this.retryCount >= this.options.maxRetries) {
      this.emit("reconnect_failed");
      return;
    }

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      this.ws.terminate();
    }

    // Advance to next URL
    this.currentUrlIndex = (this.currentUrlIndex + 1) % this.urls.length;

    const delay = Math.min(this.options.reconnectInterval * Math.pow(2, this.retryCount), 30000);
    this.retryCount++;

    setTimeout(() => {
      this.emit("reconnecting", this.retryCount, this.currentUrl);
      this.connect();
    }, delay);
  }

  call(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      const payload = {
        jsonrpc: "2.0",
        method,
        params,
        id
      };

      this.pending.set(id, { resolve, reject });

      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(payload));
      } else {
        this.once("open", () => {
          this.ws.send(JSON.stringify(payload));
        });
      }
    });
  }

  close() {
    this.shouldReconnect = false;
    this.ws.close();
  }
}

module.exports = Client;

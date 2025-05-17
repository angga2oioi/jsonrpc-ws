# jsonrpc-ws

`jsonrpc-ws` is a WebSocket implementation for JSON-RPC communication, providing a client and server setup that allows invoking methods over a WebSocket connection.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Scripts](#scripts)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## Installation

To install `jsonrpc-ws`, you can use npm:

```bash
npm i github:angga2oioi/jsonrpc-ws
```

## Usage

### Client

To create a client, you can import the `Client` class from the module:

```javascript
const { Client } = require('jsonrpc-ws');

// Create a new client instance
const client = new Client('ws://localhost:8080');

return (params) => client.call("method", { params });

```

### Server

To create a server, you can import the `Server` class from the module:

```javascript
const { Server } = require('jsonrpc-ws');

// Create a new server listening on port 8080
const server = new Server({ port: 8080 });

// Register a method
server.register('methodName', async (params) => {
  // Handle method logic
  return "Response data";
});
```

## Client API

### `call(method, params)`

Invokes a method over the WebSocket connection. Returns a promise that resolves with the result.

## Server API

### `register(method, handler)`

Registers a method that can be called by clients. The handler function should return a promise.


## License

This project is licensed under the ISC License. 
const esbuild = require("esbuild");
const path = require("path");

esbuild.build({
  entryPoints: [path.resolve(__dirname, "index.js")],
  outfile: "dist/jsonrpc-ws.js",
  platform: "node",
  format: "cjs",
  bundle: true,
  minify: true,
  sourcemap: false,
  target: ["es2015"]
}).catch(() => process.exit(1));

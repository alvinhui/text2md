#!/usr/bin/env node
"use strict";

const http = require("node:http");
const { HOST, PORT } = require("./config");
const { createRequestHandler } = require("./app");

const server = http.createServer(createRequestHandler());

server.listen(PORT, HOST, () => {
  console.log(`Serving on http://127.0.0.1:${PORT}`);
});

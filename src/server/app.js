const { URL } = require("node:url");
const { handleWx2mdApi } = require("./api/wx2md");
const { serveStatic } = require("./routes/static");
const { sendJson, sendText } = require("./lib/http");

function createRequestHandler() {
  return async function requestHandler(req, res) {
    try {
      const urlObj = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);

      const handledByApi = await handleWx2mdApi(req, res, urlObj);
      if (handledByApi) {
        return;
      }

      if (req.method !== "GET" && req.method !== "HEAD") {
        sendText(res, 405, "Method Not Allowed");
        return;
      }

      if (req.method === "HEAD") {
        res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
        res.end();
        return;
      }

      await serveStatic(urlObj, res);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      sendJson(res, 500, { ok: false, error: "internal server error", detail: message });
    }
  };
}

module.exports = {
  createRequestHandler,
};

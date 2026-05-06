#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const fsp = require("node:fs/promises");
const http = require("node:http");
const https = require("node:https");
const path = require("node:path");
const { URL } = require("node:url");

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;
const HOST = "0.0.0.0";
const PORT = Number(process.argv[2] || 8080);
const ROOT_DIR = process.cwd();

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
};

function buildProxyCandidates(articleUrl) {
  const normalizedUrl = articleUrl.replace(/^https?:\/\//i, "");
  return [
    `https://r.jina.ai/http://${normalizedUrl}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(articleUrl)}`,
    `https://corsproxy.io/?${encodeURIComponent(articleUrl)}`,
  ];
}

function requestText(targetUrl, timeoutMs, insecureTls = false) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(targetUrl);
    const requester = urlObj.protocol === "https:" ? https : http;

    const req = requester.request(
      {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === "https:" ? 443 : 80),
        method: "GET",
        path: `${urlObj.pathname}${urlObj.search}`,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        },
        rejectUnauthorized: !insecureTls,
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf-8").trim();
          const statusCode = res.statusCode || 500;
          if (statusCode < 200 || statusCode >= 300) {
            const message = body ? `${statusCode}: ${body.slice(0, 180)}` : String(statusCode);
            reject(new Error(`upstream status ${message}`));
            return;
          }
          if (!body) {
            reject(new Error("empty response body"));
            return;
          }
          resolve(body);
        });
      }
    );

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`request timeout (${timeoutMs}ms)`));
    });

    req.on("error", reject);
    req.end();
  });
}

async function fetchRemoteText(articleUrl) {
  let lastError = null;

  for (const proxyUrl of buildProxyCandidates(articleUrl)) {
    for (let i = 0; i < MAX_RETRIES; i += 1) {
      try {
        const insecureTls = proxyUrl.includes("r.jina.ai/");
        const content = await requestText(proxyUrl, REQUEST_TIMEOUT_MS, insecureTls);
        return { content, proxyUrl, error: null };
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
      }
    }
  }

  return { content: null, proxyUrl: null, error: lastError };
}

function sendJson(res, statusCode, payload) {
  const data = Buffer.from(JSON.stringify(payload), "utf-8");
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": String(data.length),
    "Cache-Control": "no-store",
  });
  res.end(data);
}

function sanitizePathname(pathname) {
  const decoded = decodeURIComponent(pathname);
  const relative = decoded.replace(/^\/+/, "");
  const resolved = path.resolve(ROOT_DIR, relative || "index.html");
  if (!resolved.startsWith(ROOT_DIR)) {
    return null;
  }
  return resolved;
}

async function serveStatic(req, res, urlObj) {
  let filePath = sanitizePathname(urlObj.pathname);
  if (!filePath) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  try {
    const stat = await fsp.stat(filePath);
    if (stat.isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }

    const finalStat = await fsp.stat(filePath);
    if (!finalStat.isFile()) {
      throw new Error("Not a file");
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
      "Content-Length": String(finalStat.size),
      "Cache-Control": "no-cache",
    });
    fs.createReadStream(filePath).pipe(res);
  } catch (_error) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not Found");
  }
}

async function handleWx2mdApi(res, urlObj) {
  const articleUrl = (urlObj.searchParams.get("url") || "").trim();
  if (!articleUrl) {
    sendJson(res, 400, { ok: false, error: "missing url" });
    return;
  }

  let parsed;
  try {
    parsed = new URL(articleUrl);
  } catch (_error) {
    sendJson(res, 400, { ok: false, error: "invalid url" });
    return;
  }

  if (!["http:", "https:"].includes(parsed.protocol) || parsed.hostname !== "mp.weixin.qq.com") {
    sendJson(res, 400, { ok: false, error: "only mp.weixin.qq.com url is supported" });
    return;
  }

  const { content, proxyUrl, error } = await fetchRemoteText(articleUrl);
  if (!content) {
    sendJson(res, 502, {
      ok: false,
      error: "upstream unavailable",
      detail: error || "unknown error",
    });
    return;
  }

  sendJson(res, 200, {
    ok: true,
    content,
    proxy: proxyUrl,
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const urlObj = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);

    if (req.method === "GET" && urlObj.pathname === "/api/wx2md") {
      await handleWx2mdApi(res, urlObj);
      return;
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Method Not Allowed");
      return;
    }

    if (req.method === "HEAD") {
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      res.end();
      return;
    }

    await serveStatic(req, res, urlObj);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    sendJson(res, 500, { ok: false, error: "internal server error", detail: message });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Serving on http://127.0.0.1:${PORT}`);
});

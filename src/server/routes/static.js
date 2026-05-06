const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const { CLIENT_DIR } = require("../config");
const { MIME_TYPES } = require("../lib/mime-types");
const { sendText } = require("../lib/http");

const ROUTE_TO_FILE = {
  "/": "index.html",
  "/index": "index.html",
  "/md2rt": "md2rt.html",
  "/rt2md": "rt2md.html",
  "/wx2md": "wx2md.html",
};
const LEGACY_HTML_REDIRECTS = {
  "/index.html": "/",
  "/md2rt.html": "/md2rt",
  "/rt2md.html": "/rt2md",
  "/wx2md.html": "/wx2md",
};

function handleLegacyHtmlRedirect(pathname, res) {
  const redirectPath = LEGACY_HTML_REDIRECTS[pathname];
  if (!redirectPath) {
    return false;
  }
  res.writeHead(301, {
    Location: redirectPath,
    "Cache-Control": "no-store",
  });
  res.end();
  return true;
}

function resolveClientFile(pathname) {
  const cleanPath = pathname.split("?")[0];
  const mappedFile = ROUTE_TO_FILE[cleanPath];
  const relative = mappedFile || decodeURIComponent(cleanPath).replace(/^\/+/, "");
  const normalized = relative || "index.html";
  const absolutePath = path.resolve(CLIENT_DIR, normalized);
  if (!absolutePath.startsWith(CLIENT_DIR)) {
    return null;
  }
  return absolutePath;
}

async function serveStatic(urlObj, res) {
  if (handleLegacyHtmlRedirect(urlObj.pathname, res)) {
    return;
  }

  let filePath = resolveClientFile(urlObj.pathname);
  if (!filePath) {
    sendText(res, 403, "Forbidden");
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
    sendText(res, 404, "Not Found");
  }
}

module.exports = {
  serveStatic,
};

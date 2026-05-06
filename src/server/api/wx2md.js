const { URL } = require("node:url");
const { sendJson } = require("../lib/http");
const { fetchRemoteText } = require("../services/wx2md-service");

async function handleWx2mdApi(req, res, urlObj) {
  if (req.method !== "GET" || urlObj.pathname !== "/api/wx2md") {
    return false;
  }

  const articleUrl = (urlObj.searchParams.get("url") || "").trim();
  if (!articleUrl) {
    sendJson(res, 400, { ok: false, error: "missing url" });
    return true;
  }

  let parsed;
  try {
    parsed = new URL(articleUrl);
  } catch (_error) {
    sendJson(res, 400, { ok: false, error: "invalid url" });
    return true;
  }

  if (!["http:", "https:"].includes(parsed.protocol) || parsed.hostname !== "mp.weixin.qq.com") {
    sendJson(res, 400, { ok: false, error: "only mp.weixin.qq.com url is supported" });
    return true;
  }

  const { content, proxyUrl, error } = await fetchRemoteText(articleUrl);
  if (!content) {
    sendJson(res, 502, {
      ok: false,
      error: "upstream unavailable",
      detail: error || "unknown error",
    });
    return true;
  }

  sendJson(res, 200, {
    ok: true,
    content,
    proxy: proxyUrl,
  });
  return true;
}

module.exports = {
  handleWx2mdApi,
};

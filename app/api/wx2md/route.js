import { fetchRemoteText } from "../../../lib/wx2md-service";

export const runtime = "nodejs";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const articleUrl = (searchParams.get("url") || "").trim();

  if (!articleUrl) {
    return Response.json({ ok: false, error: "missing url" }, { status: 400 });
  }

  let parsed;
  try {
    parsed = new URL(articleUrl);
  } catch (_error) {
    return Response.json({ ok: false, error: "invalid url" }, { status: 400 });
  }

  if (!["http:", "https:"].includes(parsed.protocol) || parsed.hostname !== "mp.weixin.qq.com") {
    return Response.json(
      { ok: false, error: "only mp.weixin.qq.com url is supported" },
      { status: 400 }
    );
  }

  const { content, proxyUrl, error } = await fetchRemoteText(articleUrl);
  if (!content) {
    return Response.json(
      {
        ok: false,
        error: "upstream unavailable",
        detail: error || "unknown error",
      },
      { status: 502 }
    );
  }

  return Response.json({
    ok: true,
    content,
    proxy: proxyUrl,
  });
}

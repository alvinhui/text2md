import { NextRequest } from "next/server";
import { fetchRemoteText } from "../../../lib/wx2md-service";

type Wx2mdApiSuccess = {
  ok: true;
  content: string;
  proxy: string;
};

type Wx2mdApiError = {
  ok: false;
  error: string;
  detail?: string;
};

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const articleUrl = (searchParams.get("url") || "").trim();

  if (!articleUrl) {
    const payload: Wx2mdApiError = { ok: false, error: "missing url" };
    return Response.json(payload, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(articleUrl);
  } catch {
    const payload: Wx2mdApiError = { ok: false, error: "invalid url" };
    return Response.json(payload, { status: 400 });
  }

  if (!["http:", "https:"].includes(parsed.protocol) || parsed.hostname !== "mp.weixin.qq.com") {
    const payload: Wx2mdApiError = { ok: false, error: "only mp.weixin.qq.com url is supported" };
    return Response.json(payload, { status: 400 });
  }

  const { content, proxyUrl, error } = await fetchRemoteText(articleUrl);
  if (!content || !proxyUrl) {
    const payload: Wx2mdApiError = {
      ok: false,
      error: "upstream unavailable",
      detail: error || "unknown error",
    };
    return Response.json(payload, { status: 502 });
  }

  const payload: Wx2mdApiSuccess = {
    ok: true,
    content,
    proxy: proxyUrl,
  };
  return Response.json(payload);
}

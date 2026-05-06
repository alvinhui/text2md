import http from "node:http";
import https from "node:https";

const MAX_RETRIES = 1;
const REQUEST_TIMEOUT_MS = 6000;

type FetchRemoteTextSuccess = {
  content: string;
  proxyUrl: string;
  error: null;
  errorLogs: string[];
};

type FetchRemoteTextFailure = {
  content: null;
  proxyUrl: null;
  error: string;
  errorLogs: string[];
};

export type FetchRemoteTextResult = FetchRemoteTextSuccess | FetchRemoteTextFailure;

function buildProxyCandidates(articleUrl: string): string[] {
  const normalizedUrl = articleUrl.replace(/^https?:\/\//i, "");
  return [
    articleUrl,
    `https://r.jina.ai/http://${normalizedUrl}`,
    `https://r.jina.ai/https://${normalizedUrl}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(articleUrl)}`,
  ];
}

function requestText(
  targetUrl: string,
  timeoutMs: number,
  insecureTls = false,
  redirectsLeft = 3
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
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
        const statusCode = res.statusCode || 500;
        const location = typeof res.headers.location === "string" ? res.headers.location : "";

        if ([301, 302, 303, 307, 308].includes(statusCode) && location) {
          if (location.includes("wappoc_appmsgcaptcha")) {
            reject(new Error("wechat captcha required"));
            return;
          }
          if (redirectsLeft <= 0) {
            reject(new Error("too many redirects"));
            return;
          }
          const nextUrl = new URL(location, targetUrl).toString();
          const nextInsecureTls = insecureTls || nextUrl.includes("r.jina.ai/");
          res.resume();
          resolve(requestText(nextUrl, timeoutMs, nextInsecureTls, redirectsLeft - 1));
          return;
        }

        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf-8").trim();
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

export async function fetchRemoteText(articleUrl: string): Promise<FetchRemoteTextResult> {
  let lastError: string | null = null;
  const errorLogs: string[] = [];

  for (const proxyUrl of buildProxyCandidates(articleUrl)) {
    for (let i = 0; i < MAX_RETRIES; i += 1) {
      try {
        const insecureTls = proxyUrl.includes("r.jina.ai/");
        const content = await requestText(proxyUrl, REQUEST_TIMEOUT_MS, insecureTls);
        return { content, proxyUrl, error: null, errorLogs };
      } catch (error: unknown) {
        lastError = error instanceof Error ? error.message : String(error);
        errorLogs.push(`${new URL(proxyUrl).host}: ${lastError}`);
      }
    }
  }

  const friendlyError = errorLogs.length > 0 ? errorLogs.join(" | ") : lastError || "unknown error";
  return { content: null, proxyUrl: null, error: friendlyError, errorLogs };
}

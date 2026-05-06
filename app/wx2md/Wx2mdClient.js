"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
import { marked } from "marked";
import createDOMPurify from "dompurify";

const REQUEST_TIMEOUT_MS = 25000;

function createTurndownService() {
  const service = new TurndownService({
    headingStyle: "atx",
    hr: "---",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
  });
  service.use(gfm);
  return service;
}

function isWechatArticleUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname === "mp.weixin.qq.com";
  } catch (_error) {
    return false;
  }
}

function markdownFileName(url) {
  try {
    const parsed = new URL(url);
    const articleId = parsed.searchParams.get("mid") || parsed.searchParams.get("sn") || Date.now().toString();
    return `wechat-article-${articleId}.md`;
  } catch (_error) {
    return "wechat-article.md";
  }
}

function toMarkdownFromWechatHtml(htmlText, turndownService) {
  const doc = new DOMParser().parseFromString(htmlText, "text/html");
  const title =
    doc.querySelector("#activity-name")?.textContent?.trim() ||
    doc.querySelector("meta[property='og:title']")?.getAttribute("content") ||
    (doc.title || "").trim();

  const contentNode = doc.querySelector("#js_content") || doc.querySelector(".rich_media_content");
  if (!contentNode) {
    throw new Error("未找到文章正文节点（#js_content）");
  }

  const cloned = contentNode.cloneNode(true);
  cloned.querySelectorAll("script, style, noscript").forEach((node) => node.remove());
  cloned.querySelectorAll("img").forEach((img) => {
    const src = img.getAttribute("data-src") || img.getAttribute("data-original-src") || img.getAttribute("src");
    if (src) {
      img.setAttribute("src", src);
    }
  });

  let markdown = turndownService.turndown(cloned.innerHTML).trim();
  if (!markdown) {
    throw new Error("正文内容为空");
  }
  if (title) {
    markdown = `# ${title}\n\n${markdown}`;
  }
  return markdown;
}

function toMarkdownFromProxyResponse(responseText, turndownService) {
  const text = (responseText || "").trim();
  if (!text) {
    throw new Error("未获取到有效内容");
  }

  const looksLikeHtml = /<!doctype html|<html[\s>]|<body[\s>]|id=["']js_content["']/i.test(text);
  if (looksLikeHtml) {
    return toMarkdownFromWechatHtml(text, turndownService);
  }
  return text;
}

export default function Wx2mdClient() {
  const [wechatUrl, setWechatUrl] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [status, setStatus] = useState({ text: "", isError: false });
  const [converting, setConverting] = useState(false);
  const [viewMode, setViewMode] = useState("dual");
  const [copyText, setCopyText] = useState("复制 Markdown");

  const turndownService = useMemo(() => createTurndownService(), []);
  const previewHtml = useMemo(() => {
    const md = (markdown || "").trim();
    if (!md) {
      return "<p class=\"empty\">Markdown 预览会显示在这里</p>";
    }
    if (typeof window === "undefined") {
      return typeof marked.parse(md) === "string" ? marked.parse(md) : "";
    }
    const purifier = createDOMPurify(window);
    const rendered = marked.parse(md);
    const normalized = typeof rendered === "string" ? rendered : "";
    return purifier.sanitize(normalized, { USE_PROFILES: { html: true } });
  }, [markdown]);

  async function fetchWithTimeout(url, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { method: "GET", signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  async function convertWechatArticle() {
    const inputUrl = (wechatUrl || "").trim();
    if (!inputUrl) {
      setStatus({ text: "请先输入微信文章地址", isError: true });
      return;
    }
    if (!isWechatArticleUrl(inputUrl)) {
      setStatus({ text: "仅支持 mp.weixin.qq.com 的微信文章地址", isError: true });
      return;
    }

    setConverting(true);
    setStatus({ text: "正在通过本地中转抓取并转换，请稍候...", isError: false });

    try {
      const apiUrl = `/api/wx2md?url=${encodeURIComponent(inputUrl)}`;
      const response = await fetchWithTimeout(apiUrl, REQUEST_TIMEOUT_MS);
      if (!response.ok) {
        let detail = "";
        try {
          const errData = await response.json();
          detail = errData.detail || errData.error || "";
        } catch (_error) {
          detail = "";
        }
        throw new Error(`本地接口请求失败（${response.status}）${detail ? `：${detail}` : ""}`);
      }
      const data = await response.json();
      if (!data?.ok) {
        throw new Error(data?.detail || data?.error || "本地接口返回异常");
      }
      const nextMarkdown = toMarkdownFromProxyResponse(data.content, turndownService);
      setMarkdown(nextMarkdown);
      const proxyHost = data.proxy ? data.proxy.split("/")[2] : "";
      setStatus({
        text: `转换成功，可复制或下载 Markdown。${proxyHost ? `（代理：${proxyHost}）` : ""}`,
        isError: false,
      });
    } catch (error) {
      const message = String(error?.message || "");
      if (/wechat captcha required|wappoc_appmsgcaptcha|captcha/i.test(message)) {
        setStatus({
          text: "当前文章触发微信验证码校验，公开抓取链路无法直接获取正文。请稍后重试，或更换无需验证码的文章链接。",
          isError: true,
        });
      } else if (error?.name === "AbortError") {
        setStatus({ text: `请求超时（${REQUEST_TIMEOUT_MS / 1000} 秒），请稍后重试`, isError: true });
      } else {
        setStatus({ text: `转换失败：${message || "未知错误"}`, isError: true });
      }
    } finally {
      setConverting(false);
    }
  }

  return (
    <main className="container">
      <h1>富文本与Markdown在线双向转换工具</h1>
      <div className="mode-switch">
        <Link className="mode-btn" href="/rt2md">富文本 -&gt; Markdown</Link>
        <Link className="mode-btn" href="/md2rt">Markdown -&gt; 富文本</Link>
        <Link className="mode-btn active" href="/wx2md">微信文章 -&gt; Markdown</Link>
      </div>

      <section className="panel">
        <header className="panel-header">
          <div className="panel-title">输入公众号文章地址并转换为 Markdown</div>
        </header>
        <div className="panel-body">
          <div className="url-row">
            <input
              id="wechatUrl"
              type="url"
              placeholder="粘贴微信文章链接，例如 https://mp.weixin.qq.com/s/xxxx"
              value={wechatUrl}
              onChange={(event) => setWechatUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  convertWechatArticle();
                }
              }}
            />
            <button id="convertBtn" className="btn" type="button" onClick={convertWechatArticle} disabled={converting}>
              {converting ? "转换中..." : "开始转换"}
            </button>
          </div>

          <p id="status" className={status.isError ? "error" : ""}>{status.text}</p>

          <div className="actions">
            <button
              id="copyMarkdownBtn"
              className="btn"
              type="button"
              onClick={async () => {
                if (!markdown.trim()) return;
                await navigator.clipboard.writeText(markdown);
                setCopyText("已复制");
                setTimeout(() => setCopyText("复制 Markdown"), 1200);
              }}
            >
              {copyText}
            </button>
            <button
              id="downloadMarkdownBtn"
              className="btn btn-light"
              type="button"
              onClick={() => {
                if (!markdown.trim()) {
                  setStatus({ text: "暂无可下载内容，请先完成转换", isError: true });
                  return;
                }
                const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = markdownFileName(wechatUrl);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
                setStatus({ text: "文件已开始下载。", isError: false });
              }}
            >
              下载 .md 文件
            </button>
            <button
              id="clearBtn"
              className="btn btn-light"
              type="button"
              onClick={() => {
                setWechatUrl("");
                setMarkdown("");
                setStatus({ text: "", isError: false });
              }}
            >
              清空
            </button>
            <div className="view-switch">
              <button id="viewDualBtn" className={`view-btn ${viewMode === "dual" ? "active" : ""}`} type="button" onClick={() => setViewMode("dual")}>双栏</button>
              <button id="viewEditorBtn" className={`view-btn ${viewMode === "editor" ? "active" : ""}`} type="button" onClick={() => setViewMode("editor")}>仅编辑器</button>
              <button id="viewPreviewBtn" className={`view-btn ${viewMode === "preview" ? "active" : ""}`} type="button" onClick={() => setViewMode("preview")}>仅预览</button>
            </div>
          </div>

          <div id="resultGrid" className={`result-grid ${viewMode === "editor" ? "single-editor" : ""} ${viewMode === "preview" ? "single-preview" : ""}`}>
            <textarea
              id="markdownOutput"
              spellCheck={false}
              placeholder="转换结果会显示在这里"
              value={markdown}
              onChange={(event) => setMarkdown(event.target.value)}
            />
            <div id="markdownPreview" dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
        </div>
      </section>

      <p className="tip">
        当前页面会自动尝试多个公开代理抓取正文并转换为 Markdown。<br />
        若某个代理证书或网络异常，会自动切换到下一个代理。
      </p>
    </main>
  );
}

    const REQUEST_TIMEOUT_MS = 25000;

    const wechatUrlInput = document.querySelector("#wechatUrl");
    const convertBtn = document.querySelector("#convertBtn");
    const copyMarkdownBtn = document.querySelector("#copyMarkdownBtn");
    const downloadMarkdownBtn = document.querySelector("#downloadMarkdownBtn");
    const clearBtn = document.querySelector("#clearBtn");
    const viewDualBtn = document.querySelector("#viewDualBtn");
    const viewEditorBtn = document.querySelector("#viewEditorBtn");
    const viewPreviewBtn = document.querySelector("#viewPreviewBtn");
    const resultGrid = document.querySelector("#resultGrid");
    const markdownOutput = document.querySelector("#markdownOutput");
    const markdownPreview = document.querySelector("#markdownPreview");
    const statusEl = document.querySelector("#status");
    const turndownService = new TurndownService({
      headingStyle: "atx",
      hr: "---",
      bulletListMarker: "-",
      codeBlockStyle: "fenced"
    });
    turndownService.use(window.turndownPluginGfm.gfm);

    function setStatus(text, isError) {
      statusEl.textContent = text || "";
      statusEl.classList.toggle("error", Boolean(isError));
    }

    function isWechatArticleUrl(url) {
      try {
        const parsed = new URL(url);
        return parsed.hostname === "mp.weixin.qq.com";
      } catch (error) {
        return false;
      }
    }

    async function fetchWithTimeout(url, timeoutMs) {
      const controller = new AbortController();
      const timer = setTimeout(function () {
        controller.abort();
      }, timeoutMs);

      try {
        return await fetch(url, {
          method: "GET",
          signal: controller.signal
        });
      } finally {
        clearTimeout(timer);
      }
    }

    function toMarkdownFromWechatHtml(htmlText) {
      const doc = new DOMParser().parseFromString(htmlText, "text/html");
      const title =
        (doc.querySelector("#activity-name") && doc.querySelector("#activity-name").textContent.trim()) ||
        (doc.querySelector("meta[property='og:title']") && doc.querySelector("meta[property='og:title']").getAttribute("content")) ||
        (doc.title || "").trim();

      const contentNode = doc.querySelector("#js_content") || doc.querySelector(".rich_media_content");
      if (!contentNode) {
        throw new Error("未找到文章正文节点（#js_content）");
      }

      const cloned = contentNode.cloneNode(true);
      cloned.querySelectorAll("script, style, noscript").forEach(function (node) {
        node.remove();
      });
      cloned.querySelectorAll("img").forEach(function (img) {
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
        markdown = "# " + title + "\n\n" + markdown;
      }
      return markdown;
    }

    function toMarkdownFromProxyResponse(responseText) {
      const text = (responseText || "").trim();
      if (!text) {
        throw new Error("未获取到有效内容");
      }

      const looksLikeHtml = /<!doctype html|<html[\s>]|<body[\s>]|id=["']js_content["']/i.test(text);
      if (looksLikeHtml) {
        return toMarkdownFromWechatHtml(text);
      }
      return text;
    }

    function renderMarkdownPreview(mdText) {
      const markdown = (mdText || "").trim();
      if (!markdown) {
        markdownPreview.innerHTML = "<p class=\"empty\">Markdown 预览会显示在这里</p>";
        return;
      }
      const rendered = marked.parse(markdown);
      markdownPreview.innerHTML = DOMPurify.sanitize(rendered, {
        USE_PROFILES: { html: true }
      });
    }

    function setViewMode(mode) {
      resultGrid.classList.remove("single-editor", "single-preview");
      viewDualBtn.classList.toggle("active", mode === "dual");
      viewEditorBtn.classList.toggle("active", mode === "editor");
      viewPreviewBtn.classList.toggle("active", mode === "preview");

      if (mode === "editor") {
        resultGrid.classList.add("single-editor");
      } else if (mode === "preview") {
        resultGrid.classList.add("single-preview");
      }
    }

    async function requestViaLocalApi(articleUrl) {
      const apiUrl = "/api/wx2md?url=" + encodeURIComponent(articleUrl);
      const response = await fetchWithTimeout(apiUrl, REQUEST_TIMEOUT_MS);
      if (response.status === 404) {
        throw new Error("未检测到本地转换接口，请重启服务：npm run start");
      }
      if (!response.ok) {
        let detail = "";
        try {
          const errData = await response.json();
          detail = errData.detail || errData.error || "";
        } catch (error) {
          detail = "";
        }
        throw new Error("本地接口请求失败（" + response.status + "）" + (detail ? "：" + detail : ""));
      }

      const data = await response.json();
      if (!data || !data.ok) {
        throw new Error((data && (data.detail || data.error)) || "本地接口返回异常");
      }
      return data;
    }

    function fallbackCopyText(text) {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.setAttribute("readonly", "");
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      textArea.style.pointerEvents = "none";
      document.body.appendChild(textArea);
      textArea.select();
      textArea.setSelectionRange(0, text.length);
      const copied = document.execCommand("copy");
      document.body.removeChild(textArea);
      return copied;
    }

    async function copyText(text, button) {
      if (!text) return;
      let copied = false;
      try {
        if (window.isSecureContext && navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
          copied = true;
        } else {
          copied = fallbackCopyText(text);
        }
      } catch (error) {
        copied = fallbackCopyText(text);
        if (!copied) {
          console.error(error);
        }
      }

      if (!copied) {
        alert("复制失败，请检查浏览器权限后重试");
        return;
      }

      const oldText = button.textContent;
      button.textContent = "已复制";
      setTimeout(function () {
        button.textContent = oldText;
      }, 1200);
    }

    function markdownFileName(url) {
      try {
        const parsed = new URL(url);
        const articleId = parsed.searchParams.get("mid") || parsed.searchParams.get("sn") || Date.now().toString();
        return "wechat-article-" + articleId + ".md";
      } catch (error) {
        return "wechat-article.md";
      }
    }

    async function convertWechatArticle() {
      const inputUrl = (wechatUrlInput.value || "").trim();
      if (!inputUrl) {
        setStatus("请先输入微信文章地址", true);
        return;
      }

      if (!isWechatArticleUrl(inputUrl)) {
        setStatus("仅支持 mp.weixin.qq.com 的微信文章地址", true);
        return;
      }

      convertBtn.disabled = true;
      setStatus("正在通过本地中转抓取并转换，请稍候...");

      try {
        const data = await requestViaLocalApi(inputUrl);
        const markdown = toMarkdownFromProxyResponse(data.content);
        if (!markdown) {
          throw new Error("未获取到可用 Markdown");
        }

        markdownOutput.value = markdown;
        renderMarkdownPreview(markdown);
        const proxyHost = data.proxy ? data.proxy.split("/")[2] : "";
        setStatus("转换成功，可复制或下载 Markdown。" + (proxyHost ? "（代理：" + proxyHost + "）" : ""));
      } catch (error) {
        console.error(error);
        const message = String((error && error.message) || "");
        if (/wechat captcha required|wappoc_appmsgcaptcha|captcha/i.test(message)) {
          setStatus("当前文章触发微信验证码校验，公开抓取链路无法直接获取正文。请稍后重试，或更换无需验证码的文章链接。", true);
          return;
        }
        if (error && error.name === "AbortError") {
          setStatus("请求超时（" + (REQUEST_TIMEOUT_MS / 1000) + " 秒），请稍后重试", true);
        } else {
          setStatus("转换失败：" + (error.message || "未知错误"), true);
        }
      } finally {
        convertBtn.disabled = false;
      }
    }

    convertBtn.addEventListener("click", convertWechatArticle);

    wechatUrlInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        convertWechatArticle();
      }
    });

    copyMarkdownBtn.addEventListener("click", function () {
      copyText(markdownOutput.value, copyMarkdownBtn);
    });

    markdownOutput.addEventListener("input", function () {
      renderMarkdownPreview(markdownOutput.value);
    });

    viewDualBtn.addEventListener("click", function () {
      setViewMode("dual");
    });

    viewEditorBtn.addEventListener("click", function () {
      setViewMode("editor");
    });

    viewPreviewBtn.addEventListener("click", function () {
      setViewMode("preview");
    });

    downloadMarkdownBtn.addEventListener("click", function () {
      const markdown = markdownOutput.value || "";
      if (!markdown.trim()) {
        setStatus("暂无可下载内容，请先完成转换", true);
        return;
      }

      const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = markdownFileName(wechatUrlInput.value || "");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      setStatus("文件已开始下载。");
    });

    clearBtn.addEventListener("click", function () {
      wechatUrlInput.value = "";
      markdownOutput.value = "";
      renderMarkdownPreview("");
      setStatus("");
    });

    renderMarkdownPreview("");
    setViewMode("dual");

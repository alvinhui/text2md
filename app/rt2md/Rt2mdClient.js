"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

const codeLanguageOptions = [
  { value: "plain", label: "Plain Text" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "scala", label: "Scala" },
  { value: "sql", label: "SQL" },
  { value: "bash", label: "Bash" },
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "xml", label: "XML" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "markdown", label: "Markdown" },
];

const codeThemeOptions = [
  { value: "yuque-light-pro", label: "Yuque Light Pro" },
  { value: "yuque-dark-pro", label: "Yuque Dark Pro" },
  { value: "github-light", label: "GitHub Light" },
  { value: "dracula", label: "Dracula" },
];

function getFenceByCode(codeText) {
  const matches = codeText.match(/`+/g) || [];
  const maxTickLength = matches.reduce((max, item) => Math.max(max, item.length), 0);
  return "`".repeat(Math.max(3, maxTickLength + 1));
}

function getCodeLanguageFromNode(node) {
  const fromData = (node.getAttribute("data-code-language") || "").trim().toLowerCase();
  if (fromData) return fromData;
  const classText = (node.className || "").toLowerCase();
  const classMatch = classText.match(/language-([\w-]+)/);
  return classMatch ? classMatch[1] : "plain";
}

function getCodeThemeFromNode(node) {
  const fromData = (node.getAttribute("data-code-theme") || "").trim().toLowerCase();
  if (!fromData) return "yuque-light-pro";
  return codeThemeOptions.some((item) => item.value === fromData) ? fromData : "yuque-light-pro";
}

function getCodeThemeLabel(themeValue) {
  const hit = codeThemeOptions.find((item) => item.value === themeValue);
  return hit ? hit.label : "Yuque Light Pro";
}

export default function Rt2mdClient() {
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const [markdown, setMarkdown] = useState("");
  const [copyMdText, setCopyMdText] = useState("复制Markdown源码");
  const [copyTextBtn, setCopyTextBtn] = useState("清空并复制文本");
  const [activeCodeMeta, setActiveCodeMeta] = useState({ language: "plain", theme: "yuque-light-pro" });
  const [hasActiveCodeBlock, setHasActiveCodeBlock] = useState(false);

  const turndownServiceRef = useRef(null);

  useEffect(() => {
    turndownServiceRef.current = new TurndownService({
      headingStyle: "atx",
      hr: "---",
      bulletListMarker: "-",
      codeBlockStyle: "fenced",
    });
    turndownServiceRef.current.use(gfm);
    turndownServiceRef.current.addRule("codeBlockWithLanguage", {
      filter(node) {
        const isPre = node.nodeName === "PRE";
        const hasQuillSyntax = isPre && node.classList && node.classList.contains("ql-syntax");
        const hasLanguageHint =
          isPre &&
          (node.hasAttribute("data-code-language") || /language-[\w-]+/i.test(node.className || ""));
        return hasQuillSyntax || hasLanguageHint;
      },
      replacement(_content, node) {
        const codeText = (node.textContent || "").replace(/\n$/, "");
        const language = getCodeLanguageFromNode(node);
        const fence = getFenceByCode(codeText);
        const langToken = language === "plain" ? "" : language;
        return `\n\n${fence}${langToken}\n${codeText}\n${fence}\n\n`;
      },
    });
  }, []);

  const ensureCodeLanguageMetadata = useCallback(() => {
    if (!quillRef.current) return;
    quillRef.current.root.querySelectorAll("pre.ql-syntax").forEach((pre) => {
      if (!pre.getAttribute("data-code-language")) {
        pre.setAttribute("data-code-language", "plain");
      }
      if (!pre.getAttribute("data-code-theme")) {
        pre.setAttribute("data-code-theme", "yuque-light-pro");
      }
      const theme = getCodeThemeFromNode(pre);
      pre.setAttribute("data-code-theme-label", getCodeThemeLabel(theme));
    });
  }, []);

  const toMarkdown = useCallback(() => {
    if (!quillRef.current || !turndownServiceRef.current) return;
    ensureCodeLanguageMetadata();
    const html = quillRef.current.root.innerHTML;
    setMarkdown(turndownServiceRef.current.turndown(html).trim());
  }, [ensureCodeLanguageMetadata]);

  const getActiveCodeBlock = useCallback(() => {
    if (!quillRef.current) return null;
    const range = quillRef.current.getSelection();
    if (!range) return null;
    const [line] = quillRef.current.getLine(range.index);
    if (!line?.domNode || !(line.domNode instanceof HTMLElement)) return null;
    if (line.domNode.tagName === "PRE") return line.domNode;
    return line.domNode.closest("pre.ql-syntax");
  }, []);

  useEffect(() => {
    let mounted = true;
    async function setup() {
      const { default: Quill } = await import("quill");
      if (!mounted || !editorRef.current) return;
      const quill = new Quill(editorRef.current, {
        theme: "snow",
        placeholder: "请粘贴或编辑富文本内容...",
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline", "strike"],
            [{ list: "ordered" }, { list: "bullet" }],
            [{ indent: "-1" }, { indent: "+1" }],
            ["blockquote", "code-block"],
            ["link", "image"],
            ["clean"],
          ],
        },
      });
      quillRef.current = quill;

      quill.on("text-change", () => {
        toMarkdown();
        const codeBlock = getActiveCodeBlock();
        if (codeBlock) {
          setHasActiveCodeBlock(true);
          setActiveCodeMeta({
            language: getCodeLanguageFromNode(codeBlock),
            theme: getCodeThemeFromNode(codeBlock),
          });
        } else {
          setHasActiveCodeBlock(false);
        }
      });

      quill.on("selection-change", () => {
        const codeBlock = getActiveCodeBlock();
        if (!codeBlock) {
          setHasActiveCodeBlock(false);
          return;
        }
        setHasActiveCodeBlock(true);
        setActiveCodeMeta({
          language: getCodeLanguageFromNode(codeBlock),
          theme: getCodeThemeFromNode(codeBlock),
        });
      });

      quill.clipboard.dangerouslyPasteHTML(`
        <h2>2.1 网络耗时</h2>
        <h3>2.1.1 请求发出前（客户端→Node）</h3>
        <ul>
          <li>DNS 解析：50~200ms（已缓存更快）</li>
          <li>TCP/TLS 建连：100~400ms（跨地域更慢）</li>
        </ul>
        <pre class="ql-syntax" spellcheck="false" data-code-language="javascript">const latency = await getNetworkLatency();</pre>
      `);

      ensureCodeLanguageMetadata();
      toMarkdown();
    }
    setup();
    return () => {
      mounted = false;
      quillRef.current = null;
    };
  }, [ensureCodeLanguageMetadata, getActiveCodeBlock, toMarkdown]);

  const applyCodeMeta = useCallback((nextLanguage, nextTheme) => {
    const block = getActiveCodeBlock();
    if (!block) return;
    if (nextLanguage) {
      block.setAttribute("data-code-language", nextLanguage);
    }
    if (nextTheme) {
      block.setAttribute("data-code-theme", nextTheme);
      block.setAttribute("data-code-theme-label", getCodeThemeLabel(nextTheme));
    }
    toMarkdown();
  }, [getActiveCodeBlock, toMarkdown]);

  const copyText = useCallback(async (text) => {
    if (!text) return false;
    await navigator.clipboard.writeText(text);
    return true;
  }, []);

  return (
    <main className="container">
      <h1>富文本与Markdown在线双向转换工具</h1>
      <div className="mode-switch">
        <Link className="mode-btn active" href="/rt2md">富文本 -&gt; Markdown</Link>
        <Link className="mode-btn" href="/md2rt">Markdown -&gt; 富文本</Link>
        <Link className="mode-btn" href="/wx2md">微信文章 -&gt; Markdown</Link>
      </div>

      <section className="panels">
        <article className="panel">
          <header className="panel-header">
            <div className="panel-title">Rich Text Editor</div>
            <button
              id="copyRichBtn"
              className="btn"
              type="button"
              onClick={async () => {
                const plainText = quillRef.current?.getText().trim() || "";
                await copyText(plainText);
                setCopyTextBtn("已复制");
                setTimeout(() => setCopyTextBtn("清空并复制文本"), 1200);
                quillRef.current?.setText("");
                toMarkdown();
              }}
            >
              {copyTextBtn}
            </button>
          </header>
          <div className="editor-wrap">
            <div className={`code-floating-toolbar ${hasActiveCodeBlock ? "visible" : ""}`}>
              <span className="toolbar-label">语言</span>
              <select
                id="floatingCodeLanguage"
                value={activeCodeMeta.language}
                onChange={(event) => {
                  const value = event.target.value || "plain";
                  setActiveCodeMeta((prev) => ({ ...prev, language: value }));
                  applyCodeMeta(value, null);
                }}
              >
                {codeLanguageOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
              <span className="toolbar-label">皮肤</span>
              <select
                id="floatingCodeTheme"
                value={activeCodeMeta.theme}
                onChange={(event) => {
                  const value = event.target.value || "yuque-light-pro";
                  setActiveCodeMeta((prev) => ({ ...prev, theme: value }));
                  applyCodeMeta(null, value);
                }}
              >
                {codeThemeOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>
            <div id="editor" ref={editorRef} />
          </div>
        </article>

        <article className="panel">
          <header className="panel-header">
            <div className="panel-title">Markdown Output</div>
            <button
              id="copyMarkdownBtn"
              className="btn"
              type="button"
              onClick={async () => {
                await copyText(markdown);
                setCopyMdText("已复制");
                setTimeout(() => setCopyMdText("复制Markdown源码"), 1200);
              }}
            >
              {copyMdText}
            </button>
          </header>
          <div className="markdown-wrap">
            <textarea id="markdownOutput" spellCheck={false} value={markdown} readOnly />
          </div>
        </article>
      </section>
      <p className="tip">当前为富文本转 Markdown 页面，点击上方切换可跳到其他工具页面。</p>
    </main>
  );
}

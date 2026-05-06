"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import c from "highlight.js/lib/languages/c";
import cpp from "highlight.js/lib/languages/cpp";
import csharp from "highlight.js/lib/languages/csharp";
import css from "highlight.js/lib/languages/css";
import go from "highlight.js/lib/languages/go";
import html from "highlight.js/lib/languages/xml";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import kotlin from "highlight.js/lib/languages/kotlin";
import markdown from "highlight.js/lib/languages/markdown";
import php from "highlight.js/lib/languages/php";
import python from "highlight.js/lib/languages/python";
import ruby from "highlight.js/lib/languages/ruby";
import rust from "highlight.js/lib/languages/rust";
import scala from "highlight.js/lib/languages/scala";
import sql from "highlight.js/lib/languages/sql";
import swift from "highlight.js/lib/languages/swift";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";

type CodeLanguageOption = {
  value: string;
  label: string;
};

type CodeThemeOption = {
  value: string;
  label: string;
};

type QuillLanguageOption = {
  key: string;
  label: string;
};

type ActiveCodeMeta = {
  language: string;
  theme: string;
};

type QuillRange = {
  index: number;
  length: number;
};

type QuillLine = {
  domNode: Node;
};

type QuillSyntaxModule = {
  highlight(blot?: unknown, force?: boolean): void;
};

type QuillRoot = HTMLElement & {
  innerHTML: string;
  querySelectorAll<E extends Element = Element>(selectors: string): NodeListOf<E>;
};

type QuillInstance = {
  root: QuillRoot;
  on(eventName: "text-change" | "selection-change", handler: () => void): void;
  getSelection(): QuillRange | null;
  getLine(index: number): [QuillLine | null, number];
  getModule(name: "syntax"): QuillSyntaxModule;
  getText(): string;
  setText(text: string): void;
  clipboard: {
    dangerouslyPasteHTML(html: string): void;
  };
};

type QuillConstructor = new (
  element: HTMLElement,
  options: {
    theme: "snow";
    placeholder: string;
    modules: {
      syntax: {
        hljs: typeof hljs;
        languages: QuillLanguageOption[];
      };
      toolbar: Array<unknown>;
    };
  }
) => QuillInstance;

const codeLanguageOptions: CodeLanguageOption[] = [
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

const codeThemeOptions: CodeThemeOption[] = [
  { value: "yuque-light-pro", label: "Yuque Light Pro" },
  { value: "yuque-dark-pro", label: "Yuque Dark Pro" },
  { value: "github-light", label: "GitHub Light" },
  { value: "dracula", label: "Dracula" },
];
const quillLanguageOptions: QuillLanguageOption[] = codeLanguageOptions.map(({ value, label }) => ({
  key: value,
  label,
}));
const CODE_BLOCK_SELECTOR = "pre.ql-syntax, .ql-code-block-container";
const HIGHLIGHT_AUTO_LANGUAGES = codeLanguageOptions
  .map((item) => item.value)
  .filter((language) => language !== "plain");
const initialRichTextHtml = `
  <h1>富文本转 Markdown 示例文档</h1>
  <h2>1. 基础排版</h2>
  <p>这是一段普通正文，包含 <strong>加粗</strong>、<em>斜体</em>、<u>下划线</u>、<s>删除线</s> 和 <a href="https://commonmark.org/">链接</a>。</p>
  <h3>1.1 无序列表</h3>
  <ul>
    <li>保留段落、列表、引用和链接结构</li>
    <li>自动识别代码块语言并输出 fenced code block</li>
    <li>在右侧实时生成 Markdown 源码</li>
  </ul>
  <h3>1.2 有序列表</h3>
  <ol>
    <li>粘贴富文本内容</li>
    <li>检查代码块语言和主题</li>
    <li>复制 Markdown 结果</li>
  </ol>
  <h4>1.2.1 引用</h4>
  <blockquote>保持内容结构清晰，转换结果才更容易继续编辑。</blockquote>
  <h5>1.2.1.1 代码块示例</h5>
  <pre class="ql-syntax" spellcheck="false" data-code-language="javascript" data-language="javascript">const latency = await getNetworkLatency();
console.log(\`network latency: \${latency}ms\`);</pre>
  <h6>1.2.1.1.1 配置片段</h6>
  <pre class="ql-syntax" spellcheck="false" data-code-language="json" data-language="json">{
  "mode": "rt2md",
  "syntaxHighlight": true,
  "headingDepth": 6
}</pre>
`;

function normalizeCodeLanguage(language: string): string {
  return codeLanguageOptions.some((item) => item.value === language) ? language : "plain";
}
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("java", java);
hljs.registerLanguage("c", c);
hljs.registerLanguage("cpp", cpp);
hljs.registerLanguage("csharp", csharp);
hljs.registerLanguage("go", go);
hljs.registerLanguage("rust", rust);
hljs.registerLanguage("php", php);
hljs.registerLanguage("ruby", ruby);
hljs.registerLanguage("swift", swift);
hljs.registerLanguage("kotlin", kotlin);
hljs.registerLanguage("scala", scala);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("json", json);
hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("html", html);
hljs.registerLanguage("css", css);
hljs.registerLanguage("markdown", markdown);

function getFenceByCode(codeText: string): string {
  const matches = codeText.match(/`+/g) || [];
  const maxTickLength = matches.reduce((max, item) => Math.max(max, item.length), 0);
  return "`".repeat(Math.max(3, maxTickLength + 1));
}

function getCodeLanguageFromNode(node: Element): string {
  const fromData = (node.getAttribute("data-code-language") || "").trim().toLowerCase();
  if (fromData) return normalizeCodeLanguage(fromData);
  const fromSyntax = (node.getAttribute("data-language") || "").trim().toLowerCase();
  if (fromSyntax) return normalizeCodeLanguage(fromSyntax);
  const firstLineLanguage = (
    node.querySelector<HTMLElement>(".ql-code-block")?.getAttribute("data-language") || ""
  )
    .trim()
    .toLowerCase();
  if (firstLineLanguage) return normalizeCodeLanguage(firstLineLanguage);
  const classText = (node.getAttribute("class") || "").toLowerCase();
  const classMatch = classText.match(/language-([\w-]+)/);
  return classMatch ? normalizeCodeLanguage(classMatch[1]) : "plain";
}

function getCodeThemeFromNode(node: Element): string {
  const fromData = (node.getAttribute("data-code-theme") || "").trim().toLowerCase();
  if (!fromData) return "yuque-light-pro";
  return codeThemeOptions.some((item) => item.value === fromData) ? fromData : "yuque-light-pro";
}

function getCodeThemeLabel(themeValue: string): string {
  const hit = codeThemeOptions.find((item) => item.value === themeValue);
  return hit ? hit.label : "Yuque Light Pro";
}

function getCodeTextFromBlock(block: HTMLElement): string {
  if (block.classList.contains("ql-code-block-container")) {
    return Array.from(block.querySelectorAll<HTMLElement>(".ql-code-block"))
      .map((line) => line.textContent || "")
      .join("\n")
      .replace(/\n$/, "");
  }

  const clone = block.cloneNode(true) as HTMLElement;
  clone.querySelectorAll(".ql-ui").forEach((node) => node.remove());
  return (clone.innerText || clone.textContent || "").replace(/\n$/, "");
}

function detectCodeLanguage(codeText: string): string {
  if (!codeText.trim()) return "plain";

  const result = hljs.highlightAuto(codeText, HIGHLIGHT_AUTO_LANGUAGES);
  return normalizeCodeLanguage(result.language || "plain");
}

function applySyntaxLanguage(block: HTMLElement, language: string): void {
  const syntaxLanguage = normalizeCodeLanguage(language);
  block.setAttribute("data-code-language", syntaxLanguage);
  block.setAttribute("data-language", syntaxLanguage);

  if (block.classList.contains("ql-code-block-container")) {
    block.querySelectorAll<HTMLElement>(".ql-code-block").forEach((line) => {
      line.setAttribute("data-code-language", syntaxLanguage);
      line.setAttribute("data-language", syntaxLanguage);
    });
  }
}

function forceSyntaxHighlight(quill: QuillInstance | null): void {
  try {
    quill?.getModule("syntax").highlight(undefined, true);
  } catch {
    // Ignore highlight runtime errors to avoid breaking editor interaction.
  }
}

export default function Rt2mdClient() {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const editorWrapRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<QuillInstance | null>(null);
  const turndownServiceRef = useRef<TurndownService | null>(null);

  const [markdown, setMarkdown] = useState<string>("");
  const [copyMdText, setCopyMdText] = useState<string>("复制Markdown源码");
  const [copyTextBtn, setCopyTextBtn] = useState<string>("清空并复制文本");
  const [activeCodeMeta, setActiveCodeMeta] = useState<ActiveCodeMeta>({
    language: "plain",
    theme: "yuque-light-pro",
  });
  const [hasActiveCodeBlock, setHasActiveCodeBlock] = useState<boolean>(false);
  const [toolbarPosition, setToolbarPosition] = useState<{ left: number; top: number }>({
    left: 8,
    top: 8,
  });

  useEffect(() => {
    const service = new TurndownService({
      headingStyle: "atx",
      hr: "---",
      bulletListMarker: "-",
      codeBlockStyle: "fenced",
    });
    service.use(gfm as never);
    service.addRule("codeBlockWithLanguage", {
      filter(node: Node) {
        const elementNode = node as Element;
        const isPre = elementNode.nodeName === "PRE";
        const isCodeBlockContainer = elementNode.classList.contains("ql-code-block-container");
        const classList = elementNode.classList;
        const hasQuillSyntax = Boolean(isPre && classList && classList.contains("ql-syntax"));
        const hasLanguageHint = Boolean(
          (isPre || isCodeBlockContainer) &&
            (elementNode.hasAttribute("data-code-language") ||
              /language-[\w-]+/i.test(elementNode.getAttribute("class") || ""))
        );
        return hasQuillSyntax || isCodeBlockContainer || hasLanguageHint;
      },
      replacement(_content: string, node: Node) {
        const elementNode = node as HTMLElement;
        const codeText = getCodeTextFromBlock(elementNode);
        const language = getCodeLanguageFromNode(elementNode);
        const fence = getFenceByCode(codeText);
        const langToken = language === "plain" ? "" : language;
        return `\n\n${fence}${langToken}\n${codeText}\n${fence}\n\n`;
      },
    });
    turndownServiceRef.current = service;
  }, []);

  const ensureCodeLanguageMetadata = useCallback(() => {
    const quill = quillRef.current;
    if (!quill) return;
    quill.root.querySelectorAll<HTMLElement>(CODE_BLOCK_SELECTOR).forEach((block) => {
      const currentLanguage = getCodeLanguageFromNode(block);
      const hasExplicitLanguage =
        Boolean(block.getAttribute("data-code-language")) ||
        Boolean(
          block.getAttribute("data-language") &&
            block.getAttribute("data-language") !== "plain"
        ) ||
        Boolean(
          block.querySelector<HTMLElement>(".ql-code-block")?.getAttribute("data-language") &&
            block.querySelector<HTMLElement>(".ql-code-block")?.getAttribute("data-language") !==
              "plain"
        );
      const language =
        hasExplicitLanguage || currentLanguage !== "plain"
          ? currentLanguage
          : detectCodeLanguage(getCodeTextFromBlock(block));
      applySyntaxLanguage(block, language);
      if (!block.getAttribute("data-code-theme")) {
        block.setAttribute("data-code-theme", "yuque-light-pro");
      }
      const theme = getCodeThemeFromNode(block);
      block.setAttribute("data-code-theme-label", getCodeThemeLabel(theme));
    });
  }, []);

  const toMarkdown = useCallback(() => {
    const quill = quillRef.current;
    const service = turndownServiceRef.current;
    if (!quill || !service) return;
    ensureCodeLanguageMetadata();
    setMarkdown(service.turndown(quill.root.innerHTML).trim());
  }, [ensureCodeLanguageMetadata]);

  const getActiveCodeBlock = useCallback((): HTMLElement | null => {
    const quill = quillRef.current;
    if (!quill) return null;
    const range = quill.getSelection();
    if (!range) return null;
    const [line] = quill.getLine(range.index);
    const lineNode = line?.domNode;
    if (!lineNode || !(lineNode instanceof HTMLElement)) return null;
    if (lineNode.matches(CODE_BLOCK_SELECTOR)) return lineNode;
    return lineNode.closest(CODE_BLOCK_SELECTOR);
  }, []);

  const updateFloatingToolbarPosition = useCallback(() => {
    const wrap = editorWrapRef.current;
    const block = getActiveCodeBlock();
    if (!wrap || !block) return;

    const wrapRect = wrap.getBoundingClientRect();
    const blockRect = block.getBoundingClientRect();
    const panelWidth = 360;
    let left = blockRect.left - wrapRect.left;
    let top = blockRect.top - wrapRect.top - 42;

    if (top < 50) {
      top = blockRect.bottom - wrapRect.top + 6;
    }
    left = Math.max(8, Math.min(left, wrapRect.width - panelWidth - 8));

    setToolbarPosition({ left, top });
  }, [getActiveCodeBlock]);

  useEffect(() => {
    let mounted = true;
    let dispose: (() => void) | undefined;
    async function setup() {
      const quillModule = await import("quill");
      const Quill = quillModule.default as unknown as QuillConstructor;
      if (!mounted || !editorRef.current) return;

      const quill = new Quill(editorRef.current, {
        theme: "snow",
        placeholder: "请粘贴或编辑富文本内容...",
        modules: {
          syntax: {
            hljs,
            languages: quillLanguageOptions,
          },
          toolbar: [
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
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
        window.setTimeout(() => forceSyntaxHighlight(quillRef.current), 0);
        const codeBlock = getActiveCodeBlock();
        if (codeBlock) {
          setHasActiveCodeBlock(true);
          setActiveCodeMeta({
            language: getCodeLanguageFromNode(codeBlock),
            theme: getCodeThemeFromNode(codeBlock),
          });
          updateFloatingToolbarPosition();
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
        updateFloatingToolbarPosition();
      });

      quill.clipboard.dangerouslyPasteHTML(initialRichTextHtml);

      ensureCodeLanguageMetadata();
      forceSyntaxHighlight(quill);
      toMarkdown();
      updateFloatingToolbarPosition();

      const onWindowResize = () => {
        updateFloatingToolbarPosition();
      };
      const editorScroller = quill.root;
      const onEditorScroll = () => {
        updateFloatingToolbarPosition();
      };
      window.addEventListener("resize", onWindowResize);
      editorScroller.addEventListener("scroll", onEditorScroll);

      dispose = () => {
        window.removeEventListener("resize", onWindowResize);
        editorScroller.removeEventListener("scroll", onEditorScroll);
      };
    }
    void setup();
    return () => {
      mounted = false;
      dispose?.();
      quillRef.current = null;
    };
  }, [ensureCodeLanguageMetadata, getActiveCodeBlock, toMarkdown, updateFloatingToolbarPosition]);

  const applyCodeMeta = useCallback(
    (nextLanguage: string | null, nextTheme: string | null) => {
      const block = getActiveCodeBlock();
      if (!block) return;
      if (nextLanguage) {
        block.setAttribute("data-code-language", nextLanguage);
        applySyntaxLanguage(block, nextLanguage);
        forceSyntaxHighlight(quillRef.current);
      }
      if (nextTheme) {
        block.setAttribute("data-code-theme", nextTheme);
        block.setAttribute("data-code-theme-label", getCodeThemeLabel(nextTheme));
      }
      toMarkdown();
      updateFloatingToolbarPosition();
    },
    [getActiveCodeBlock, toMarkdown, updateFloatingToolbarPosition]
  );

  const copyText = useCallback(async (text: string): Promise<boolean> => {
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
          <div className="editor-wrap" ref={editorWrapRef}>
            <div
              className={`code-floating-toolbar ${hasActiveCodeBlock ? "visible" : ""}`}
              style={{ left: `${toolbarPosition.left}px`, top: `${toolbarPosition.top}px` }}
            >
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

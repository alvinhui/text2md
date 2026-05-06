"use client";

import createDOMPurify from "dompurify";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
import PreviewSurface from "../components/PreviewSurface";
import ToolModeSwitch from "../components/ToolModeSwitch";
import { copyWithFallback } from "../utils/copy";
import { renderMarkdownToHtml } from "../utils/markdown-renderer";
import { flashText } from "../utils/ui-feedback";
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

type OutputView = "markdown" | "preview";

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
  <h1>Markdown 转富文本示例</h1>
  <p>这是一个语雀风格的双栏编辑区，左侧写 Markdown，右侧自动转为富文本。这个示例覆盖常用排版、表格、任务列表和多语言代码块，方便初始化后直接试复制效果。</p>
  <h2>发布清单</h2>
  <ul data-checked="true">
    <li>完成正文结构</li>
    <li>添加表格和引用</li>
  </ul>
  <ul data-checked="false">
    <li>补充配图与发布渠道</li>
    <li>让同事复核技术细节</li>
  </ul>
  <blockquote>提示：右侧是可编辑富文本区域，复制 HTML 后可粘贴到支持富文本的编辑器中继续处理。</blockquote>
  <h2>内容结构</h2>
  <ol>
    <li>开头用 <strong>加粗文案</strong> 点明结论</li>
    <li>中间用表格对比关键数据</li>
    <li>结尾放行动项和代码片段</li>
  </ol>
  <p>你也可以混合行内代码，比如 <code>calculateReadingTime(article)</code>，或放一个链接：<a href="https://example.com">Text2MD</a>。</p>
  <table>
    <tbody>
      <tr>
        <td>字段</td>
        <td>说明</td>
      </tr>
      <tr>
        <td>标题</td>
        <td>支持 H1 - H6</td>
      </tr>
      <tr>
        <td>列表</td>
        <td>支持有序、无序和任务列表</td>
      </tr>
      <tr>
        <td>表格</td>
        <td>表格会保留表头、边框和隔行底色</td>
      </tr>
      <tr>
        <td>code</td>
        <td>行内代码如 <code>test(123)</code>，代码块支持语法高亮</td>
      </tr>
    </tbody>
  </table>
  <h2>JavaScript 示例</h2>
  <pre class="ql-syntax" spellcheck="false" data-code-language="javascript" data-language="javascript">const tasks = ["parse markdown", "sanitize html", "highlight code"];

for (const task of tasks) {
  console.log(\`done: \${task}\`);
}</pre>
  <h2>TypeScript 示例</h2>
  <pre class="ql-syntax" spellcheck="false" data-code-language="typescript" data-language="typescript">type ArticleMeta = {
  title: string;
  tags: string[];
  publishedAt?: string;
};

function getSummary(meta: ArticleMeta): string {
  return \`\${meta.title} · \${meta.tags.join(" / ")}\`;
}</pre>
  <h2>JSON 配置</h2>
  <pre class="ql-syntax" spellcheck="false" data-code-language="json" data-language="json">{
  "output": "rich-text",
  "syntaxHighlight": true,
  "theme": "github-dark"
}</pre>
  <hr>
  <p>最后可以用分割线收束内容，并补一句结论：Markdown 负责结构，富文本负责交付。</p>
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

function escapeMarkdownTableCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
}

function tableToMarkdown(table: HTMLElement): string {
  const rows = Array.from(table.querySelectorAll("tr"))
    .map((row) =>
      Array.from(row.querySelectorAll("th, td")).map((cell) =>
        escapeMarkdownTableCell(cell.textContent || "")
      )
    )
    .filter((cells) => cells.some(Boolean));

  if (rows.length === 0) return "";

  const columnCount = Math.max(...rows.map((cells) => cells.length));
  const normalizedRows = rows.map((cells) => {
    const nextCells = [...cells];
    while (nextCells.length < columnCount) nextCells.push("");
    return nextCells;
  });
  const [header, ...bodyRows] = normalizedRows;
  const divider = Array.from({ length: columnCount }, () => "---");
  const markdownRows = [header, divider, ...bodyRows].map((cells) => `| ${cells.join(" | ")} |`);

  return `\n\n${markdownRows.join("\n")}\n\n`;
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
  const normalizeCodeLineWhitespace = (value: string): string =>
    value
      .replace(/\u00a0/g, " ")
      .replace(/[\u200b\u200c\u200d\ufeff]/g, "");

  const extractExactLineText = (line: HTMLElement): string => {
    let result = "";
    line.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        result += node.nodeValue || "";
        return;
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        if (element.classList.contains("ql-tab")) {
          result += "\t";
          return;
        }
        result += element.textContent || "";
      }
    });
    return result;
  };

  if (block.classList.contains("ql-code-block-container")) {
    return Array.from(block.querySelectorAll<HTMLElement>(".ql-code-block"))
      .map((line) => normalizeCodeLineWhitespace(extractExactLineText(line)))
      .join("\n")
      .replace(/\n$/, "");
  }

  const clone = block.cloneNode(true) as HTMLElement;
  clone.querySelectorAll(".ql-ui").forEach((node) => node.remove());
  return normalizeCodeLineWhitespace(clone.textContent || "").replace(/\n$/, "");
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
  const [clearText, setClearText] = useState<string>("清空编辑器");
  const [resetText, setResetText] = useState<string>("恢复示例");
  const [outputView, setOutputView] = useState<OutputView>("markdown");
  const [activeCodeMeta, setActiveCodeMeta] = useState<ActiveCodeMeta>({
    language: "plain",
    theme: "yuque-light-pro",
  });
  const [hasActiveCodeBlock, setHasActiveCodeBlock] = useState<boolean>(false);
  const [toolbarPosition, setToolbarPosition] = useState<{ left: number; top: number }>({
    left: 8,
    top: 8,
  });

  const previewHtml = useMemo<string>(() => {
    const md = markdown.trim();
    if (!md) return "<p class=\"empty\">Markdown 预览会显示在这里</p>";
    const normalized = renderMarkdownToHtml(md);
    if (typeof window === "undefined") return normalized;
    const purifier = createDOMPurify(window);
    return purifier.sanitize(normalized, { USE_PROFILES: { html: true } });
  }, [markdown]);

  useEffect(() => {
    const service = new TurndownService({
      headingStyle: "atx",
      hr: "---",
      bulletListMarker: "-",
      codeBlockStyle: "fenced",
      preformattedCode: true,
    });
    service.use(gfm as never);
    service.addRule("quillTable", {
      filter(node: Node) {
        return node.nodeName === "TABLE";
      },
      replacement(_content: string, node: Node) {
        return tableToMarkdown(node as HTMLElement);
      },
    });
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
    return copyWithFallback(text);
  }, []);

  const pasteInitialExample = useCallback(() => {
    const quill = quillRef.current;
    if (!quill) return;
    quill.setText("");
    quill.clipboard.dangerouslyPasteHTML(initialRichTextHtml);
    ensureCodeLanguageMetadata();
    forceSyntaxHighlight(quill);
    toMarkdown();
    flashText(setResetText, "已恢复", "恢复示例");
  }, [ensureCodeLanguageMetadata, toMarkdown]);

  return (
    <main className="container rt2md-page">
      <h1>富文本与Markdown在线双向转换工具</h1>
      <ToolModeSwitch active="rt2md" />

      <section className="panels">
        <article className="panel">
          <header className="panel-header">
            <div>
              <div className="panel-title">Rich Text Input</div>
              <div className="panel-subtitle">粘贴网页、文档或编辑器中的富文本内容</div>
            </div>
            <div className="panel-actions">
              <button
                id="resetRichBtn"
                className="btn btn-light"
                type="button"
                onClick={pasteInitialExample}
              >
                {resetText}
              </button>
              <button
                id="clearRichBtn"
                className="btn"
                type="button"
                onClick={() => {
                  quillRef.current?.setText("");
                  setMarkdown("");
                  setHasActiveCodeBlock(false);
                  flashText(setClearText, "已清空", "清空编辑器");
                }}
              >
                {clearText}
              </button>
            </div>
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
            <div>
              <div className="panel-title">Markdown Output</div>
              <div className="panel-subtitle">查看源码或预览渲染结果</div>
            </div>
            <div className="panel-actions">
              <div className="view-toggle" aria-label="Markdown output view">
                <button
                  className={outputView === "markdown" ? "active" : ""}
                  type="button"
                  onClick={() => setOutputView("markdown")}
                >
                  Write
                </button>
                <button
                  className={outputView === "preview" ? "active" : ""}
                  type="button"
                  onClick={() => setOutputView("preview")}
                >
                  Preview
                </button>
              </div>
              <button
                id="copyMarkdownBtn"
                className="btn"
                type="button"
                onClick={async () => {
                  const copied = await copyText(markdown);
                  flashText(setCopyMdText, copied ? "已复制" : "复制失败", "复制Markdown源码");
                }}
              >
                {copyMdText}
              </button>
            </div>
          </header>
          <div className="markdown-wrap">
            {outputView === "markdown" ? (
              <textarea id="markdownOutput" spellCheck={false} value={markdown} readOnly wrap="soft" />
            ) : (
              <PreviewSurface
                id="markdownPreview"
                className="rt2md-preview"
                html={previewHtml}
                emptyHtml={'<p class="empty">Markdown 预览会显示在这里</p>'}
              />
            )}
          </div>
        </article>
      </section>
      <p className="tip">当前为富文本转 Markdown 页面，点击上方切换可跳到其他工具页面。</p>
    </main>
  );
}

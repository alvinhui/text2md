"use client";

import createDOMPurify from "dompurify";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import go from "highlight.js/lib/languages/go";
import html from "highlight.js/lib/languages/xml";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import markdownLanguage from "highlight.js/lib/languages/markdown";
import { marked } from "marked";
import Link from "next/link";
import python from "highlight.js/lib/languages/python";
import rust from "highlight.js/lib/languages/rust";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import yaml from "highlight.js/lib/languages/yaml";
import { useCallback, useMemo, useState } from "react";
import PreviewSurface from "../components/PreviewSurface";

const highlightLanguages = [
  ["bash", bash],
  ["css", css],
  ["go", go],
  ["html", html],
  ["java", java],
  ["javascript", javascript],
  ["json", json],
  ["markdown", markdownLanguage],
  ["python", python],
  ["rust", rust],
  ["sql", sql],
  ["typescript", typescript],
  ["yaml", yaml],
] as const;

highlightLanguages.forEach(([name, language]) => {
  if (!hljs.getLanguage(name)) {
    hljs.registerLanguage(name, language);
  }
});

const highlightAutoLanguages = highlightLanguages.map(([name]) => name);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeCodeLanguage(language = ""): string {
  const token = language.trim().toLowerCase().split(/\s+/)[0];
  const aliases: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    md: "markdown",
    py: "python",
    sh: "bash",
    shell: "bash",
    ts: "typescript",
    tsx: "typescript",
    yml: "yaml",
  };
  return aliases[token] || token;
}

function renderHighlightedCode(code: string, rawLanguage = ""): string {
  const language = normalizeCodeLanguage(rawLanguage);
  const hasLanguage = Boolean(language && hljs.getLanguage(language));
  const highlighted = hasLanguage
    ? hljs.highlight(code, { language, ignoreIllegals: true }).value
    : hljs.highlightAuto(code, highlightAutoLanguages).value || escapeHtml(code);
  const languageClass = hasLanguage ? ` language-${language}` : "";
  const dataLanguage = hasLanguage ? ` data-language="${language}"` : "";

  return `<pre><code class="hljs${languageClass}"${dataLanguage}>${highlighted}</code></pre>`;
}

marked.use({
  gfm: true,
  breaks: false,
  renderer: {
    code({ text, lang }) {
      return renderHighlightedCode(text, lang);
    },
  },
});

const INITIAL_MARKDOWN = `# Markdown 转富文本示例

这是一个语雀风格的双栏编辑区，左侧写 Markdown，右侧自动转为富文本。这个示例覆盖常用排版、表格、任务列表和多语言代码块，方便初始化后直接试复制效果。

## 发布清单
- [x] 完成正文结构
- [x] 添加表格和引用
- [ ] 补充配图与发布渠道
- [ ] 让同事复核技术细节

> 提示：右侧是可编辑富文本区域，复制 HTML 后可粘贴到支持富文本的编辑器中继续处理。

## 内容结构

1. 开头用 **加粗文案** 点明结论
2. 中间用表格对比关键数据
3. 结尾放行动项和代码片段

你也可以混合行内代码，比如 \`calculateReadingTime(article)\`，或放一个链接：[Text2MD](https://example.com)。

| 字段 | 说明 |
| --- | --- |
| 标题 | 支持 H1 - H6 |
| 列表 | 支持有序、无序和任务列表 |
| 表格 | 表格会保留表头、边框和隔行底色 |
| code | 行内代码如 \`test(123)\`，代码块支持语法高亮 |

## JavaScript 示例
\`\`\`js
const tasks = ["parse markdown", "sanitize html", "highlight code"];

for (const task of tasks) {
  console.log(\`done: \${task}\`);
}
\`\`\`

## TypeScript 示例
\`\`\`ts
type ArticleMeta = {
  title: string;
  tags: string[];
  publishedAt?: string;
};

function getSummary(meta: ArticleMeta): string {
  return \`\${meta.title} · \${meta.tags.join(" / ")}\`;
}
\`\`\`

## JSON 配置
\`\`\`json
{
  "output": "rich-text",
  "syntaxHighlight": true,
  "theme": "github-dark"
}
\`\`\`

---

最后可以用分割线收束内容，并补一句结论：Markdown 负责结构，富文本负责交付。
`;

export default function Md2rtClient() {
  const [markdown, setMarkdown] = useState<string>(INITIAL_MARKDOWN);
  const [copyText, setCopyText] = useState<string>("复制富文本HTML");

  const safeHtml = useMemo<string>(() => {
    const renderedHtml = marked.parse(markdown);
    const normalized = typeof renderedHtml === "string" ? renderedHtml : "";
    if (typeof window === "undefined") {
      return normalized || "<p><br></p>";
    }
    const purifier = createDOMPurify(window);
    return purifier.sanitize(normalized, { USE_PROFILES: { html: true } }) || "<p><br></p>";
  }, [markdown]);

  const handleCopyHtml = useCallback(async () => {
    if (!safeHtml) return;
    await navigator.clipboard.writeText(safeHtml);
    setCopyText("已复制");
    setTimeout(() => setCopyText("复制富文本HTML"), 1200);
  }, [safeHtml]);

  const insertSnippet = useCallback((snippet: string) => {
    setMarkdown((prev) => `${prev}${prev.endsWith("\n") ? "" : "\n"}${snippet}`);
  }, []);

  return (
    <main className="container">
      <h1>富文本与Markdown在线双向转换工具</h1>
      <div className="mode-switch">
        <Link className="mode-btn" href="/rt2md">富文本 -&gt; Markdown</Link>
        <Link className="mode-btn active" href="/md2rt">Markdown -&gt; 富文本</Link>
        <Link className="mode-btn" href="/wx2md">微信文章 -&gt; Markdown</Link>
      </div>

      <section className="panels">
        <article className="panel">
          <header className="panel-header">
            <div className="panel-title">Markdown Editor（语雀风格）</div>
            <button
              id="clearMarkdownInputBtn"
              className="btn btn-light"
              type="button"
              onClick={() => setMarkdown("")}
            >
              清空输入
            </button>
          </header>
          <div className="md-input-wrap">
            <div className="md-toolbar">
              <button className="md-tool-btn" type="button" onClick={() => insertSnippet("# ")}>H1</button>
              <button className="md-tool-btn" type="button" onClick={() => insertSnippet("## ")}>H2</button>
              <button className="md-tool-btn" type="button" onClick={() => insertSnippet("**加粗**")}>粗体</button>
              <button className="md-tool-btn" type="button" onClick={() => insertSnippet("*斜体*")}>斜体</button>
              <button className="md-tool-btn" type="button" onClick={() => insertSnippet("- 列表项")}>列表</button>
              <button className="md-tool-btn" type="button" onClick={() => insertSnippet("> 引用")}>引用</button>
              <button
                className="md-tool-btn"
                type="button"
                onClick={() => insertSnippet("\n```js\nconsole.log('hello');\n```\n")}
              >
                代码块
              </button>
              <button
                className="md-tool-btn"
                type="button"
                onClick={() => insertSnippet("[链接文本](https://example.com)")}
              >
                链接
              </button>
              <button
                className="md-tool-btn"
                type="button"
                onClick={() => insertSnippet("\n| 列1 | 列2 |\n| --- | --- |\n| 内容A | 内容B |\n")}
              >
                表格
              </button>
            </div>
            <textarea
              id="markdownInput"
              spellCheck={false}
              value={markdown}
              onChange={(event) => setMarkdown(event.target.value)}
            />
          </div>
        </article>

        <article className="panel">
          <header className="panel-header">
            <div className="panel-title">Rich Text Output</div>
            <button id="copyRichHtmlBtn" className="btn" type="button" onClick={handleCopyHtml}>{copyText}</button>
          </header>
          <div className="rich-wrap">
            <PreviewSurface
              id="richOutputEditor"
              html={safeHtml}
              contentEditable
              emptyHtml="<p><br></p>"
            />
          </div>
        </article>
      </section>
      <p className="tip">当前为 Markdown 转富文本页面，点击上方切换可跳到其他工具页面。</p>
    </main>
  );
}

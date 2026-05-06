"use client";

import createDOMPurify from "dompurify";
import { marked } from "marked";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

marked.setOptions({
  gfm: true,
  breaks: false,
});

const INITIAL_MARKDOWN = `# Markdown 转富文本示例

这是一个语雀风格的双栏编辑区，左侧写 Markdown，右侧自动转为富文本。

## 功能
- 实时渲染
- 支持表格、代码块、引用
- 转换后可继续在右侧编辑

| 字段 | 说明 |
| --- | --- |
| code | 行内代码如 \`test(123)\` |
| table | 表格会保留渲染 |

## 代码块示例
\`\`\`ts
function greet(name: string): string {
  return \`hello, \${name}\`;
}

console.log(greet("Text2MD"));
\`\`\`
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
            <div
              id="richOutputEditor"
              contentEditable
              suppressContentEditableWarning
              dangerouslySetInnerHTML={{ __html: safeHtml }}
            />
          </div>
        </article>
      </section>
      <p className="tip">当前为 Markdown 转富文本页面，点击上方切换可跳到其他工具页面。</p>
    </main>
  );
}

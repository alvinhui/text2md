import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import go from "highlight.js/lib/languages/go";
import html from "highlight.js/lib/languages/xml";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import markdownLanguage from "highlight.js/lib/languages/markdown";
import { Marked } from "marked";
import python from "highlight.js/lib/languages/python";
import rust from "highlight.js/lib/languages/rust";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import yaml from "highlight.js/lib/languages/yaml";

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

const markdownRenderer = new Marked({
  gfm: true,
  breaks: false,
  renderer: {
    code({ text, lang }) {
      return renderHighlightedCode(text, lang);
    },
  },
});

export function renderMarkdownToHtml(markdown: string): string {
  const rendered = markdownRenderer.parse(markdown);
  return typeof rendered === "string" ? rendered : "";
}

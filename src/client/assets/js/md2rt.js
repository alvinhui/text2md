    const markdownInput = document.querySelector("#markdownInput");
    const richOutputEditor = document.querySelector("#richOutputEditor");
    const copyRichHtmlBtn = document.querySelector("#copyRichHtmlBtn");
    const clearMarkdownInputBtn = document.querySelector("#clearMarkdownInputBtn");

    marked.setOptions({
      gfm: true,
      tables: true,
      breaks: false
    });

    function markdownToRichText() {
      const md = markdownInput.value;
      const renderedHtml = marked.parse(md || "");
      const safeHtml = DOMPurify.sanitize(renderedHtml, {
        USE_PROFILES: { html: true }
      });
      richOutputEditor.innerHTML = safeHtml || "<p><br></p>";
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
      setTimeout(() => { button.textContent = oldText; }, 1200);
    }

    markdownInput.addEventListener("input", markdownToRichText);

    copyRichHtmlBtn.addEventListener("click", function () {
      copyText(richOutputEditor.innerHTML, copyRichHtmlBtn);
    });

    clearMarkdownInputBtn.addEventListener("click", function () {
      markdownInput.value = "";
      markdownToRichText();
    });

    document.querySelectorAll(".md-tool-btn").forEach((toolBtn) => {
      toolBtn.addEventListener("click", function () {
        const snippet = toolBtn.dataset.insert || "";
        const start = markdownInput.selectionStart;
        const end = markdownInput.selectionEnd;
        const before = markdownInput.value.slice(0, start);
        const selected = markdownInput.value.slice(start, end);
        const after = markdownInput.value.slice(end);
        const injected = snippet.includes("加粗") || snippet.includes("斜体")
          ? snippet.replace("加粗", selected || "加粗文本").replace("斜体", selected || "斜体文本")
          : (selected ? snippet + "\n" + selected : snippet);
        markdownInput.value = before + injected + after;
        const cursor = (before + injected).length;
        markdownInput.focus();
        markdownInput.setSelectionRange(cursor, cursor);
        markdownToRichText();
      });
    });

    markdownInput.value = `# Markdown 转富文本示例

这是一个语雀风格的双栏编辑区，左侧写 Markdown，右侧自动转为富文本。

## 功能
- 实时渲染
- 支持表格、代码块、引用
- 转换后可继续在右侧编辑

| 字段 | 说明 |
| --- | --- |
| code | 行内代码如 \`test(123)\` |
| table | 表格会保留渲染 |
`;
    markdownToRichText();

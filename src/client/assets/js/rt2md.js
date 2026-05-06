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
      { value: "markdown", label: "Markdown" }
    ];
    const codeThemeOptions = [
      { value: "yuque-light-pro", label: "Yuque Light Pro" },
      { value: "yuque-dark-pro", label: "Yuque Dark Pro" },
      { value: "github-light", label: "GitHub Light" },
      { value: "dracula", label: "Dracula" }
    ];

    const quill = new Quill("#editor", {
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
          ["clean"]
        ]
      }
    });

    const markdownOutput = document.querySelector("#markdownOutput");
    const copyRichBtn = document.querySelector("#copyRichBtn");
    const copyMarkdownBtn = document.querySelector("#copyMarkdownBtn");
    const editorWrap = document.querySelector(".editor-wrap");
    const qlToolbar = quill.getModule("toolbar") && quill.getModule("toolbar").container;
    const qlEditor = quill.root;

    const floatingToolbar = document.createElement("div");
    floatingToolbar.className = "code-floating-toolbar";
    floatingToolbar.innerHTML = `
      <span class="toolbar-label">语言</span>
      <select id="floatingCodeLanguage"></select>
      <span class="toolbar-label">皮肤</span>
      <select id="floatingCodeTheme"></select>
    `;
    editorWrap.appendChild(floatingToolbar);

    const floatingCodeLanguage = floatingToolbar.querySelector("#floatingCodeLanguage");
    const floatingCodeTheme = floatingToolbar.querySelector("#floatingCodeTheme");
    codeLanguageOptions.forEach((item) => {
      const opt = document.createElement("option");
      opt.value = item.value;
      opt.textContent = item.label;
      floatingCodeLanguage.appendChild(opt);
    });
    codeThemeOptions.forEach((item) => {
      const opt = document.createElement("option");
      opt.value = item.value;
      opt.textContent = item.label;
      floatingCodeTheme.appendChild(opt);
    });

    const turndownService = new TurndownService({
      headingStyle: "atx",
      hr: "---",
      bulletListMarker: "-",
      codeBlockStyle: "fenced"
    });
    turndownService.use(window.turndownPluginGfm.gfm);
    turndownService.addRule("codeBlockWithLanguage", {
      filter: function (node) {
        const isPre = node.nodeName === "PRE";
        const hasQuillSyntax = isPre && node.classList && node.classList.contains("ql-syntax");
        const hasLanguageHint = isPre && (
          node.hasAttribute("data-code-language")
          || /language-[\w-]+/i.test(node.className || "")
        );
        return hasQuillSyntax || hasLanguageHint;
      },
      replacement: function (_content, node) {
        const codeText = (node.textContent || "").replace(/\n$/, "");
        const language = getCodeLanguageFromNode(node);
        const fence = getFenceByCode(codeText);
        const langToken = language === "plain" ? "" : language;
        return `\n\n${fence}${langToken}\n${codeText}\n${fence}\n\n`;
      }
    });

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
      const exists = codeThemeOptions.some((item) => item.value === fromData);
      return exists ? fromData : "yuque-light-pro";
    }

    function getCodeThemeLabel(themeValue) {
      const hit = codeThemeOptions.find((item) => item.value === themeValue);
      return hit ? hit.label : "Yuque Light Pro";
    }

    function getCodeBlockDomNodeAtRange(range) {
      if (!range) return null;
      const [line] = quill.getLine(range.index);
      if (!line) return null;
      const lineNode = line.domNode;
      if (!lineNode || !(lineNode instanceof HTMLElement)) return null;
      if (lineNode.tagName === "PRE") return lineNode;
      return lineNode.closest("pre.ql-syntax");
    }

    function ensureCodeLanguageMetadata() {
      quill.root.querySelectorAll("pre.ql-syntax").forEach((pre) => {
        if (!pre.getAttribute("data-code-language")) {
          pre.setAttribute("data-code-language", "plain");
        }
        if (!pre.getAttribute("data-code-theme")) {
          pre.setAttribute("data-code-theme", "yuque-light-pro");
        }
        const theme = getCodeThemeFromNode(pre);
        pre.setAttribute("data-code-theme-label", getCodeThemeLabel(theme));
      });
    }

    function getActiveCodeBlock() {
      const range = quill.getSelection();
      return getCodeBlockDomNodeAtRange(range);
    }

    function updateFloatingToolbarPosition() {
      const codeBlock = getActiveCodeBlock();
      if (!codeBlock) {
        floatingToolbar.classList.remove("visible");
        return;
      }
      const language = getCodeLanguageFromNode(codeBlock);
      const theme = getCodeThemeFromNode(codeBlock);
      floatingCodeLanguage.value = codeLanguageOptions.some((item) => item.value === language)
        ? language
        : "plain";
      floatingCodeTheme.value = theme;

      const wrapRect = editorWrap.getBoundingClientRect();
      const blockRect = codeBlock.getBoundingClientRect();
      const panelWidth = 360;
      let left = blockRect.left - wrapRect.left;
      let top = blockRect.top - wrapRect.top - 42;
      if (top < 50) {
        top = blockRect.bottom - wrapRect.top + 6;
      }
      left = Math.max(8, Math.min(left, wrapRect.width - panelWidth - 8));
      floatingToolbar.style.left = `${left}px`;
      floatingToolbar.style.top = `${top}px`;
      floatingToolbar.classList.add("visible");
    }

    function applyFloatingLanguage() {
      const codeBlock = getActiveCodeBlock();
      if (!codeBlock) return;
      codeBlock.setAttribute("data-code-language", floatingCodeLanguage.value || "plain");
      toMarkdown();
      updateFloatingToolbarPosition();
    }

    function applyFloatingTheme() {
      const codeBlock = getActiveCodeBlock();
      if (!codeBlock) return;
      const theme = floatingCodeTheme.value || "yuque-light-pro";
      codeBlock.setAttribute("data-code-theme", theme);
      codeBlock.setAttribute("data-code-theme-label", getCodeThemeLabel(theme));
      toMarkdown();
      updateFloatingToolbarPosition();
    }

    function toMarkdown() {
      ensureCodeLanguageMetadata();
      const html = quill.root.innerHTML;
      markdownOutput.value = turndownService.turndown(html).trim();
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

    quill.on("text-change", toMarkdown);
    quill.on("editor-change", function (eventName) {
      if (eventName === "text-change") {
        ensureCodeLanguageMetadata();
      }
      updateFloatingToolbarPosition();
    });

    floatingCodeLanguage.addEventListener("change", applyFloatingLanguage);
    floatingCodeTheme.addEventListener("change", applyFloatingTheme);
    qlEditor.addEventListener("scroll", function () {
      updateFloatingToolbarPosition();
    });
    window.addEventListener("resize", function () {
      updateFloatingToolbarPosition();
    });

    copyMarkdownBtn.addEventListener("click", function () {
      copyText(markdownOutput.value, copyMarkdownBtn);
    });

    copyRichBtn.addEventListener("click", async function () {
      const plainText = quill.getText().trim();
      await copyText(plainText, copyRichBtn);
      quill.setText("");
      toMarkdown();
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
    updateFloatingToolbarPosition();
    toMarkdown();

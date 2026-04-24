# Text2MD

一个轻量的网页工具集合，用于在富文本与 Markdown 之间进行双向转换。

## 功能

- `rt2md.html`：富文本 -> Markdown
- `md2rt.html`：Markdown -> 富文本（支持表格、行内代码样式）
- `index.html`：Landing 首页（两个入口卡片）

## 本地运行

```bash
npm run start
```

启动后访问：

- `http://localhost:8080/`（Landing）
- `http://localhost:8080/rt2md.html`
- `http://localhost:8080/md2rt.html`

## 项目结构

```text
.
├── index.html        # Landing 首页
├── rt2md.html        # 富文本 -> Markdown
├── md2rt.html        # Markdown -> 富文本
├── package.json
└── package-lock.json
```

## 技术栈

- 原生 HTML/CSS/JavaScript
- [Quill](https://quilljs.com/)（富文本编辑）
- [Turndown](https://github.com/mixmark-io/turndown)（HTML 转 Markdown）
- [Marked](https://marked.js.org/)（Markdown 解析）
- [DOMPurify](https://github.com/cure53/DOMPurify)（HTML 清洗）


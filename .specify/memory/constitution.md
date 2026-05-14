# Text2MD Constitution

## Core Principles

### I. User-First Design
一切功能设计以用户体验为优先。工具应做到零学习成本、即开即用、转换结果准确可靠。界面保持简洁清晰，操作流程不超过 3 步。

### II. Conversion Accuracy
富文本与 Markdown 的双向转换必须保持内容结构完整性。表格、代码块、列表、标题层级等格式元素在转换过程中不得丢失或错乱。边界情况（空内容、超长文本、特殊字符）需妥善处理。

### III. Client-Side Priority
核心转换逻辑应在客户端完成，减少服务端依赖。仅在必要时（如微信文章抓取）使用服务端 API。这确保了工具的响应速度和离线可用性。

### IV. Code Quality Standards
- TypeScript 严格模式，禁止 `any` 类型泛滥
- 组件职责单一，逻辑与 UI 分离
- 工具函数必须纯函数化，便于测试
- CSS 模块化，避免全局样式污染
- 所有公共 API 和工具函数需有清晰注释

### V. Performance First
- 页面首屏加载时间 < 2s
- 转换操作响应时间 < 500ms（常规文档）
- 避免不必要的依赖引入，保持包体积精简
- 大文档转换需有进度反馈，不阻塞 UI

### VI. Security
- 所有用户输入的 HTML 必须经过 DOMPurify 清洗
- 服务端 API 需验证输入合法性
- 微信文章抓取需防止 SSRF 攻击
- 不存储任何用户数据

## Technology Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript (strict mode)
- **Rich Text Editor**: Quill
- **HTML to Markdown**: Turndown + GFM plugin
- **Markdown to HTML**: Marked
- **HTML Sanitization**: DOMPurify
- **Code Highlighting**: highlight.js
- **Styling**: CSS (per-page stylesheets)

## Development Workflow

1. 新功能开发前必须先更新 spec 文档
2. 代码变更需通过 `npm run build` 无错误
3. 遵循 Next.js App Router 约定式路由
4. 组件分为页面组件（`page.tsx`）和客户端组件（`*Client.tsx`）
5. 公共工具函数放在 `app/utils/` 目录
6. 服务端逻辑放在 `lib/` 目录

## Governance

Constitution 是本项目所有开发决策的最高准则。任何技术选型、功能设计、代码实现都必须符合上述原则。如需修改 Constitution，需记录修改理由和影响范围。

**Version**: 1.0.0 | **Ratified**: 2026-05-14 | **Last Amended**: 2026-05-14
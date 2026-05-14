# Implementation Plan: Text2MD 双向转换工具集

**Branch**: `001-text2md-tool-suite` | **Date**: 2026-05-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-text2md-tool-suite/spec.md`

## Summary

Text2MD 是一个基于 Next.js 的轻量网页工具集合，实现富文本与 Markdown 的双向转换以及微信文章提取。核心架构采用 Next.js App Router，客户端完成主要转换逻辑，服务端仅处理微信文章抓取。技术栈使用 Quill（富文本编辑）、Turndown（HTML→MD）、Marked（MD→HTML）、highlight.js（代码高亮）、DOMPurify（安全清洗）。

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode)

**Primary Dependencies**: Next.js 16, React 19, Quill 2, Turndown 7, Marked 16, DOMPurify 3, highlight.js 11

**Storage**: N/A（无状态应用，不存储数据）

**Testing**: 暂无测试框架（待引入 Vitest/Playwright）

**Target Platform**: Web（现代浏览器），node.js 服务端

**Project Type**: Web application（Next.js App Router）

**Performance Goals**: 首屏 < 2s，转换操作 < 500ms（常规文档）

**Constraints**: 纯客户端转换（除微信抓取），无数据库依赖，零用户登录

**Scale/Scope**: 轻量工具页面（3 个功能页面 + 1 个 Landing 页）

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|-----------|-------|--------|
| I. User-First Design | 三个工具页面操作流程均在 3 步以内 | ✅ Pass |
| II. Conversion Accuracy | 使用成熟库 Turndown + Marked，已配置 GFM 支持 | ✅ Pass |
| III. Client-Side Priority | 核心转换在客户端，仅微信抓取用服务端 | ✅ Pass |
| IV. Code Quality | TypeScript 严格模式，组件/工具分离 | ✅ Pass |
| V. Performance First | 无重型依赖，CSS 按页面加载 | ✅ Pass |
| VI. Security | DOMPurify 清洗 HTML，API 有输入校验 | ✅ Pass |

## Project Structure

### Documentation (this feature)

```text
specs/001-text2md-tool-suite/
├── plan.md              # This file
├── spec.md              # Feature specification
└── tasks.md             # Task breakdown
```

### Source Code (repository root)

```text
app/
├── page.tsx                  # Landing 首页
├── layout.tsx                # 根布局（Metadata）
├── globals.css               # 全局样式
├── rt2md/
│   ├── page.tsx              # 路由页面（Server Component）
│   └── Rt2mdClient.tsx       # 富文本 → Markdown 客户端组件
├── md2rt/
│   ├── page.tsx              # 路由页面
│   └── Md2rtClient.tsx       # Markdown → 富文本客户端组件
├── wx2md/
│   ├── page.tsx              # 路由页面
│   └── Wx2mdClient.tsx       # 微信文章 → Markdown 客户端组件
├── components/
│   ├── PreviewSurface.tsx    # 预览区通用组件
│   └── ToolModeSwitch.tsx    # 模式切换组件
├── utils/
│   ├── copy.ts               # 剪贴板复制工具
│   ├── markdown-renderer.ts  # Markdown 渲染器
│   └── ui-feedback.ts        # UI 反馈工具
├── styles/
│   ├── common.css            # 公共样式
│   ├── index.css             # Landing 页样式
│   ├── rt2md.css             # rt2md 页样式
│   ├── md2rt.css             # md2rt 页样式
│   └── wx2md.css             # wx2md 页样式
└── api/wx2md/
    └── route.ts              # 微信抓取 API 路由

lib/
└── wx2md-service.ts           # 微信文章抓取服务

public/
└── favicon.svg                # 网站图标

types/
└── turndown-plugin-gfm.d.ts   # 类型声明
```

**Structure Decision**: 采用 Next.js App Router 约定式路由，每个工具页面由 Server Component（page.tsx）作为入口，客户端逻辑放在 *Client.tsx 组件中。工具函数集中管理在 app/utils/，服务端逻辑放在 lib/。

## Complexity Tracking

> 当前无违反 Constitution 的复杂度。项目保持简单架构，无 over-engineering。
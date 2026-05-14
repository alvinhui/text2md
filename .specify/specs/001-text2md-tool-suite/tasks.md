# Tasks: Text2MD 双向转换工具集

**Input**: Design documents from `/specs/001-text2md-tool-suite/`

**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Status**: Implemented (Brownfield) — 当前任务记录已完成的实现状态

## Phase 1: Setup (Shared Infrastructure) ✅

**Purpose**: 项目初始化和基础架构搭建

- [x] T001 创建 Next.js 项目结构 `app/` 目录
- [x] T002 初始化 TypeScript + Next.js 依赖 (`package.json`)
- [x] T003 [P] 配置 `tsconfig.json` 严格模式
- [x] T004 [P] 创建 `app/layout.tsx` 根布局组件
- [x] T005 [P] 创建 `app/globals.css` 全局样式

---

## Phase 2: Foundational (Shared Components) ✅

**Purpose**: 跨页面共享的工具函数和组件

- [x] T006 [P] 实现剪贴板复制工具 `app/utils/copy.ts`
- [x] T007 [P] 实现 Markdown 渲染器 `app/utils/markdown-renderer.ts`（Marked + highlight.js）
- [x] T008 [P] 实现 UI 反馈工具 `app/utils/ui-feedback.ts`
- [x] T009 [P] 创建预览面板组件 `app/components/PreviewSurface.tsx`
- [x] T010 [P] 创建模式切换组件 `app/components/ToolModeSwitch.tsx`
- [x] T011 [P] 创建公样式 `app/styles/common.css`

**Checkpoint**: 公共组件和工具函数就绪

---

## Phase 3: User Story 1 - 富文本转 Markdown (Priority: P1) ✅

**Goal**: 用户可在 `/rt2md` 页面将富文本转换为 Markdown

**Independent Test**: 粘贴含表格和代码块的内容，验证 Markdown 输出正确性

### Implementation

- [x] T012 [US1] 创建路由页面 `app/rt2md/page.tsx`
- [x] T013 [US1] 实现客户端组件 `app/rt2md/Rt2mdClient.tsx`（Quill 编辑器 + Turndown 转换）
- [x] T014 [US1] 集成 GFM 表格支持（turndown-plugin-gfm）
- [x] T015 [US1] 实现实时转换逻辑（编辑器内容变更 → Markdown 输出）
- [x] T016 [US1] 实现一键复制 Markdown 功能
- [x] T017 [US1] 创建页面样式 `app/styles/rt2md.css`

**Checkpoint**: 富文本转 Markdown 功能完整可用

---

## Phase 4: User Story 2 - Markdown 转富文本 (Priority: P2) ✅

**Goal**: 用户可在 `/md2rt` 页面将 Markdown 实时渲染为富文本

**Independent Test**: 输入含标题、列表、代码块的 Markdown，验证渲染结果

### Implementation

- [x] T018 [US2] 创建路由页面 `app/md2rt/page.tsx`
- [x] T019 [US2] 实现客户端组件 `app/md2rt/Md2rtClient.tsx`（Markdown 编辑 + HTML 渲染）
- [x] T020 [US2] 集成代码高亮渲染（highlight.js）
- [x] T021 [US2] 实现复制富文本到剪贴板功能
- [x] T022 [US2] 创建页面样式 `app/styles/md2rt.css`

**Checkpoint**: Markdown 转富文本功能完整可用

---

## Phase 5: User Story 3 - 微信文章提取 (Priority: P3) ✅

**Goal**: 用户可在 `/wx2md` 页面输入微信文章链接并获取 Markdown 内容

**Independent Test**: 输入有效微信文章链接，验证返回 Markdown 包含标题和正文

### Implementation

- [x] T023 [US3] 创建 API 路由 `app/api/wx2md/route.ts`
- [x] T024 [US3] 实现微信文章抓取服务 `lib/wx2md-service.ts`（HTML 抓取 + Turndown 转换）
- [x] T025 [US3] 创建路由页面 `app/wx2md/page.tsx`
- [x] T026 [US3] 实现客户端组件 `app/wx2md/Wx2mdClient.tsx`
- [x] T027 [US3] 实现 URL 验证和错误处理
- [x] T028 [US3] 创建页面样式 `app/styles/wx2md.css`

**Checkpoint**: 微信文章提取功能完整可用

---

## Phase 6: Landing & Navigation ✅

**Purpose**: Landing 页面和工具间导航

- [x] T029 [P] 实现 Landing 首页 `app/page.tsx`（三个工具入口卡片）
- [x] T030 [P] 创建 Landing 样式 `app/styles/index.css`
- [x] T031 创建 `public/favicon.svg` 网站图标

---

## Phase 7: Polish & Scripts ✅

**Purpose**: 辅助脚本和部署优化

- [x] T032 [P] 创建随机端口启动脚本 `scripts/start-random.sh`
- [x] T033 [P] 创建本地域名映射脚本 `scripts/map-md2text-local.sh`
- [x] T034 [P] 创建类型声明文件 `types/turndown-plugin-gfm.d.ts`
- [x] T035 配置 `next.config.mjs`

---

## Dependencies & Execution Order

- **Phase 1 (Setup)** → **Phase 2 (Foundational)** → **Phase 3-5 (User Stories, 可并行)** → **Phase 6-7 (Landing & Polish)**
- 所有 User Story 均依赖 Phase 2 的公共组件
- User Story 之间相互独立，可并行实现

## Notes

- 当前为 Brownfield 项目，所有任务已完成实现
- 此 tasks.md 记录了现有代码的实现对应关系
- 后续新增功能应创建新的 spec 目录（如 `002-xxx`）
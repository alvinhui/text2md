# Feature Specification: Text2MD 双向转换工具集

**Feature Branch**: `001-text2md-tool-suite`

**Created**: 2026-05-14

**Status**: Implemented (Brownfield)

**Input**: 基于 Next.js 的轻量网页工具集合，用于在富文本与 Markdown 之间双向转换，并支持微信文章提取为 Markdown。

## User Scenarios & Testing

### User Story 1 - 富文本转 Markdown (Priority: P1)

用户在左侧富文本编辑器中粘贴或编辑内容（支持标题、列表、表格、代码块、图片等），右侧实时生成对应的 Markdown 源码，用户可一键复制 Markdown 内容。

**Why this priority**: 这是工具的核心功能，绝大多数用户的主要使用场景。

**Independent Test**: 在富文本编辑器中粘贴一段包含表格和代码块的网页内容，验证右侧 Markdown 输出的格式正确性。

**Acceptance Scenarios**:

1. **Given** 用户打开 `/rt2md` 页面, **When** 在左侧编辑器粘贴富文本内容, **Then** 右侧实时显示转换后的 Markdown 源码
2. **Given** 右侧已生成 Markdown, **When** 用户点击复制按钮, **Then** Markdown 内容被复制到系统剪贴板
3. **Given** 富文本包含表格, **When** 转换为 Markdown, **Then** 输出符合 GFM 表格语法
4. **Given** 富文本包含代码块, **When** 转换为 Markdown, **Then** 输出包含语言标识的围栏代码块

---

### User Story 2 - Markdown 转富文本 (Priority: P2)

用户在左侧 Markdown 编辑器中编写或粘贴 Markdown 源码，右侧实时渲染为带样式的富文本预览，支持代码高亮、表格样式等。

**Why this priority**: 反向转换是工具完整性的重要组成部分，满足从 Markdown 到可视化内容的需求。

**Independent Test**: 输入一段包含标题、列表、代码块的 Markdown，验证右侧渲染结果的样式和结构。

**Acceptance Scenarios**:

1. **Given** 用户打开 `/md2rt` 页面, **When** 在左侧输入 Markdown 源码, **Then** 右侧实时渲染为带样式的 HTML
2. **Given** Markdown 包含代码块, **When** 渲染为 HTML, **Then** 代码块有语法高亮显示
3. **Given** 用户点击复制按钮, **When** 复制操作完成, **Then** 富文本内容被复制到剪贴板（可粘贴到富文本编辑器中）

---

### User Story 3 - 微信文章提取 (Priority: P3)

用户输入微信公众号文章链接，系统自动抓取文章正文并转换为 Markdown 格式，用户可复制结果。

**Why this priority**: 特定场景需求，依赖服务端抓取能力，是核心转换功能的扩展。

**Independent Test**: 输入一个有效的微信文章链接，验证返回的 Markdown 内容包含文章标题和正文。

**Acceptance Scenarios**:

1. **Given** 用户打开 `/wx2md` 页面, **When** 输入微信文章链接并提交, **Then** 系统抓取文章并显示 Markdown 结果
2. **Given** 输入无效链接, **When** 提交请求, **Then** 显示友好的错误提示
3. **Given** 文章抓取成功, **When** 用户点击复制按钮, **Then** Markdown 内容被复制到剪贴板

---

### Edge Cases

- 空内容提交时应显示提示而非空白结果
- 超长文档（>100KB）转换时不应导致页面卡死
- 包含特殊 HTML 标签（script, iframe）的内容应被安全过滤
- 微信文章链接非 `mp.weixin.qq.com` 域名时应拒绝处理
- 网络异常时微信文章抓取应返回明确错误信息

## Requirements

### Functional Requirements

- **FR-001**: 系统必须支持富文本到 Markdown 的实时转换
- **FR-002**: 系统必须支持 Markdown 到富文本的实时渲染
- **FR-003**: 系统必须支持通过 URL 抓取微信公众号文章并转为 Markdown
- **FR-004**: 系统必须支持一键复制转换结果
- **FR-005**: 系统必须支持 GFM 扩展语法（表格、任务列表、删除线）
- **FR-006**: 系统必须对所有 HTML 输入进行安全清洗
- **FR-007**: Landing 页面必须提供到三个工具的导航入口

### Key Entities

- **RichText Content**: Quill 编辑器中的 Delta 格式内容，通过 Turndown 转换
- **Markdown Source**: 纯文本 Markdown 源码
- **WeChat Article**: 通过 URL 抓取的微信文章 HTML 内容
- **Converted Output**: 转换后的目标格式内容

## Success Criteria

### Measurable Outcomes

- **SC-001**: 用户可在 3 秒内完成一次完整的格式转换操作
- **SC-002**: 转换结果保持原始内容 95% 以上的格式结构
- **SC-003**: 页面首屏加载时间 < 2 秒
- **SC-004**: 微信文章抓取成功率 > 80%（取决于微信接口可用性）

## Assumptions

- 用户使用现代浏览器（Chrome、Firefox、Safari、Edge 最新版本）
- 用户具备基本的 Markdown 知识
- 微信文章抓取依赖服务端代理，可能受微信反爬策略影响
- 首个版本不需要用户登录和数据持久化
- 移动端适配为低优先级
# Text2MD

基于 Next.js 的轻量网页工具集合，用于在富文本与 Markdown 之间双向转换，并支持微信文章提取为 Markdown。

## 功能

- `/`：Landing 首页
- `/rt2md`：富文本 -> Markdown
- `/md2rt`：Markdown -> 富文本
- `/wx2md`：微信文章链接 -> Markdown（通过同源 `/api/wx2md` 抓取）

## 运行方式

安装依赖：

```bash
npm install
```

### 1) 标准开发模式（固定端口）

```bash
npm run dev
```

默认访问地址：

- `http://localhost:8080/`
- `http://localhost:8080/rt2md`
- `http://localhost:8080/md2rt`
- `http://localhost:8080/wx2md`

### 2) 随机端口启动

```bash
npm run start:random
```

该脚本会自动选择空闲端口并以 Next.js 开发模式启动，同时打印当前访问地址（例如 `http://127.0.0.1:64421`）。

### 3) 本地域名启动（`md2text.local`）

```bash
npm run start:local
```

`start:local` 会在随机端口启动服务后，自动尝试配置 `md2text.local` 到当前端口的本机映射。

如果映射过程中需要管理员权限，终端会提示输入本机管理员密码（`Password`），输入后继续即可。

成功后可通过以下地址访问：

- `http://md2text.local`

### 4) 生产构建与启动

```bash
npm run build
npm run start
```

## 项目结构

```text
.
├── app/
│   ├── api/wx2md/route.ts     # 微信抓取接口
│   ├── rt2md/                 # 富文本 -> Markdown
│   ├── md2rt/                 # Markdown -> 富文本
│   ├── wx2md/                 # 微信文章 -> Markdown
│   ├── layout.tsx
│   └── page.tsx               # Landing
├── lib/
│   └── wx2md-service.ts       # 远程抓取与代理回退
├── public/
│   └── favicon.svg
├── app/styles/                # 页面样式
├── scripts/
│   ├── start-random.sh
│   ├── start-local.sh
│   └── map-md2text-local.sh
└── package.json
```

## 技术栈

- [Next.js](https://nextjs.org/)
- [Quill](https://quilljs.com/)（富文本编辑）
- [Turndown](https://github.com/mixmark-io/turndown)（HTML 转 Markdown）
- [Marked](https://marked.js.org/)（Markdown 解析）
- [DOMPurify](https://github.com/cure53/DOMPurify)（HTML 清洗）


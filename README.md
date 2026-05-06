# Text2MD

基于 Next.js 的轻量网页工具集合，用于在富文本与 Markdown 之间双向转换，并支持微信文章提取为 Markdown。

## 功能

- `/`：Landing 首页
- `/rt2md`：富文本 -> Markdown
- `/md2rt`：Markdown -> 富文本
- `/wx2md`：微信文章链接 -> Markdown（通过同源 `/api/wx2md` 抓取）

兼容历史地址（自动 301）：

- `/index.html` -> `/`
- `/rt2md.html` -> `/rt2md`
- `/md2rt.html` -> `/md2rt`
- `/wx2md.html` -> `/wx2md`

## 本地运行

安装依赖：

```bash
npm install
```

开发模式：

```bash
npm run dev
```

生产构建与启动：

```bash
npm run build
npm run start
```

默认访问地址：

- `http://localhost:8080/`
- `http://localhost:8080/rt2md`
- `http://localhost:8080/md2rt`
- `http://localhost:8080/wx2md`

## 随机端口启动（推荐）

```bash
npm run start:local
```

该脚本会自动选择空闲端口并以 Next.js 开发模式启动，同时打印：

- 当前访问地址（例如 `http://127.0.0.1:64421`）
- 将 `md2text.local` 映射为无端口访问的命令提示

## 配置 `md2text.local`（无端口访问）

当你使用 `start:local` 启动后，执行终端输出的命令即可，例如：

```bash
sudo bash scripts/map-md2text-local.sh 64421
```

完成后可直接通过下面地址访问：

- `http://md2text.local`

## 项目结构

```text
.
├── app/
│   ├── api/wx2md/route.js     # 微信抓取接口
│   ├── rt2md/                 # 富文本 -> Markdown
│   ├── md2rt/                 # Markdown -> 富文本
│   ├── wx2md/                 # 微信文章 -> Markdown
│   ├── layout.js
│   └── page.js                # Landing
├── lib/
│   └── wx2md-service.js       # 远程抓取与代理回退
├── public/
│   └── favicon.svg
├── app/styles/                # 页面样式
├── scripts/
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


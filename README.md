# Text2MD

一个轻量的网页工具集合，用于在富文本与 Markdown 之间进行双向转换。

## 功能

- `src/client/index.html`：Landing 首页（两个入口卡片）
- `src/client/rt2md.html`：富文本 -> Markdown
- `src/client/md2rt.html`：Markdown -> 富文本（支持表格、行内代码样式）
- `src/client/wx2md.html`：微信文章链接 -> Markdown

## 本地运行

```bash
npm run start
```

启动后访问：

- `http://localhost:8080/`（Landing）
- `http://localhost:8080/rt2md`
- `http://localhost:8080/md2rt`
- `http://localhost:8080/wx2md`

兼容访问：

- `http://localhost:8080/rt2md.html`（自动 `301` 到 `/rt2md`）
- `http://localhost:8080/md2rt.html`（自动 `301` 到 `/md2rt`）
- `http://localhost:8080/wx2md.html`（自动 `301` 到 `/wx2md`）

## 随机端口启动（推荐）

```bash
npm run start:local
```

`start:local` 会自动选择一个空闲端口并启动服务，同时打印：

- 当前访问地址（例如 `http://127.0.0.1:64421`）
- 将 `md2text.local` 映射为无端口访问的命令提示
- 自动监听 `src/server`，文件保存后自动重启本地服务（端口不变）

> 说明：项目使用 `src/server`（Node.js）启动本地静态站点，并提供 `/api/wx2md` 同源接口给微信文章转换页面调用，避免浏览器直接请求第三方代理时的证书/跨域问题。

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
├── src/
│   ├── client/
│   │   ├── index.html        # Landing 首页
│   │   ├── rt2md.html        # 富文本 -> Markdown
│   │   ├── md2rt.html        # Markdown -> 富文本
│   │   ├── wx2md.html        # 微信文章 -> Markdown
│   │   ├── favicon.svg
│   │   └── assets/           # 前端样式与脚本（含 common.css）
│   └── server/               # 服务端入口与模块
├── server.js                 # 兼容入口（转发到 src/server）
├── scripts/
│   ├── start-local.sh         # 随机端口启动脚本
│   └── map-md2text-local.sh   # md2text.local 映射脚本（需 sudo）
├── package.json
└── package-lock.json
```

## 技术栈

- 原生 HTML/CSS/JavaScript
- [Quill](https://quilljs.com/)（富文本编辑）
- [Turndown](https://github.com/mixmark-io/turndown)（HTML 转 Markdown）
- [Marked](https://marked.js.org/)（Markdown 解析）
- [DOMPurify](https://github.com/cure53/DOMPurify)（HTML 清洗）

## 常见问题（FAQ）

### 1) `npm run start` 提示端口被占用怎么办？

优先使用随机端口启动：

```bash
npm run start:local
```

该命令会自动选择空闲端口，避免和其他应用冲突。

### 2) 为什么 `md2text.local` 之前还要带端口？

`/etc/hosts` 只能做“域名 -> IP”映射，不能映射端口。  
如果没有配置系统级端口转发，访问时必须写端口（例如 `:64421`）。  
执行 `map-md2text-local.sh` 后，才可以直接使用 `http://md2text.local`。

### 3) 执行映射脚本时出现 `Rules must be in order` 报错怎么办？

这是 PF 规则顺序校验导致的。请使用最新脚本并重新执行：

```bash
sudo bash scripts/map-md2text-local.sh <port>
```

脚本会自动：

- 备份 `/etc/pf.conf`
- 按正确顺序写入 `md2text-local` anchor
- 校验失败时自动回滚备份

### 4) 如何手动回滚本地 PF 配置？

如果你需要恢复脚本执行前的配置：

```bash
sudo cp /etc/pf.conf.md2text-local.bak /etc/pf.conf
sudo pfctl -f /etc/pf.conf
```

### 5) 如何停止本地服务？

如果是在前台启动，直接 `Ctrl + C`。  
如果是后台启动，可先查端口再结束进程，例如：

```bash
lsof -i :64421 -n -P
kill <PID>
```


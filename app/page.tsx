import Link from "next/link";

export default function HomePage() {
  return (
    <main className="container">
      <header className="header">
        <h1 className="title">Text2MD 双向转换工具</h1>
        <p className="subtitle">在富文本与 Markdown 之间快速转换，保持结构、表格与代码样式。</p>
      </header>

      <section className="cards">
        <Link className="card" href="/rt2md">
          <span className="card-tag">入口 01</span>
          <h2 className="card-title">富文本 -&gt; Markdown</h2>
          <p className="card-desc">适合将网页、文档、富文本编辑内容快速提取为可复制的 Markdown 源码。</p>
          <span className="card-action">进入工具</span>
        </Link>

        <Link className="card" href="/md2rt">
          <span className="card-tag">入口 02</span>
          <h2 className="card-title">Markdown -&gt; 富文本</h2>
          <p className="card-desc">适合将 Markdown 实时渲染为可编辑富文本，支持表格与行内代码样式展示。</p>
          <span className="card-action">进入工具</span>
        </Link>

        <Link className="card" href="/wx2md">
          <span className="card-tag">入口 03</span>
          <h2 className="card-title">微信文章 -&gt; Markdown</h2>
          <p className="card-desc">输入公众号文章链接，一键提取正文并转换为 Markdown，便于二次编辑与存档。</p>
          <span className="card-action">进入工具</span>
        </Link>
      </section>

      <p className="foot">建议将此页作为产品 Landing，并通过顶部导航在三个工具间切换。</p>
    </main>
  );
}

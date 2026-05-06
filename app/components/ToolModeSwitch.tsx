"use client";

import Link from "next/link";

type ToolMode = "rt2md" | "md2rt" | "wx2md";

type ToolModeSwitchProps = {
  active: ToolMode;
};

export default function ToolModeSwitch({ active }: ToolModeSwitchProps) {
  return (
    <div className="mode-switch">
      <Link className={`mode-btn ${active === "rt2md" ? "active" : ""}`} href="/rt2md">
        富文本 -&gt; Markdown
      </Link>
      <Link className={`mode-btn ${active === "md2rt" ? "active" : ""}`} href="/md2rt">
        Markdown -&gt; 富文本
      </Link>
      <Link className={`mode-btn ${active === "wx2md" ? "active" : ""}`} href="/wx2md">
        微信文章 -&gt; Markdown
      </Link>
    </div>
  );
}

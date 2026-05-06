import "./globals.css";

export const metadata = {
  title: "Text2MD - 双向转换工具",
  description: "在富文本与 Markdown 之间快速转换，支持微信文章提取。",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

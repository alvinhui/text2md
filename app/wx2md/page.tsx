import type { Metadata } from "next";
import Wx2mdClient from "./Wx2mdClient";

export const metadata: Metadata = {
  title: "微信文章 -> Markdown",
};

export default function Wx2mdPage() {
  return <Wx2mdClient />;
}

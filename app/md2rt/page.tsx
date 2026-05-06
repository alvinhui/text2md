import type { Metadata } from "next";
import Md2rtClient from "./Md2rtClient";

export const metadata: Metadata = {
  title: "Markdown -> 富文本",
};

export default function Md2rtPage() {
  return <Md2rtClient />;
}

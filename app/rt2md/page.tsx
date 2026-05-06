import type { Metadata } from "next";
import Rt2mdClient from "./Rt2mdClient";

export const metadata: Metadata = {
  title: "富文本 -> Markdown",
};

export default function Rt2mdPage() {
  return <Rt2mdClient />;
}

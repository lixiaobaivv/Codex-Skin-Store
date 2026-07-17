import type { Metadata } from "next";
import { ThemeWorkshop } from "@/components/theme-workshop";

export const metadata: Metadata = {
  title: "主题工坊",
  description: "无需写代码，在线制作、预览并生成 Codex-Skin 标准主题投稿包。",
};

export default function SubmitThemePage() {
  return <ThemeWorkshop />;
}

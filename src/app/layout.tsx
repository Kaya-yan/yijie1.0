import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

export const metadata: Metadata = {
  title: "译界 - 多语言智能聚合平台",
  description: "翻译、词典、语法、写作、阅读、AI工具一站式语言学习平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased scroll-smooth">
      <body className="min-h-full flex flex-col grain-overlay">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}

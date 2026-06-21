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
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-white focus:border-2 focus:border-black focus:text-sm"
        >
          跳转到主要内容
        </a>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}

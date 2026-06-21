"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Languages,
  BookOpen,
  Lightbulb,
  PenTool,
  BookMarked,
  Gamepad2,
  Wrench,
  LogOut,
  User,
  Menu,
  X,
  Settings,
  BookText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { href: "/dashboard", label: "翻译", icon: Languages },
  { href: "/dictionary", label: "词典", icon: BookOpen },
  { href: "/vocabulary", label: "生词本", icon: BookText },
  { href: "/grammar", label: "知识点", icon: Lightbulb },
  { href: "/writing", label: "训练", icon: PenTool },
  { href: "/reading", label: "阅读", icon: BookMarked },
  { href: "/game", label: "休闲", icon: Gamepad2 },
  { href: "/tools", label: "工具", icon: Wrench },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 10);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("auth");
    router.push("/");
  };

  return (
    <nav
      className={`sticky top-0 z-50 border-b-3 transition-all duration-100 ${
        scrolled ? "shadow-sm" : ""
      }`}
      style={{
        background: "var(--pixel-surface)",
        borderColor: scrolled ? "var(--pixel-border)" : "var(--pixel-border-light)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 flex items-center justify-center pixel-border" style={{ background: "var(--pixel-blue)" }}>
              <span className="text-white font-pixel-label">YJ</span>
            </div>
            <span className="hidden sm:block tracking-tight font-pixel-heading font-bold" style={{ color: "var(--pixel-text)" }}>
              译界
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger
                    className="relative flex items-center gap-1.5 px-3 py-2 font-pixel-body font-medium transition-colors cursor-pointer"
                    style={{
                      color: active ? "var(--pixel-text)" : "var(--pixel-text-light)",
                      background: active ? "var(--pixel-bg-alt)" : "transparent",
                    }}
                    onClick={() => router.push(item.href)}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    {active && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5" style={{ background: "var(--pixel-blue)" }} />
                    )}
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger
                className="inline-flex items-center justify-center w-9 h-9 transition-colors cursor-pointer"
                style={{ color: "var(--pixel-text-light)" }}
                onClick={() => router.push("/settings")}
              >
                <Settings className="w-4 h-4" />
              </TooltipTrigger>
              <TooltipContent>
                <p>API 设置</p>
              </TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block" />

            <Tooltip>
              <TooltipTrigger
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm transition-colors cursor-pointer"
                style={{ color: "var(--pixel-text-light)" }}
                onClick={handleLogout}
              >
                <User className="w-4 h-4" />
                <LogOut className="w-3.5 h-3.5" />
              </TooltipTrigger>
              <TooltipContent>
                <p>退出登录</p>
              </TooltipContent>
            </Tooltip>

            {/* Mobile menu */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger className="md:hidden inline-flex items-center justify-center w-9 h-9 transition-colors cursor-pointer" style={{ color: "var(--pixel-text-light)" }}>
                <Menu className="w-5 h-5" />
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] p-0">
                <SheetTitle className="sr-only">导航菜单</SheetTitle>
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b-3" style={{ borderColor: "var(--pixel-border-light)" }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 flex items-center justify-center pixel-border" style={{ background: "var(--pixel-blue)" }}>
                        <span className="text-white font-pixel-label">YJ</span>
                      </div>
                      <span className="font-pixel-heading font-bold" style={{ color: "var(--pixel-text)" }}>译界</span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto py-2">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const active = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 font-pixel-body font-medium transition-colors"
                          style={{
                            color: active ? "var(--pixel-text)" : "var(--pixel-text-light)",
                            background: active ? "var(--pixel-bg-alt)" : "transparent",
                            borderRight: active ? "3px solid var(--pixel-blue)" : "3px solid transparent",
                          }}
                        >
                          <Icon className="w-5 h-5" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                  <div className="p-4 border-t-3" style={{ borderColor: "var(--pixel-border-light)" }}>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2 font-pixel-body"
                      onClick={() => {
                        router.push("/settings");
                        setOpen(false);
                      }}
                    >
                      <Settings className="w-4 h-4" />
                      API 设置
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 mt-2 font-pixel-body"
                      style={{ color: "var(--pixel-text-light)" }}
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4" />
                      退出登录
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}

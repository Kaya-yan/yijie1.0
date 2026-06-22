"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Languages, BookOpen, ArrowRight, AiAppMac } from "pixelarticons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("auth") === "true") {
      router.push("/dashboard");
    }
  }, [router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      if (password === "20250304") {
        localStorage.setItem("auth", "true");
        router.push("/dashboard");
      } else {
        setError("密码错误，请重试");
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden pixel-grid scanlines" style={{ background: "var(--pixel-bg)" }}>
      {/* Pixel corner decorations */}
      <div className="absolute top-4 left-4 w-4 h-4" style={{ background: "var(--pixel-border)" }} />
      <div className="absolute top-4 right-4 w-4 h-4" style={{ background: "var(--pixel-border)" }} />
      <div className="absolute bottom-4 left-4 w-4 h-4" style={{ background: "var(--pixel-border)" }} />
      <div className="absolute bottom-4 right-4 w-4 h-4" style={{ background: "var(--pixel-border)" }} />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center pixel-border" style={{ background: "var(--pixel-blue)" }}>
            <span className="text-white font-pixel" style={{ fontSize: "10px" }}>YJ</span>
          </div>
          <span className="font-pixel-heading font-bold tracking-tight" style={{ color: "var(--pixel-text)" }}>
            译界
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--pixel-text-light)" }}>
          <span className="font-pixel-body">v1.0</span>
        </div>
      </header>

      {/* Main login card */}
      <main id="main-content" className="flex-1 flex items-center justify-center relative z-10 px-4">
        <div className="w-full max-w-md animate-scale-in">
          <Card className="pixel-card bg-white">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                {/* Pixel art logo */}
                <div className="mx-auto mb-5 animate-float font-pixel">
                  <div className="text-4xl mb-1" style={{ color: "var(--pixel-blue)", letterSpacing: "4px" }}>YI JIE</div>
                  <div className="text-xs" style={{ color: "var(--pixel-text-muted)" }}>[ 译 界 ]</div>
                </div>
                <h1 className="font-pixel-heading font-bold mb-2" style={{ color: "var(--pixel-text)" }}>
                  WELCOME
                </h1>
                <p className="font-pixel-body" style={{ color: "var(--pixel-text-light)" }}>
                  输入密码以进入平台
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block font-pixel-label mb-2" style={{ color: "var(--pixel-text-light)" }}>
                    PASSWORD
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-pixel-body" style={{ color: "var(--pixel-text-muted)" }}>{">"}</span>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="请输入密码"
                      className="pl-10 h-12 pixel-input"
                      autoFocus
                    />
                  </div>
                  {error && (
                    <p className="mt-2 text-sm flex items-center gap-1 font-pixel-body" style={{ color: "var(--pixel-red)" }}>
                      <span className="inline-block w-2 h-2" style={{ background: "var(--pixel-red)" }} />
                      {error}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading || !password}
                  className="pixel-btn w-full h-12"
                >
                  {loading ? (
                    <span className="font-pixel animate-pulse" style={{ fontSize: "10px" }}>LOADING...</span>
                  ) : (
                    <>
                      <span className="font-pixel" style={{ fontSize: "10px" }}>START</span>
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              {/* Features preview */}
              <div className="mt-8 pt-6 pixel-divider">
                <div className="flex items-center justify-center gap-6" style={{ color: "var(--pixel-text-muted)" }}>
                  <div className="flex items-center gap-1.5">
                    <Languages className="w-4 h-4" />
                    <span className="font-pixel-body">翻译</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    <span className="font-pixel-body">词典</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <AiAppMac className="w-4 h-4" />
                    <span className="font-pixel-body">AI</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs mt-6 font-pixel-body" style={{ color: "var(--pixel-text-muted)" }}>
            译界 - 多语言智能聚合平台
          </p>
        </div>
      </main>
    </div>
  );
}

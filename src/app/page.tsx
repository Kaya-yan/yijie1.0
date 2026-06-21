"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Languages, BookOpen, Brain, ArrowRight } from "lucide-react";
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
            <span className="text-white text-xs" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "10px" }}>YJ</span>
          </div>
          <span className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "14px", color: "var(--pixel-text)" }}>
            译界
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--pixel-text-light)" }}>
          <span style={{ fontFamily: "'VT323', monospace", fontSize: "18px" }}>v1.0</span>
        </div>
      </header>

      {/* Main login card */}
      <main className="flex-1 flex items-center justify-center relative z-10 px-4">
        <div className="w-full max-w-md animate-scale-in">
          <Card className="pixel-card bg-white">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                {/* Pixel art logo */}
                <div className="mx-auto mb-5 animate-float" style={{ fontFamily: "'Press Start 2P', monospace" }}>
                  <div className="text-4xl mb-1" style={{ color: "var(--pixel-blue)", letterSpacing: "4px" }}>YI JIE</div>
                  <div className="text-xs" style={{ color: "var(--pixel-text-muted)" }}>[ 译 界 ]</div>
                </div>
                <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "14px", color: "var(--pixel-text)" }}>
                  WELCOME
                </h1>
                <p style={{ fontFamily: "'VT323', monospace", fontSize: "20px", color: "var(--pixel-text-light)" }}>
                  输入密码以进入平台
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "9px", color: "var(--pixel-text-light)" }}>
                    PASSWORD
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ fontFamily: "'VT323', monospace", fontSize: "20px", color: "var(--pixel-text-muted)" }}>{">"}</span>
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
                    <p className="mt-2 text-sm flex items-center gap-1" style={{ fontFamily: "'VT323', monospace", fontSize: "18px", color: "var(--pixel-red)" }}>
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
                    <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "10px" }} className="animate-pulse">LOADING...</span>
                  ) : (
                    <>
                      <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "10px" }}>START</span>
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
                    <span style={{ fontFamily: "'VT323', monospace", fontSize: "18px" }}>翻译</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    <span style={{ fontFamily: "'VT323', monospace", fontSize: "18px" }}>词典</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Brain className="w-4 h-4" />
                    <span style={{ fontFamily: "'VT323', monospace", fontSize: "18px" }}>AI</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs mt-6" style={{ fontFamily: "'VT323', monospace", fontSize: "16px", color: "var(--pixel-text-muted)" }}>
            译界 - 多语言智能聚合平台
          </p>
        </div>
      </main>
    </div>
  );
}

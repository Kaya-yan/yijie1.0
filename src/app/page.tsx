"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, ArrowRight, Sparkles, Languages, BookOpen, Brain } from "lucide-react";
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
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-slate-950">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-slate-800/40 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-slate-800/30 rounded-full blur-[100px]" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/10">
            <Languages className="w-5 h-5 text-white" strokeWidth={1.8} />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">译界</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Sparkles className="w-4 h-4" />
          <span>多语言智能聚合平台</span>
        </div>
      </header>

      {/* Main login card */}
      <main className="flex-1 flex items-center justify-center relative z-10 px-4">
        <div className="w-full max-w-md animate-scale-in">
          <Card className="bg-white/[0.97] backdrop-blur-xl border-white/20 shadow-2xl shadow-black/20">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-slate-900/20 animate-float">
                  <Languages className="w-8 h-8 text-white" strokeWidth={1.5} />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">欢迎回来</h1>
                <p className="text-gray-500 text-sm">请输入密码以进入平台</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    访问密码
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="请输入密码"
                      className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                      autoFocus
                    />
                  </div>
                  {error && (
                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                      <span className="inline-block w-1 h-1 bg-red-500 rounded-full" />
                      {error}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading || !password}
                  className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white font-medium shadow-sm btn-press transition-all duration-200"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      进入平台
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              {/* Features preview */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-center gap-6 text-gray-400">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Languages className="w-3.5 h-3.5" />
                    <span>翻译</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>词典</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <Brain className="w-3.5 h-3.5" />
                    <span>AI</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-blue-200/40 text-xs mt-6">
            译界 - 多语言智能聚合平台
          </p>
        </div>
      </main>
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  ArrowRightLeft, Copy, Volume2, Mic, Sparkles, Zap, Shield,
  BookOpen, BookMarked, Lightbulb, PenTool, Gamepad2, Wrench,
  Check, ChevronDown, Loader2, AlertCircle,
  FileText, FileCode, Languages, Brain, ShieldCheck, Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useStore } from "@/lib/store";
import { translate } from "@/lib/api/client";
import { AddToVocabularyButton, ExportButton } from "@/components/shared";
import { exportTranslation, exportTranslationAsWord } from "@/lib/export";

const modelColors: Record<string, string> = {
  kimi: "bg-slate-600", deepseek: "bg-sky-600", tongyi: "bg-orange-500",
  wenxin: "bg-rose-500", zhipu: "bg-teal-600", xinghuo: "bg-amber-500",
};

const languages = [
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "en", name: "英语", flag: "🇬🇧" },
  { code: "ja", name: "日语", flag: "🇯🇵" },
  { code: "ko", name: "韩语", flag: "🇰🇷" },
  { code: "fr", name: "法语", flag: "🇫🇷" },
  { code: "de", name: "德语", flag: "🇩🇪" },
  { code: "es", name: "西班牙语", flag: "🇪🇸" },
  { code: "ru", name: "俄语", flag: "🇷🇺" },
];

const langCodeToSpeech: Record<string, string> = {
  zh: "zh-CN", en: "en-US", ja: "ja-JP", ko: "ko-KR",
  fr: "fr-FR", de: "de-DE", es: "es-ES", ru: "ru-RU",
};

const mockTranslations: Record<string, Record<string, string>> = {
  "hello": { zh: "你好", ja: "こんにちは", ko: "안녕하세요", fr: "Bonjour", de: "Hallo", es: "Hola", ru: "Привет" },
  "good morning": { zh: "早上好", ja: "おはようございます", ko: "좋은 아침", fr: "Bonjour", de: "Guten Morgen", es: "Buenos días", ru: "Доброе утро" },
  "thank you": { zh: "谢谢", ja: "ありがとう", ko: "감사합니다", fr: "Merci", de: "Danke", es: "Gracias", ru: "Спасибо" },
  "how are you": { zh: "你好吗", ja: "お元気ですか", ko: "어떻게 지내세요", fr: "Comment allez-vous", de: "Wie geht es Ihnen", es: "¿Cómo estás?", ru: "Как дела?" },
};

export default function DashboardPage() {
  const router = useRouter();
  const { selectedModelId, setSelectedModelId, addTranslation, models: storeModels, translationHistory, clearTranslationHistory } = useStore();
  const [mounted, setMounted] = useState(false);
  const [sourceText, setSourceText] = useState("");
  const [targetText, setTargetText] = useState("");
  const [sourceLang, setSourceLang] = useState(languages[1]);
  const [targetLang, setTargetLang] = useState(languages[0]);
  const [copied, setCopied] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const isConfigured = mounted && storeModels.some((m) => m.enabled && m.apiKey);

  const displayModels = useMemo(() => storeModels.map((m) => ({
    ...m, desc: m.provider, color: modelColors[m.id] || "bg-gray-500",
  })), [storeModels]);

  const [selectedModel, setSelectedModel] = useState<typeof displayModels[0] | null>(null);
  const [modelOpen, setModelOpen] = useState(false);
  const [sourceLangOpen, setSourceLangOpen] = useState(false);
  const [targetLangOpen, setTargetLangOpen] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (displayModels.length === 0) return;
    if (selectedModelId) {
      const model = displayModels.find((m) => m.id === selectedModelId);
      if (model) setSelectedModel(model);
    } else if (!selectedModel) {
      setSelectedModel(displayModels[0]);
    }
  }, [selectedModelId, displayModels]);

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;
    setTranslating(true);
    setError(null);
    try {
      if (isConfigured && selectedModel) {
        const result = await translate({ text: sourceText, sourceLang: sourceLang.code, targetLang: targetLang.code, modelId: selectedModel.id });
        setTargetText(result.result);
        addTranslation({ sourceText, targetText: result.result, sourceLang: sourceLang.code, targetLang: targetLang.code, model: result.model });
      } else {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const mockResult = mockTranslations[sourceText.toLowerCase().trim()]?.[targetLang.code] || `[${targetLang.name}] ${sourceText}`;
        setTargetText(mockResult);
        addTranslation({ sourceText, targetText: mockResult, sourceLang: sourceLang.code, targetLang: targetLang.code, model: "本地演示" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "翻译失败，请重试");
    } finally {
      setTranslating(false);
    }
  };

  const swapLangs = () => {
    setSourceLang(targetLang); setTargetLang(sourceLang);
    setSourceText(targetText); setTargetText(sourceText);
  };

  const copyResult = () => {
    if (targetText) { navigator.clipboard.writeText(targetText); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  const speakText = (text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = langCodeToSpeech[targetLang.code] || "en-US";
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
        {/* Hero */}
        <section className="mb-16 section-enter">
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-4 bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium">
              多语言智能聚合平台
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 tracking-tight text-balance">
              智能翻译，连接世界
            </h1>
            <p className="text-gray-500 max-w-xl mx-auto leading-relaxed">
              集成 Kimi、DeepSeek、通义千问等国内主流大模型，提供精准的多语言翻译服务
            </p>
          </div>

          {/* Model Selector */}
          <div className="flex justify-center mb-6">
            <Popover open={modelOpen} onOpenChange={setModelOpen}>
              <PopoverTrigger className="inline-flex items-center justify-center h-10 px-4 gap-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <div className={`w-2 h-2 rounded-full ${selectedModel?.color || "bg-gray-400"}`} />
                <span className="font-medium text-sm">{selectedModel?.name || "选择模型"}</span>
                <span className="text-gray-400 text-xs">({selectedModel?.desc || ""})</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${modelOpen ? "rotate-180" : ""}`} />
              </PopoverTrigger>
              <PopoverContent className="w-[240px] p-0" align="center">
                <Command>
                  <CommandInput placeholder="搜索模型..." />
                  <CommandList>
                    <CommandEmpty>未找到模型</CommandEmpty>
                    <CommandGroup>
                      {displayModels.map((m) => (
                        <CommandItem key={m.id} onSelect={() => { setSelectedModel(m); setSelectedModelId(m.id); setModelOpen(false); }} className="gap-2">
                          <div className={`w-2 h-2 rounded-full ${m.color}`} />
                          <span>{m.name}</span>
                          <span className="text-gray-400 text-xs ml-auto">{m.desc}</span>
                          {selectedModel?.id === m.id && <Check className="w-4 h-4 text-blue-600" />}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* API Warning */}
          {!isConfigured && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-amber-600">未配置 API，使用本地演示模式</span>
              <Button variant="link" size="sm" className="text-blue-600 h-auto p-0" onClick={() => router.push("/settings")}>去设置</Button>
            </div>
          )}

          {/* Translation Workbench */}
          <Card className="bg-white border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50/50">
              <Popover open={sourceLangOpen} onOpenChange={setSourceLangOpen}>
                <PopoverTrigger className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium hover:bg-gray-100 rounded-md transition-colors cursor-pointer">
                  <span className="text-lg">{sourceLang.flag}</span>
                  <span>{sourceLang.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </PopoverTrigger>
                <PopoverContent className="w-[160px] p-0" align="start">
                  <Command><CommandList><CommandGroup>
                    {languages.map((l) => (
                      <CommandItem key={l.code} onSelect={() => { setSourceLang(l); setSourceLangOpen(false); }} className="gap-2">
                        <span>{l.flag}</span><span>{l.name}</span>
                        {sourceLang.code === l.code && <Check className="w-4 h-4 text-blue-600 ml-auto" />}
                      </CommandItem>
                    ))}
                  </CommandGroup></CommandList></Command>
                </PopoverContent>
              </Popover>
              <Button variant="ghost" size="icon" onClick={swapLangs} className="h-8 w-8 text-gray-400 hover:text-gray-600">
                <ArrowRightLeft className="w-4 h-4" />
              </Button>
              <Popover open={targetLangOpen} onOpenChange={setTargetLangOpen}>
                <PopoverTrigger className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium hover:bg-gray-100 rounded-md transition-colors cursor-pointer">
                  <span className="text-lg">{targetLang.flag}</span>
                  <span>{targetLang.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </PopoverTrigger>
                <PopoverContent className="w-[160px] p-0" align="end">
                  <Command><CommandList><CommandGroup>
                    {languages.map((l) => (
                      <CommandItem key={l.code} onSelect={() => { setTargetLang(l); setTargetLangOpen(false); }} className="gap-2">
                        <span>{l.flag}</span><span>{l.name}</span>
                        {targetLang.code === l.code && <Check className="w-4 h-4 text-blue-600 ml-auto" />}
                      </CommandItem>
                    ))}
                  </CommandGroup></CommandList></Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
              <div className="p-4">
                <Textarea value={sourceText} onChange={(e) => setSourceText(e.target.value)} placeholder="在此输入文本..." className="w-full h-48 resize-none border-0 p-0 text-base focus-visible:ring-0 shadow-none bg-transparent" />
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600 gap-1.5" disabled>
                    <Mic className="w-3.5 h-3.5" /><span className="text-xs">语音输入（开发中）</span>
                  </Button>
                  <span className="text-xs text-gray-400 font-mono tabular-nums">{sourceText.length} / 2000</span>
                </div>
              </div>
              <div className="p-4 bg-gray-50/30">
                {translating ? (
                  <div className="h-48 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                      <span className="text-sm text-gray-500">翻译中...</span>
                    </div>
                  </div>
                ) : targetText ? (
                  <div className="h-full">
                    <div className="text-base leading-relaxed min-h-[12rem] text-gray-900">{targetText}</div>
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                      <Button variant="ghost" size="icon" className={`h-8 w-8 ${copied ? "text-green-500" : "text-gray-400 hover:text-gray-600"}`} onClick={copyResult}>
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600" onClick={() => speakText(targetText)}>
                        <Volume2 className="w-3.5 h-3.5" />
                      </Button>
                      <AddToVocabularyButton word={sourceText.trim().toLowerCase()} meaning={targetText} source="translation" variant="icon" />
                      <ExportButton variant="icon" options={[
                        { label: "Markdown", format: "md", icon: FileCode, action: () => exportTranslation(sourceText, targetText, sourceLang.name, targetLang.name, selectedModel?.name || "本地演示") },
                        { label: "Word 文档", format: "doc", icon: FileText, action: () => exportTranslationAsWord(sourceText, targetText, sourceLang.name, targetLang.name, selectedModel?.name || "本地演示") },
                      ]} />
                    </div>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-gray-400 text-sm">翻译结果将显示在这里</div>
                )}
              </div>
            </div>
          </Card>

          {error && (
            <div className="flex items-center justify-center gap-2 mt-4 text-red-500">
              <AlertCircle className="w-4 h-4" /><span className="text-sm">{error}</span>
            </div>
          )}

          <div className="flex justify-center mt-6">
            <Button onClick={handleTranslate} disabled={translating || !sourceText.trim()} className="h-11 px-10 bg-gray-900 hover:bg-gray-800 text-white font-medium shadow-sm gap-2 btn-press">
              {translating ? <><Loader2 className="w-4 h-4 animate-spin" />翻译中...</> : "翻译"}
            </Button>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="mb-16 section-enter section-enter-1">
          <h2 className="text-xl font-semibold text-gray-900 text-center mb-6 tracking-tight">一站式语言学习工具</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: BookOpen, title: "智能词典", desc: "单词释义、音标、例句，一键获取", href: "/dictionary", color: "text-blue-600", bg: "bg-blue-50" },
              { icon: Lightbulb, title: "语法知识点", desc: "AI 分析句子结构，讲解语法要点", href: "/grammar", color: "text-amber-600", bg: "bg-amber-50" },
              { icon: PenTool, title: "写作训练", desc: "多场景写作辅助，AI 实时建议", href: "/writing", color: "text-emerald-600", bg: "bg-emerald-50" },
              { icon: BookMarked, title: "智能阅读", desc: "词汇标注、段落翻译、AI 讲解", href: "/reading", color: "text-rose-600", bg: "bg-rose-50" },
            ].map((item, i) => (
              <a key={item.title} href={item.href} className={`group p-5 bg-white border border-gray-200 rounded-xl spring-hover animate-slide-up stagger-${i + 1}`}>
                <div className={`w-10 h-10 ${item.bg} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 text-sm">{item.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </a>
            ))}
          </div>
        </section>

        {/* Supported Models */}
        <section className="mb-16 section-enter section-enter-2">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-10 shadow-sm">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">支持多种 AI 模型</h2>
              <p className="text-gray-500 text-sm">自由切换，找到最适合你的翻译引擎</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {displayModels.map((m) => (
                <div key={m.id} className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-colors">
                  <div className={`w-2 h-2 rounded-full ${m.color}`} />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{m.name}</div>
                    <div className="text-xs text-gray-500">{m.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="mb-16 section-enter section-enter-3">
          <h2 className="text-xl font-semibold text-gray-900 text-center mb-6 tracking-tight">为什么选择 译界</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { icon: Zap, title: "极速响应", desc: "毫秒级翻译速度，流畅不卡顿" },
              { icon: Shield, title: "隐私安全", desc: "数据本地存储，不上传不泄露" },
              { icon: Languages, title: "多语言覆盖", desc: "支持 8+ 种语言互译" },
            ].map((item) => (
              <div key={item.title} className="text-center p-6 bg-white rounded-xl border border-gray-100 spring-hover">
                <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-5 h-5 text-slate-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1.5 text-sm">{item.title}</h3>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Popular Language Pairs */}
        <section className="mb-16 section-enter section-enter-4">
          <h2 className="text-xl font-semibold text-gray-900 text-center mb-2 tracking-tight">热门语言对</h2>
          <p className="text-gray-500 text-center mb-6 text-sm">选择常用语言组合，快速开始翻译</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { from: "🇬🇧 英语", to: "🇨🇳 中文", pair: "en-zh" },
              { from: "🇨🇳 中文", to: "🇬🇧 英语", pair: "zh-en" },
              { from: "🇯🇵 日语", to: "🇨🇳 中文", pair: "ja-zh" },
              { from: "🇰🇷 韩语", to: "🇨🇳 中文", pair: "ko-zh" },
              { from: "🇫🇷 法语", to: "🇬🇧 英语", pair: "fr-en" },
              { from: "🇩🇪 德语", to: "🇬🇧 英语", pair: "de-en" },
            ].map((lp) => (
              <button key={lp.pair} onClick={() => {
                const [fromCode, toCode] = lp.pair.split("-");
                const from = languages.find((l) => l.code === fromCode);
                const to = languages.find((l) => l.code === toCode);
                if (from && to) { setSourceLang(from); setTargetLang(to); setSourceText(""); setTargetText(""); }
              }} className="flex items-center justify-center gap-2 p-3 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all text-sm spring-hover">
                <span>{lp.from}</span>
                <ArrowRightLeft className="w-3 h-3 text-gray-400" />
                <span>{lp.to}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Translation History */}
        {translationHistory.length > 0 && (
          <section className="mb-16 section-enter section-enter-5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 tracking-tight">最近翻译</h2>
              <button onClick={clearTranslationHistory} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">清空记录</button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {translationHistory.slice(0, 6).map((item, i) => (
                <div key={item.id} className={`p-4 bg-white border border-gray-200 rounded-xl spring-hover animate-slide-up stagger-${i + 1}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {languages.find((l) => l.code === item.sourceLang)?.flag} {languages.find((l) => l.code === item.sourceLang)?.name}
                      → {languages.find((l) => l.code === item.targetLang)?.flag} {languages.find((l) => l.code === item.targetLang)?.name}
                    </Badge>
                    <span className="text-xs text-gray-400 ml-auto font-mono">{item.model}</span>
                  </div>
                  <p className="text-sm text-gray-900 line-clamp-1 mb-1">{item.sourceText}</p>
                  <p className="text-sm text-gray-500 line-clamp-1">{item.targetText}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* How It Works */}
        <section className="mb-16 section-enter section-enter-5">
          <h2 className="text-xl font-semibold text-gray-900 text-center mb-2 tracking-tight">如何使用</h2>
          <p className="text-gray-500 text-center mb-8 text-sm">三步开始你的智能翻译之旅</p>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: "01", title: "配置模型", desc: "在设置页面添加 API Key，支持多个国产大模型" },
              { step: "02", title: "输入文本", desc: "选择源语言和目标语言，输入需要翻译的文本" },
              { step: "03", title: "获取结果", desc: "即时返回高质量翻译，支持复制、朗读、导出" },
            ].map((item, i) => (
              <div key={item.step} className={`relative animate-slide-up stagger-${i + 1}`}>
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold text-sm flex items-center justify-center mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">{item.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                {i < 2 && <div className="hidden sm:block absolute top-5 left-full w-8 text-gray-300">→</div>}
              </div>
            ))}
          </div>
        </section>

        {/* Scenarios */}
        <section className="mb-16 section-enter section-enter-6">
          <h2 className="text-xl font-semibold text-gray-900 text-center mb-2 tracking-tight">适用场景</h2>
          <p className="text-gray-500 text-center mb-6 text-sm">覆盖学习、工作、生活中的各种翻译需求</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "学术论文", desc: "精准翻译学术文献，保留专业术语", color: "bg-blue-50 text-blue-700" },
              { title: "商务邮件", desc: "正式得体的商务沟通翻译", color: "bg-emerald-50 text-emerald-700" },
              { title: "日常对话", desc: "自然流畅的口语化翻译", color: "bg-amber-50 text-amber-700" },
              { title: "技术文档", desc: "代码注释、API 文档等技术内容", color: "bg-slate-100 text-slate-700" },
            ].map((item) => (
              <div key={item.title} className="p-4 bg-white border border-gray-200 rounded-xl spring-hover">
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-2 ${item.color}`}>{item.title}</span>
                <p className="text-xs text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="mb-16 section-enter">
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 p-8 sm:p-10 shadow-sm">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
              {[
                { value: "8+", label: "语言" },
                { value: "6+", label: "AI 模型" },
                { value: "8", label: "功能模块" },
                { value: "60+", label: "AI 工具收录" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-3xl font-bold mb-1 text-gray-900 font-mono tabular-nums">{stat.value}</div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* More Modules */}
        <section className="mb-16 section-enter">
          <div className="grid sm:grid-cols-2 gap-4">
            <a href="/game" className="flex items-center gap-5 p-6 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all group spring-hover">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200">
                <Gamepad2 className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1 text-sm text-gray-900">休闲小游戏</h3>
                <p className="text-xs text-gray-500">学习之余，来一局经典恐龙跑酷</p>
              </div>
            </a>
            <a href="/tools" className="flex items-center gap-5 p-6 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all group spring-hover">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200">
                <Wrench className="w-6 h-6 text-slate-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1 text-sm text-gray-900">AI 工具聚合</h3>
                <p className="text-xs text-gray-500">发现更多 AI 工具，提升效率</p>
              </div>
            </a>
          </div>
        </section>

        {/* About Section */}
        <section className="mb-16 section-enter">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12 overflow-hidden relative shadow-sm">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(148,163,184,0.06),transparent_60%)]" />
            <div className="relative">
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gray-100 rounded-full text-sm text-gray-600 mb-4">
                  <Sparkles className="w-3.5 h-3.5" />
                  About 译界
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-3 tracking-tight text-gray-900">译界 · 多语言智能聚合平台</h2>
                <p className="text-gray-500 max-w-2xl mx-auto text-sm leading-relaxed">
                  面向语言学习者的一站式智能平台，深度融合大语言模型技术，提供翻译、词汇、语法、写作、阅读五大核心模块的全方位学习支持。
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {[
                  { icon: Brain, title: "AI 驱动", desc: "集成 Kimi、DeepSeek、通义千问等国内顶级大模型", color: "bg-blue-50 text-blue-600" },
                  { icon: Layers, title: "五大模块", desc: "翻译、生词本、语法、写作、阅读，覆盖全链路", color: "bg-emerald-50 text-emerald-600" },
                  { icon: ShieldCheck, title: "隐私优先", desc: "数据本地存储，API Key 仅用于请求，不上传不泄露", color: "bg-amber-50 text-amber-600" },
                  { icon: Languages, title: "多语言", desc: "中英日韩法德西俄 8+ 种语言互译", color: "bg-rose-50 text-rose-600" },
                ].map((item) => (
                  <div key={item.title} className="p-4 bg-gray-50 border border-gray-200 rounded-xl spring-hover">
                    <div className={`w-9 h-9 ${item.color} rounded-lg flex items-center justify-center mb-3`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1.5 text-gray-900">{item.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="grid sm:grid-cols-3 gap-6 text-center mb-10">
                <div>
                  <div className="text-lg font-semibold text-gray-900 mb-1 font-mono">OpenAI Compatible</div>
                  <p className="text-xs text-gray-500">基于 OpenAI 兼容协议，无缝对接主流国产大模型</p>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900 mb-1 font-mono">SM-2 Spaced Repetition</div>
                  <p className="text-xs text-gray-500">经典间隔重复算法，科学规划词汇复习节奏</p>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900 mb-1 font-mono">Next.js 16 + TypeScript</div>
                  <p className="text-xs text-gray-500">现代化技术栈，全栈类型安全</p>
                </div>
              </div>

              <div className="pt-8 border-t border-gray-200 text-center">
                <p className="text-sm text-gray-500 leading-relaxed max-w-3xl mx-auto">
                  译界致力于让语言学习更高效、更智能。我们相信，AI 技术应当成为每一位学习者的私人导师——不是替代思考，而是激发潜能。从精准翻译到深度分析，从智能纠错到个性化练习，译界正在重新定义语言学习的体验。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-200 py-8 text-center">
          <p className="text-xs text-gray-400">© 2025 译界. 多语言智能聚合平台.</p>
        </footer>
      </main>
    </div>
  );
}

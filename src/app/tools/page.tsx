"use client";

import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import {
  Search, ExternalLink, Sparkles, Image, Code, Video, Music, MessageSquare,
  FileText, Cpu, PenTool, Wrench, TrendingUp, Zap, Languages,
  Calculator, GitCompare, ArrowRightLeft, Copy, Check, Type, Hash, AlignLeft, RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

// ============ Built-in Tools ============

function TextStatsTool() {
  const [text, setText] = useState("");

  const stats = useMemo(() => {
    if (!text.trim()) return null;
    const chars = text.length;
    const charsNoSpace = text.replace(/\s/g, "").length;
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim()).length;
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim()).length;
    const lines = text.split("\n").length;
    const chineseChars = (text.match(/[一-鿿]/g) || []).length;
    const englishWords = text.match(/[a-zA-Z]+/g)?.length || 0;
    const numbers = (text.match(/\d+/g) || []).length;
    return { chars, charsNoSpace, words, sentences, paragraphs, lines, chineseChars, englishWords, numbers };
  }, [text]);

  return (
    <div className="space-y-4">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="粘贴或输入文本..."
        className="w-full h-32 resize-none border-gray-200"
      />
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "字符数", value: stats.chars },
            { label: "不含空格", value: stats.charsNoSpace },
            { label: "词数", value: stats.words },
            { label: "句子数", value: stats.sentences },
            { label: "段落数", value: stats.paragraphs },
            { label: "行数", value: stats.lines },
            { label: "中文字数", value: stats.chineseChars },
            { label: "英文单词", value: stats.englishWords },
            { label: "数字个数", value: stats.numbers },
          ].map((s) => (
            <div key={s.label} className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TextDiffTool() {
  const [text1, setText1] = useState("");
  const [text2, setText2] = useState("");
  const [showDiff, setShowDiff] = useState(false);

  const diffResult = useMemo(() => {
    if (!showDiff || !text1 || !text2) return null;
    const lines1 = text1.split("\n");
    const lines2 = text2.split("\n");
    const maxLen = Math.max(lines1.length, lines2.length);
    const results: { line1: string; line2: string; same: boolean }[] = [];
    for (let i = 0; i < maxLen; i++) {
      const l1 = lines1[i] || "";
      const l2 = lines2[i] || "";
      results.push({ line1: l1, line2: l2, same: l1 === l2 });
    }
    return results;
  }, [text1, text2, showDiff]);

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">文本 A</label>
          <Textarea
            value={text1}
            onChange={(e) => { setText1(e.target.value); setShowDiff(false); }}
            placeholder="输入第一段文本..."
            className="w-full h-32 resize-none border-gray-200"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">文本 B</label>
          <Textarea
            value={text2}
            onChange={(e) => { setText2(e.target.value); setShowDiff(false); }}
            placeholder="输入第二段文本..."
            className="w-full h-32 resize-none border-gray-200"
          />
        </div>
      </div>
      <Button
        onClick={() => setShowDiff(true)}
        disabled={!text1.trim() || !text2.trim()}
        className="gap-2 bg-gray-900"
      >
        <GitCompare className="w-4 h-4" />
        对比差异
      </Button>
      {diffResult && (
        <div className="space-y-1">
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
            <span>相同行: {diffResult.filter((d) => d.same).length}</span>
            <span>不同行: {diffResult.filter((d) => !d.same).length}</span>
          </div>
          <div className="border rounded-lg overflow-hidden">
            <div className="grid grid-cols-2 divide-x">
              <div className="p-1">
                <div className="text-xs font-medium text-gray-400 px-2 py-1 bg-gray-50">文本 A</div>
                {diffResult.map((d, i) => (
                  <div key={i} className={`px-2 py-0.5 text-sm font-mono ${d.same ? "text-gray-600" : "bg-red-50 text-red-700"}`}>
                    {d.line1 || <span className="text-gray-300">(空行)</span>}
                  </div>
                ))}
              </div>
              <div className="p-1">
                <div className="text-xs font-medium text-gray-400 px-2 py-1 bg-gray-50">文本 B</div>
                {diffResult.map((d, i) => (
                  <div key={i} className={`px-2 py-0.5 text-sm font-mono ${d.same ? "text-gray-600" : "bg-green-50 text-green-700"}`}>
                    {d.line2 || <span className="text-gray-300">(空行)</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormatConverterTool() {
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);

  const conversions = useMemo(() => {
    if (!input.trim()) return [];
    return [
      { label: "大写", value: input.toUpperCase() },
      { label: "小写", value: input.toLowerCase() },
      { label: "首字母大写", value: input.replace(/\b\w/g, (c) => c.toUpperCase()) },
      { label: "句首大写", value: input.replace(/(^\s*\w|[.!?]\s+\w)/g, (c) => c.toUpperCase()) },
      { label: "反转大小写", value: input.split("").map((c) => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join("") },
      { label: "去多余空格", value: input.replace(/\s+/g, " ").trim() },
      { label: "全角转半角", value: input.replace(/[！-～]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).replace(/　/g, " ") },
      { label: "半角转全角", value: input.replace(/[\x21-\x7e]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0xfee0)).replace(/ /g, "　") },
    ];
  }, [input]);

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-4">
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="输入要转换的文本..."
        className="w-full h-24 resize-none border-gray-200"
      />
      {conversions.length > 0 && (
        <div className="space-y-2">
          {conversions.map((c) => (
            <div key={c.label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-xs font-medium text-gray-500 w-20 shrink-0">{c.label}</span>
              <span className="text-sm text-gray-900 flex-1 truncate font-mono">{c.value}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => copyText(c.value)}
              >
                {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-gray-400" />}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ External Tools Data ============

const categories = [
  { id: "all", name: "全部", icon: Sparkles, color: "bg-gray-100 text-gray-700" },
  { id: "builtin", name: "内置工具", icon: Wrench, color: "bg-emerald-100 text-emerald-700" },
  { id: "llm", name: "大模型", icon: Cpu, color: "bg-blue-100 text-blue-700" },
  { id: "writing", name: "写作", icon: PenTool, color: "bg-emerald-100 text-emerald-700" },
  { id: "image", name: "图像", icon: Image, color: "bg-purple-100 text-purple-700" },
  { id: "code", name: "编程", icon: Code, color: "bg-orange-100 text-orange-700" },
  { id: "video", name: "视频", icon: Video, color: "bg-red-100 text-red-700" },
  { id: "audio", name: "音频", icon: Music, color: "bg-pink-100 text-pink-700" },
  { id: "translate", name: "翻译", icon: Languages, color: "bg-cyan-100 text-cyan-700" },
  { id: "productivity", name: "效率", icon: Zap, color: "bg-amber-100 text-amber-700" },
];

const categoryIconMap: Record<string, typeof Sparkles> = {
  llm: Cpu,
  writing: PenTool,
  image: Image,
  code: Code,
  video: Video,
  audio: Music,
  translate: Languages,
  productivity: Zap,
};

interface Tool {
  name: string;
  category: string;
  desc: string;
  url: string;
  color: string;
  hot?: boolean;
  new?: boolean;
}

const tools: Tool[] = [
  { name: "ChatGPT", category: "llm", desc: "OpenAI 最强对话模型", url: "https://chat.openai.com", color: "bg-green-500", hot: true },
  { name: "Claude", category: "llm", desc: "Anthropic 长文本处理专家", url: "https://claude.ai", color: "bg-amber-500", hot: true },
  { name: "Gemini", category: "llm", desc: "Google 多模态 AI", url: "https://gemini.google.com", color: "bg-blue-500" },
  { name: "Kimi", category: "llm", desc: "月之暗面超长上下文模型", url: "https://kimi.moonshot.cn", color: "bg-gray-800", hot: true },
  { name: "DeepSeek", category: "llm", desc: "深度求索高性能模型", url: "https://chat.deepseek.com", color: "bg-blue-600", hot: true },
  { name: "文心一言", category: "llm", desc: "百度中文大模型", url: "https://yiyan.baidu.com", color: "bg-red-500" },
  { name: "通义千问", category: "llm", desc: "阿里云大语言模型", url: "https://tongyi.aliyun.com", color: "bg-orange-500" },
  { name: "智谱清言", category: "llm", desc: "清华系 ChatGLM 模型", url: "https://chatglm.cn", color: "bg-teal-500" },
  { name: "讯飞星火", category: "llm", desc: "科大讯飞认知大模型", url: "https://xinghuo.xfyun.cn", color: "bg-orange-600" },
  { name: "豆包", category: "llm", desc: "字节跳动 AI 助手", url: "https://www.doubao.com", color: "bg-sky-500" },
  { name: "百川智能", category: "llm", desc: "百川大语言模型", url: "https://www.baichuan-ai.com", color: "bg-cyan-500" },
  { name: "MiniMax", category: "llm", desc: "MiniMax 海螺AI", url: "https://hailuoai.com", color: "bg-violet-500" },
  { name: "零一万物", category: "llm", desc: "Yi 大模型", url: "https://www.lingyiwanwu.com", color: "bg-indigo-500" },
  { name: "Jasper", category: "writing", desc: "营销文案 AI 写作", url: "https://www.jasper.ai", color: "bg-red-500" },
  { name: "Copy.ai", category: "writing", desc: "多场景 AI 写作助手", url: "https://www.copy.ai", color: "bg-gray-800" },
  { name: "Grammarly", category: "writing", desc: "语法检查与写作增强", url: "https://www.grammarly.com", color: "bg-green-600" },
  { name: "QuillBot", category: "writing", desc: "改写、润色、摘要", url: "https://quillbot.com", color: "bg-emerald-500" },
  { name: "秘塔写作猫", category: "writing", desc: "中文 AI 写作助手", url: "https://xiezuocat.com", color: "bg-sky-500" },
  { name: "火山写作", category: "writing", desc: "字节跳动写作助手", url: "https://writingo.net", color: "bg-orange-500" },
  { name: "Notion AI", category: "writing", desc: "笔记与知识管理 AI", url: "https://www.notion.so/product/ai", color: "bg-gray-900" },
  { name: "Midjourney", category: "image", desc: "顶级 AI 绘画工具", url: "https://www.midjourney.com", color: "bg-indigo-600", hot: true },
  { name: "DALL-E", category: "image", desc: "OpenAI 图像生成", url: "https://openai.com/dall-e-3", color: "bg-green-600" },
  { name: "Stable Diffusion", category: "image", desc: "开源文生图模型", url: "https://stability.ai", color: "bg-violet-600" },
  { name: "Remove.bg", category: "image", desc: "AI 一键抠图", url: "https://www.remove.bg", color: "bg-blue-500" },
  { name: "Canva AI", category: "image", desc: "AI 设计助手", url: "https://www.canva.com", color: "bg-cyan-500" },
  { name: "即梦AI", category: "image", desc: "字节跳动 AI 绘画", url: "https://jimeng.jianying.com", color: "bg-pink-500" },
  { name: "通义万相", category: "image", desc: "阿里 AI 绘画", url: "https://tongyi.aliyun.com/wanxiang", color: "bg-orange-500" },
  { name: "文心一格", category: "image", desc: "百度 AI 绘画", url: "https://yige.baidu.com", color: "bg-red-500" },
  { name: "可图", category: "image", desc: "快手 AI 绘画", url: "https://kolors.kuaishou.com", color: "bg-yellow-500" },
  { name: "GitHub Copilot", category: "code", desc: "AI 代码补全助手", url: "https://github.com/features/copilot", color: "bg-gray-900", hot: true },
  { name: "Cursor", category: "code", desc: "AI 驱动的代码编辑器", url: "https://cursor.sh", color: "bg-violet-600", hot: true },
  { name: "Codeium", category: "code", desc: "免费的 AI 编程助手", url: "https://codeium.com", color: "bg-blue-500" },
  { name: "Replit", category: "code", desc: "在线编程与 AI 助手", url: "https://replit.com", color: "bg-orange-500" },
  { name: "通义灵码", category: "code", desc: "阿里 AI 编程助手", url: "https://tongyi.aliyun.com/lingma", color: "bg-orange-600" },
  { name: "CodeGeeX", category: "code", desc: "智谱 AI 编程助手", url: "https://codegeex.cn", color: "bg-teal-500" },
  { name: "Bolt.new", category: "code", desc: "AI 全栈开发", url: "https://bolt.new", color: "bg-sky-500", new: true },
  { name: "v0", category: "code", desc: "Vercel AI 生成 UI", url: "https://v0.dev", color: "bg-gray-900", new: true },
  { name: "Sora", category: "video", desc: "OpenAI 文本生成视频", url: "https://openai.com/sora", color: "bg-gray-900", hot: true },
  { name: "Runway", category: "video", desc: "AI 视频编辑与生成", url: "https://runwayml.com", color: "bg-violet-600" },
  { name: "Pika", category: "video", desc: "快速 AI 视频生成", url: "https://pika.art", color: "bg-pink-500" },
  { name: "HeyGen", category: "video", desc: "AI 数字人视频", url: "https://www.heygen.com", color: "bg-blue-600" },
  { name: "剪映", category: "video", desc: "字节跳动视频编辑", url: "https://www.capcut.cn", color: "bg-gray-900" },
  { name: "可灵AI", category: "video", desc: "快手 AI 视频生成", url: "https://klingai.kuaishou.com", color: "bg-yellow-500" },
  { name: "即梦AI视频", category: "video", desc: "字节跳动 AI 视频", url: "https://jimeng.jianying.com", color: "bg-pink-600" },
  { name: "Vidu", category: "video", desc: "生数科技 AI 视频", url: "https://www.vidu.cn", color: "bg-blue-500", new: true },
  { name: "ElevenLabs", category: "audio", desc: "AI 语音合成与克隆", url: "https://elevenlabs.io", color: "bg-gray-900" },
  { name: "Whisper", category: "audio", desc: "OpenAI 语音识别", url: "https://openai.com/research/whisper", color: "bg-green-600" },
  { name: "Suno", category: "audio", desc: "AI 音乐生成", url: "https://suno.ai", color: "bg-violet-600", hot: true },
  { name: "Udio", category: "audio", desc: "AI 音乐创作", url: "https://www.udio.com", color: "bg-indigo-600" },
  { name: "讯飞听见", category: "audio", desc: "语音转文字", url: "https://www.iflyrec.com", color: "bg-orange-500" },
  { name: "通义听悟", category: "audio", desc: "阿里语音转文字", url: "https://tingwu.aliyun.com", color: "bg-orange-600" },
  { name: "DeepL", category: "translate", desc: "AI 翻译工具", url: "https://www.deepl.com", color: "bg-blue-600", hot: true },
  { name: "有道翻译", category: "translate", desc: "网易翻译工具", url: "https://fanyi.youdao.com", color: "bg-red-500" },
  { name: "百度翻译", category: "translate", desc: "百度翻译服务", url: "https://fanyi.baidu.com", color: "bg-blue-500" },
  { name: "彩云小译", category: "translate", desc: "双语对照翻译", url: "https://fanyi.caiyunapp.com", color: "bg-sky-500" },
  { name: "腾讯翻译君", category: "translate", desc: "腾讯翻译工具", url: "https://fanyi.qq.com", color: "bg-sky-600" },
  { name: "Perplexity", category: "productivity", desc: "AI 搜索引擎", url: "https://www.perplexity.ai", color: "bg-teal-600", hot: true },
  { name: "Monica", category: "productivity", desc: "AI 浏览器助手", url: "https://monica.im", color: "bg-violet-500" },
  { name: "飞书智能伙伴", category: "productivity", desc: "字节跳动办公 AI", url: "https://www.feishu.cn", color: "bg-blue-500" },
  { name: "WPS AI", category: "productivity", desc: "金山办公 AI 助手", url: "https://ai.wps.cn", color: "bg-red-600" },
  { name: "通义智文", category: "productivity", desc: "AI 文档阅读", url: "https://zhiwen.aliyun.com", color: "bg-orange-500" },
  { name: "Kimi 浏览器助手", category: "productivity", desc: "月之暗面浏览器插件", url: "https://kimi.moonshot.cn", color: "bg-gray-800" },
];

const builtInToolsList = [
  { id: "text-stats", name: "字数统计", desc: "统计字符、单词、句子、段落数量", icon: Hash, color: "bg-blue-500" },
  { id: "text-diff", name: "文本对比", desc: "对比两段文本的差异", icon: GitCompare, color: "bg-emerald-500" },
  { id: "format-converter", name: "格式转换", desc: "大小写、全半角等文本格式转换", icon: ArrowRightLeft, color: "bg-purple-500" },
];

export default function ToolsPage() {
  useAuth();
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [activeBuiltinTool, setActiveBuiltinTool] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (activeCategory === "builtin") return [];
    return tools.filter((t) => {
      const matchCat = activeCategory === "all" || t.category === activeCategory;
      const matchSearch =
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.desc.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [activeCategory, search]);

  const categoryCounts = useMemo(() => {
    return Object.fromEntries(
      categories.map((c) => [
        c.id,
        c.id === "all" ? tools.length : c.id === "builtin" ? builtInToolsList.length : tools.filter((t) => t.category === c.id).length,
      ])
    );
  }, []);

  const hotTools = tools.filter((t) => t.hot);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
        <div className="text-center mb-8 section-enter">
          <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Wrench className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">AI 工具聚合</h1>
          <p className="text-gray-500">发现最好用的 AI 工具，提升你的效率</p>
        </div>

        {/* Built-in Tools Section */}
        {activeCategory === "all" && !search && (
          <div className="mb-8 section-enter section-enter-1">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-4 h-4 text-emerald-500" />
              <h2 className="text-sm font-semibold text-gray-700">内置工具</h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-3 mb-6">
              {builtInToolsList.map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={() => { setActiveBuiltinTool(activeBuiltinTool === tool.id ? null : tool.id); setActiveCategory("builtin"); }}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                      activeBuiltinTool === tool.id
                        ? "bg-blue-50 border-blue-300 shadow-sm"
                        : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm"
                    }`}
                  >
                    <div className={`w-10 h-10 ${tool.color} rounded-lg flex items-center justify-center text-white`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900 text-sm">{tool.name}</div>
                      <div className="text-xs text-gray-500">{tool.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Built-in tool content */}
            {activeBuiltinTool && (
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">
                      {builtInToolsList.find((t) => t.id === activeBuiltinTool)?.name}
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => setActiveBuiltinTool(null)} className="h-7 text-xs">
                      收起
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {activeBuiltinTool === "text-stats" && <TextStatsTool />}
                  {activeBuiltinTool === "text-diff" && <TextDiffTool />}
                  {activeBuiltinTool === "format-converter" && <FormatConverterTool />}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Hot Tools Banner */}
        {activeCategory === "all" && !search && (
          <div className="mb-8 section-enter section-enter-2">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-red-500" />
              <h2 className="text-sm font-semibold text-gray-700">热门推荐</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {hotTools.map((tool) => (
                <a
                  key={tool.name}
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl hover:shadow-md transition-all shrink-0"
                >
                  <span className={`w-8 h-8 flex items-center justify-center rounded-lg text-white shadow-sm ${tool.color}`}>{(() => { const Icon = categoryIconMap[tool.category] || Sparkles; return <Icon className="w-4 h-4" strokeWidth={1.8} />; })()}</span>
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{tool.name}</div>
                    <div className="text-xs text-gray-500">{tool.desc}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="max-w-md mx-auto mb-8 section-enter section-enter-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索工具..."
              className="pl-10 h-11 bg-white border-gray-200"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap justify-center gap-2 mb-8 section-enter section-enter-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const count = categoryCounts[cat.id];
            return (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? "default" : "outline"}
                onClick={() => { setActiveCategory(cat.id); setActiveBuiltinTool(null); }}
                className={`gap-1.5 h-9 ${
                  activeCategory === cat.id
                    ? "bg-gray-900 shadow-sm"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.name}</span>
                <Badge
                  variant="secondary"
                  className={`ml-1 text-xs ${
                    activeCategory === cat.id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {count}
                </Badge>
              </Button>
            );
          })}
        </div>

        {/* Built-in tools view when category is "builtin" */}
        {activeCategory === "builtin" && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-3">
              {builtInToolsList.map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={() => setActiveBuiltinTool(activeBuiltinTool === tool.id ? null : tool.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                      activeBuiltinTool === tool.id
                        ? "bg-blue-50 border-blue-300 shadow-sm"
                        : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm"
                    }`}
                  >
                    <div className={`w-10 h-10 ${tool.color} rounded-lg flex items-center justify-center text-white`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900 text-sm">{tool.name}</div>
                      <div className="text-xs text-gray-500">{tool.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            {activeBuiltinTool && (
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">
                      {builtInToolsList.find((t) => t.id === activeBuiltinTool)?.name}
                    </h3>
                  </div>
                </CardHeader>
                <CardContent>
                  {activeBuiltinTool === "text-stats" && <TextStatsTool />}
                  {activeBuiltinTool === "text-diff" && <TextDiffTool />}
                  {activeBuiltinTool === "format-converter" && <FormatConverterTool />}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Tools Grid */}
        {activeCategory !== "builtin" && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((tool, i) => (
              <a
                key={tool.name}
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-xl card-hover animate-scale-in"
                style={{ animationDelay: `${Math.min(i * 0.03, 0.3)}s` }}
              >
                <div className="absolute top-3 right-3 flex gap-1">
                  {tool.hot && <Badge className="bg-red-500 hover:bg-red-600 text-xs px-1.5 py-0.5">热门</Badge>}
                  {tool.new && <Badge className="bg-green-500 hover:bg-green-600 text-xs px-1.5 py-0.5">新</Badge>}
                </div>
                <div className={`shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-sm group-hover:scale-105 transition-transform duration-200 ${tool.color}`}>
                  {(() => { const Icon = categoryIconMap[tool.category] || Sparkles; return <Icon className="w-5 h-5" strokeWidth={1.8} />; })()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-1">
                    <h3 className="font-semibold text-gray-900 text-sm">{tool.name}</h3>
                    <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{tool.desc}</p>
                </div>
              </a>
            ))}
          </div>
        )}

        {activeCategory !== "builtin" && filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-1">没有找到匹配的工具</p>
            <p className="text-sm text-gray-400">尝试其他关键词或分类</p>
          </div>
        )}

        {/* Stats */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-400">
            共收录 <span className="font-semibold text-gray-600">{tools.length}</span> 个外部 AI 工具 +
            <span className="font-semibold text-gray-600"> {builtInToolsList.length}</span> 个内置工具，
            涵盖 <span className="font-semibold text-gray-600">{categories.length - 2}</span> 个类别
          </p>
        </div>
      </main>
    </div>
  );
}

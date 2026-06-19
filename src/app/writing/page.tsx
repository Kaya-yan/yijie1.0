"use client";

import { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import {
  PenTool, Mail, GraduationCap, FileText, Palette, Briefcase, Sparkles,
  CheckCircle, Loader2, AlertCircle, Save, BookOpen, ArrowRight, RotateCcw,
  Calendar, BookMarked, Mic, FileEdit, PenLine, Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useStore } from "@/lib/store";
import { analyzeWriting, generateWritingTemplate, sceneMap } from "@/lib/api/client";
import { ExportButton } from "@/components/shared";
import { exportWritingAnalysis, exportWritingAnalysisAsWord } from "@/lib/export";
import { FileCode } from "lucide-react";

const sceneIcons: Record<string, typeof Mail> = {
  email: Mail,
  essay: GraduationCap,
  resume: FileText,
  creative: Palette,
  business: Briefcase,
  diary: Calendar,
  book_review: BookMarked,
  movie_review: BookOpen,
  speech: Mic,
  application: FileEdit,
  custom: PenLine,
};

const scenes = Object.entries(sceneMap).map(([id, name]) => ({
  id,
  name,
  icon: sceneIcons[id] || PenTool,
}));

interface DimensionScores {
  grammar: number;
  vocabulary: number;
  logic: number;
  format: number;
}

interface WritingGuide {
  outline: string[];
  template: string;
  usefulSentences: string[];
  tips: string[];
}

const mockSuggestions = [
  "建议将第一段改写得更简洁，突出核心观点",
  "第二句可以使用更正式的表达方式",
  "整体语法检查通过，无明显错误",
  "词汇多样性良好，建议增加一些高级词汇",
];

export default function WritingPage() {
  const { addWriting, writingHistory } = useStore();
  const { isConfigured } = useAuth();
  const [scene, setScene] = useState("email");
  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [analysis, setAnalysis] = useState("");
  const [dimensionScores, setDimensionScores] = useState<DimensionScores | null>(null);
  const [polishedVersion, setPolishedVersion] = useState<string>("");
  const [showPolished, setShowPolished] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Guide state
  const [guide, setGuide] = useState<WritingGuide | null>(null);
  const [guideLoading, setGuideLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (text.length > 20) {
      const timer = setTimeout(async () => {
        setAnalyzing(true);
        setError(null);

        try {
          if (isConfigured) {
            const response = await analyzeWriting(text, scene);
            try {
              const data = JSON.parse(response.result);
              setScore(data.score || 0);
              setSuggestions(data.suggestions || []);
              setAnalysis(data.analysis || "");
              setDimensionScores(data.dimensionScores || null);
              setPolishedVersion(data.polishedVersion || "");
            } catch {
              setScore(Math.min(100, Math.floor(text.length / 5) + 50));
              setSuggestions([response.result]);
              setAnalysis("");
              setDimensionScores(null);
              setPolishedVersion("");
            }
          } else {
            await new Promise((resolve) => setTimeout(resolve, 300));
            setScore(Math.min(100, Math.floor(text.length / 5) + 50));
            setSuggestions(mockSuggestions.slice(0, Math.min(4, Math.floor(text.length / 30) + 1)));
            setAnalysis("");
            setDimensionScores({ grammar: 85, vocabulary: 72, logic: 78, format: 80 });
            setPolishedVersion("");
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "分析失败");
          setScore(Math.min(100, Math.floor(text.length / 5) + 50));
          setSuggestions(mockSuggestions.slice(0, 2));
        } finally {
          setAnalyzing(false);
        }
      }, 800);
      return () => clearTimeout(timer);
    } else {
      setScore(0);
      setSuggestions([]);
      setAnalysis("");
      setDimensionScores(null);
      setPolishedVersion("");
    }
  }, [text, scene, isConfigured]);

  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;

  const handleSave = () => {
    if (text.length > 20 && score > 0) {
      addWriting({
        scene,
        text: text.substring(0, 200),
        score,
        suggestions,
        dimensionScores: dimensionScores || undefined,
        polishedVersion: polishedVersion || undefined,
        wordCount: text.length,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleGenerateGuide = async () => {
    setGuideLoading(true);
    try {
      if (isConfigured) {
        const response = await generateWritingTemplate(scene);
        try {
          const data = JSON.parse(response.result);
          setGuide(data);
        } catch {
          setGuide(null);
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 500));
        setGuide({
          outline: ["开头：引出主题，表明观点", "正文：分论点展开，举例论证", "结尾：总结观点，提出展望"],
          template: `Dear [Recipient],\n\nI am writing to [purpose]...\n\n[Body paragraph 1]\n\n[Body paragraph 2]\n\nI look forward to your reply.\n\nBest regards,\n[Your Name]`,
          usefulSentences: ["I am writing to express my...", "I would appreciate it if...", "Thank you for your consideration."],
          tips: ["注意邮件格式规范", "使用正式的商务用语", "段落之间保持逻辑连贯"],
        });
      }
      setShowGuide(true);
    } catch {
      setGuide(null);
    } finally {
      setGuideLoading(false);
    }
  };

  // Radar chart for dimension scores
  const radarPoints = useMemo(() => {
    if (!dimensionScores) return "";
    const { grammar, vocabulary, logic, format } = dimensionScores;
    const scores = [grammar, vocabulary, logic, format];
    const labels = ["语法", "词汇", "逻辑", "格式"];
    const cx = 80, cy = 80, r = 60;
    const angleStep = (2 * Math.PI) / 4;

    return scores
      .map((s, i) => {
        const angle = angleStep * i - Math.PI / 2;
        const x = cx + (r * s / 100) * Math.cos(angle);
        const y = cy + (r * s / 100) * Math.sin(angle);
        return `${x},${y}`;
      })
      .join(" ");
  }, [dimensionScores]);

  const radarAxes = useMemo(() => {
    const cx = 80, cy = 80, r = 60;
    const labels = ["语法", "词汇", "逻辑", "格式"];
    const angleStep = (2 * Math.PI) / 4;
    return labels.map((label, i) => {
      const angle = angleStep * i - Math.PI / 2;
      const x = cx + (r + 16) * Math.cos(angle);
      const y = cy + (r + 16) * Math.sin(angle);
      const lx = cx + r * Math.cos(angle);
      const ly = cy + r * Math.sin(angle);
      return { label, x, y, lx, ly };
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
        <div className="text-center mb-8 section-enter">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <PenTool className="w-7 h-7 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">AI 写作训练</h1>
          <p className="text-gray-500">
            {isConfigured ? "AI 驱动的写作助手，实时分析与建议" : "选择场景，开始你的写作练习"}
          </p>
        </div>

        {/* Scene selector */}
        <div className="flex flex-wrap justify-center gap-2 mb-6 section-enter section-enter-1">
          {scenes.map((s) => {
            const Icon = s.icon;
            return (
              <Button
                key={s.id}
                variant={scene === s.id ? "default" : "outline"}
                onClick={() => { setScene(s.id); setGuide(null); setShowGuide(false); }}
                className={`gap-2 ${
                  scene === s.id
                    ? "bg-gray-900 shadow-sm"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {s.name}
              </Button>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 section-enter section-enter-2">
          {/* Writing area */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-white border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b bg-gray-50/50 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {scenes.find((s) => s.id === scene)?.name}写作
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">{text.length} 字</Badge>
                  {score > 0 && (
                    <Button variant="ghost" size="sm" onClick={handleSave} className={`h-7 text-xs gap-1 ${saved ? "text-green-600" : ""}`}>
                      {saved ? <CheckCircle className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                      {saved ? "已保存" : "保存"}
                    </Button>
                  )}
                </div>
              </div>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={`开始你的${scenes.find((s) => s.id === scene)?.name}写作...`}
                className="w-full h-[400px] resize-none border-0 p-5 text-base focus-visible:ring-0 shadow-none"
              />
            </Card>

            {/* Polished version comparison */}
            {polishedVersion && showPolished && (
              <Card className="bg-white border-emerald-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b bg-emerald-50/50 flex items-center justify-between">
                  <span className="text-sm font-medium text-emerald-700 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI 润色版本
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => setShowPolished(false)} className="h-7 text-xs">
                    收起
                  </Button>
                </div>
                <CardContent className="p-5">
                  <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">{polishedVersion}</p>
                </CardContent>
              </Card>
            )}

            {/* Writing Guide */}
            {showGuide && guide && (
              <Card className="bg-white border-blue-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b bg-blue-50/50 flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-700 flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5" />
                    写作指南 - {scenes.find((s) => s.id === scene)?.name}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => setShowGuide(false)} className="h-7 text-xs">
                    收起
                  </Button>
                </div>
                <CardContent className="p-5 space-y-4">
                  {guide.outline.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">大纲结构</h4>
                      <ol className="space-y-1.5">
                        {guide.outline.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">{i + 1}</span>
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                  {guide.template && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">模板框架</h4>
                      <pre className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap font-mono">{guide.template}</pre>
                    </div>
                  )}
                  {guide.usefulSentences.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">常用句式</h4>
                      <div className="space-y-1.5">
                        {guide.usefulSentences.map((s, i) => (
                          <div key={i} className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg">
                            <ArrowRight className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span className="text-sm text-emerald-700 font-mono">{s}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {guide.tips.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">写作技巧</h4>
                      <ul className="space-y-1.5">
                        {guide.tips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* AI sidebar */}
          <div className="space-y-4">
            {/* Score */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="pb-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">写作评分</h3>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="36" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                      <circle
                        cx="40" cy="40" r="36" fill="none"
                        stroke={score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : score > 0 ? "#ef4444" : "#e5e7eb"}
                        strokeWidth="6"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dashoffset 0.5s ease" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      {analyzing ? (
                        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                      ) : (
                        <span className="text-2xl font-bold text-gray-900">{score}</span>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-center text-sm text-gray-500 mt-2">
                  {score >= 80 ? "优秀" : score >= 60 ? "良好" : score > 0 ? "继续加油" : "开始写作获取评分"}
                </p>
                {analysis && <p className="text-center text-xs text-gray-400 mt-1">{analysis}</p>}
              </CardContent>
            </Card>

            {/* Dimension Scores Radar */}
            {dimensionScores && (
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader className="pb-2">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">维度评分</h3>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    <svg viewBox="0 0 160 160" className="w-40 h-40">
                      {/* Background rings */}
                      {[0.25, 0.5, 0.75, 1].map((scale) => (
                        <polygon
                          key={scale}
                          points={[0, 1, 2, 3].map((i) => {
                            const angle = (Math.PI / 2) * i - Math.PI / 2;
                            return `${80 + 60 * scale * Math.cos(angle)},${80 + 60 * scale * Math.sin(angle)}`;
                          }).join(" ")}
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="0.5"
                        />
                      ))}
                      {/* Axes */}
                      {radarAxes.map((a, i) => (
                        <line key={i} x1="80" y1="80" x2={a.lx} y2={a.ly} stroke="#e5e7eb" strokeWidth="0.5" />
                      ))}
                      {/* Data polygon */}
                      <polygon
                        points={radarPoints}
                        fill="rgba(16, 185, 129, 0.15)"
                        stroke="#10b981"
                        strokeWidth="1.5"
                      />
                      {/* Data points */}
                      {radarPoints.split(" ").map((p, i) => {
                        const [x, y] = p.split(",");
                        return <circle key={i} cx={x} cy={y} r="3" fill="#10b981" />;
                      })}
                      {/* Labels */}
                      {radarAxes.map((a, i) => (
                        <text key={i} x={a.x} y={a.y} textAnchor="middle" dominantBaseline="middle" className="text-[9px] fill-gray-500">
                          {a.label}
                        </text>
                      ))}
                    </svg>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {Object.entries(dimensionScores).map(([key, val]) => {
                      const labels: Record<string, string> = { grammar: "语法", vocabulary: "词汇", logic: "逻辑", format: "格式" };
                      return (
                        <div key={key} className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">{labels[key]}</span>
                          <span className="font-medium text-gray-700">{val}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Suggestions */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="pb-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI 建议
                </h3>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="flex items-center gap-2 mb-3 text-red-500">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span className="text-xs">{error}</span>
                  </div>
                )}
                {suggestions.length > 0 ? (
                  <div className="space-y-3">
                    {suggestions.map((s, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600">{s}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">
                    {isConfigured ? "开始写作后，AI 将提供实时建议" : "开始写作后，将显示写作建议"}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Action buttons */}
            {score > 0 && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  {polishedVersion && !showPolished && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                      onClick={() => setShowPolished(true)}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      查看润色
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50"
                    onClick={handleGenerateGuide}
                    disabled={guideLoading}
                  >
                    {guideLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BookOpen className="w-3.5 h-3.5" />}
                    写作指南
                  </Button>
                </div>
                <ExportButton
                  options={[
                    { label: "Markdown", format: "md", icon: FileCode, action: () => exportWritingAnalysis(scene, text, score, suggestions, dimensionScores || undefined, polishedVersion || undefined) },
                    { label: "Word 文档", format: "doc", icon: FileText, action: () => exportWritingAnalysisAsWord(scene, text, score, suggestions, dimensionScores || undefined, polishedVersion || undefined) },
                  ]}
                  variant="button"
                  size="sm"
                  label="导出分析报告"
                />
              </div>
            )}

            {/* History */}
            {writingHistory.length > 0 && (
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader className="pb-2">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">历史记录</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {writingHistory.slice(0, 3).map((item) => (
                      <div key={item.id} className="p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="secondary" className="text-xs">
                            {sceneMap[item.scene] || item.scene}
                          </Badge>
                          <span className="text-xs font-medium text-gray-600">{item.score}分</span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {!isConfigured && (
          <div className="mt-8 text-center">
            <Badge variant="secondary" className="bg-amber-50 text-amber-700">
              <AlertCircle className="w-3 h-3 mr-1" />
              未配置 API，使用基础评分
            </Badge>
          </div>
        )}
      </main>
    </div>
  );
}

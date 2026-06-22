"use client";

import { useState, useMemo, useCallback } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import {
  Upload, Globe, FileText, Download,
  Loader2, AlertCircle, ChevronRight, BarChart3, RotateCcw,
} from "lucide-react";
import {
  Bookmark, Lightbulb, BookOpen,
} from "pixelarticons/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useStore } from "@/lib/store";
import { analyzeReading, analyzeSentence } from "@/lib/api/client";
import { ExportButton } from "@/components/shared";
import { exportReadingAnalysis, exportReadingAnalysisAsWord } from "@/lib/export";
import { FileCode } from "lucide-react";

interface VocabItem {
  word: string;
  phonetic: string;
  meaning: string;
  difficulty?: string;
  frequency?: string;
  example?: string;
}

interface ReadingAnalysis {
  translation: string;
  vocabulary: VocabItem[];
  grammar_points: { phrase: string; explanation: string }[];
  summary: string;
  difficulty?: { cefrLevel: string; difficultWords: string[] };
}

interface SentenceAnalysis {
  translation: string;
  structure: string;
  clauses: { type: string; text: string; function: string }[];
  keyPhrases: { phrase: string; meaning: string }[];
  grammarPoints: string[];
}

const sampleText = `The quick brown fox jumps over the lazy dog. This pangram contains every letter of the English alphabet at least once. Pangrams are often used to display font samples and test keyboards.`;

const builtInMaterials = [
  {
    id: "pangram",
    title: "The Pangram",
    content: sampleText,
    level: "beginner" as const,
    cefrLevel: "A2",
    category: "基础知识",
  },
  {
    id: "technology",
    title: "The Digital Age",
    content: "Technology has transformed every aspect of modern life. From artificial intelligence to blockchain, emerging technologies are reshaping industries and creating new opportunities. The rapid pace of innovation demands continuous learning and adaptation. As we navigate this digital transformation, it is crucial to balance technological advancement with ethical considerations.",
    level: "intermediate" as const,
    cefrLevel: "B2",
    category: "科技",
  },
  {
    id: "environment",
    title: "Climate Change",
    content: "Climate change represents one of the most pressing challenges facing humanity today. Rising global temperatures, melting ice caps, and increasingly severe weather events underscore the urgency of collective action. Sustainable development practices, renewable energy adoption, and carbon emission reduction are essential components of any comprehensive solution.",
    level: "advanced" as const,
    cefrLevel: "C1",
    category: "环境",
  },
  {
    id: "literature",
    title: "A Tale of Two Cities",
    content: "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of Light, it was the season of Darkness, it was the spring of hope, it was the winter of despair.",
    level: "advanced" as const,
    cefrLevel: "C1",
    category: "文学",
  },
];

const vocabMap: Record<string, VocabItem> = {
  pangram: { word: "pangram", phonetic: "/ˈpænɡræm/", meaning: "全字母句（包含所有字母的句子）", frequency: "rare", example: "This sentence is a pangram." },
  alphabet: { word: "alphabet", phonetic: "/ˈælfəbet/", meaning: "字母表", frequency: "common", example: "The English alphabet has 26 letters." },
  keyboard: { word: "keyboard", phonetic: "/ˈkiːbɔːrd/", meaning: "键盘", frequency: "common", example: "I type fast on the keyboard." },
  quick: { word: "quick", phonetic: "/kwɪk/", meaning: "快的；迅速的", frequency: "common", example: "She made a quick decision." },
  brown: { word: "brown", phonetic: "/braʊn/", meaning: "棕色的", frequency: "common", example: "The brown dog is cute." },
  jumps: { word: "jumps", phonetic: "/dʒʌmps/", meaning: "跳跃", frequency: "common", example: "The cat jumps over the fence." },
};

const cefrColors: Record<string, string> = {
  A1: "bg-green-50 text-green-700 border-green-200",
  A2: "bg-green-50 text-green-700 border-green-200",
  B1: "bg-blue-50 text-blue-700 border-blue-200",
  B2: "bg-blue-50 text-blue-700 border-blue-200",
  C1: "bg-purple-50 text-purple-700 border-purple-200",
  C2: "bg-purple-50 text-purple-700 border-purple-200",
};

export default function ReadingPage() {
  const { addWord, removeWord, hasWord, updateReadingProgress, getReadingProgress } = useStore();
  const { isConfigured } = useAuth();
  const [article, setArticle] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ReadingAnalysis | null>(null);
  const [currentMaterialId, setCurrentMaterialId] = useState<string | null>(null);

  // Sentence analyzer state
  const [selectedSentence, setSelectedSentence] = useState<string | null>(null);
  const [sentenceAnalysis, setSentenceAnalysis] = useState<SentenceAnalysis | null>(null);
  const [sentenceLoading, setSentenceLoading] = useState(false);

  const handleSubmit = async (text?: string, materialId?: string) => {
    setLoading(true);
    setError(null);

    try {
      const textToAnalyze = text || article.trim() || sampleText;

      if (isConfigured) {
        const response = await analyzeReading(textToAnalyze);
        try {
          const data = JSON.parse(response.result);
          setAnalysis(data);
        } catch {
          setAnalysis(null);
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 500));
        setAnalysis({
          translation: "那只敏捷的棕色狐狸跳过了懒惰的狗。这个全字母句包含了英语字母表中的每一个字母至少一次。全字母句常被用来展示字体样本和测试键盘。",
          vocabulary: [
            { word: "pangram", phonetic: "/ˈpænɡræm/", meaning: "全字母句", difficulty: "B2", frequency: "rare" },
            { word: "alphabet", phonetic: "/ˈælfəbet/", meaning: "字母表", difficulty: "A2", frequency: "common" },
          ],
          grammar_points: [{ phrase: "jumps over", explanation: "动词 + 介词结构，表示'跳过'" }],
          summary: "介绍全字母句的概念和用途",
          difficulty: { cefrLevel: "A2", difficultWords: ["pangram"] },
        });
      }

      if (!text && !article.trim()) {
        setArticle(sampleText);
      }
      setSubmitted(true);
      setCurrentMaterialId(materialId || null);

      // Track reading progress
      const mid = materialId || "custom";
      updateReadingProgress(mid, { progress: 1 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "分析失败");
      if (!article.trim()) setArticle(sampleText);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMaterial = (material: typeof builtInMaterials[0]) => {
    setArticle(material.content);
    handleSubmit(material.content, material.id);
  };

  const handleAnalyzeSentence = useCallback(async (sentence: string) => {
    setSentenceLoading(true);
    setSelectedSentence(sentence);
    try {
      if (isConfigured) {
        const response = await analyzeSentence(sentence);
        try {
          const data = JSON.parse(response.result);
          setSentenceAnalysis(data);
        } catch {
          setSentenceAnalysis(null);
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 400));
        setSentenceAnalysis({
          translation: "句子翻译",
          structure: "主语 + 谓语 + 宾语",
          clauses: [{ type: "主句", text: sentence, function: "陈述事实" }],
          keyPhrases: [],
          grammarPoints: ["简单句"],
        });
      }
    } catch {
      setSentenceAnalysis(null);
    } finally {
      setSentenceLoading(false);
    }
  }, [isConfigured]);

  const words = useMemo(() => (article || sampleText).split(/(\s+)/), [article]);
  const sentences = useMemo(() => (article || sampleText).split(/(?<=[.!?])\s+/).filter(Boolean), [article]);

  const isVocab = (word: string) => {
    const clean = word.toLowerCase().replace(/[^a-z]/g, "");
    const allVocab = analysis?.vocabulary || [];
    return Object.keys(vocabMap).includes(clean) || allVocab.some((v) => v.word === clean);
  };

  const getVocab = (word: string): VocabItem | undefined => {
    const clean = word.toLowerCase().replace(/[^a-z]/g, "");
    const apiVocab = analysis?.vocabulary?.find((v) => v.word === clean);
    if (apiVocab) return apiVocab;
    return vocabMap[clean];
  };

  const toggleSave = (word: string) => {
    const clean = word.toLowerCase().replace(/[^a-z]/g, "");
    if (hasWord(clean)) {
      removeWord(clean);
    } else {
      const vocab = getVocab(word);
      if (vocab) {
        addWord({
          word: vocab.word,
          phonetic: vocab.phonetic,
          meaning: vocab.meaning,
          source: "reading",
          frequency: vocab.frequency as any,
          examples: vocab.example ? [{ en: vocab.example, zh: "" }] : undefined,
        });
      }
    }
  };

  const savedWordsList = analysis?.vocabulary?.map((v) => v.word) || Object.keys(vocabMap);

  const levelColors: Record<string, string> = {
    beginner: "bg-green-50 text-green-700",
    intermediate: "bg-blue-50 text-blue-700",
    advanced: "bg-purple-50 text-purple-700",
  };

  return (
    <div className="min-h-screen pixel-grid" style={{ background: "var(--pixel-bg)" }}>
      <Navbar />
      <main id="main-content" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
        <div className="text-center mb-8 section-enter">
          <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bookmark className="w-7 h-7 text-rose-600" />
          </div>
          <h1 className="font-pixel-title" style={{ color: "var(--pixel-text)" }}>智能阅读</h1>
          <p className="text-pixel-text-light">
            {isConfigured ? "AI 驱动的阅读助手，智能标注与讲解" : "导入文章，获取词汇标注与翻译"}
          </p>
        </div>

        {!submitted ? (
          <div className="max-w-2xl mx-auto space-y-6 section-enter section-enter-1">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex gap-2 mb-4">
                  <Button variant="outline" size="sm" className="gap-2 text-pixel-text-muted" disabled>
                    <Upload className="w-4 h-4" />
                    上传文档（开发中）
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2 text-pixel-text-muted" disabled>
                    <Globe className="w-4 h-4" />
                    输入 URL（开发中）
                  </Button>
                </div>
                <Textarea
                  value={article}
                  onChange={(e) => setArticle(e.target.value)}
                  placeholder="粘贴文章到这里，或选择下方内置文章..."
                  className="w-full h-48 resize-none border-gray-200 focus-visible:ring-blue-500"
                />
                <div className="flex justify-end mt-4">
                  <Button
                    onClick={() => handleSubmit()}
                    disabled={loading}
                    className="bg-gray-900 hover:bg-gray-800 shadow-sm gap-2 btn-press"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                    开始阅读
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Built-in materials */}
            <div className="section-enter section-enter-2">
              <h3 className="text-sm font-semibold text-pixel-text-light mb-3 text-center">内置阅读材料</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {builtInMaterials.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleLoadMaterial(m)}
                    className="text-left p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-medium text-pixel-text text-sm">{m.title}</span>
                      <Badge variant="secondary" className={`text-xs ${levelColors[m.level]}`}>{m.cefrLevel}</Badge>
                    </div>
                    <p className="text-xs text-pixel-text-light line-clamp-2">{m.content.substring(0, 80)}...</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">{m.category}</Badge>
                      <span className="text-xs text-pixel-text-muted">{m.content.split(/\s+/).length} 词</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Reading area */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-pixel-text">文章内容</h2>
                    <div className="flex items-center gap-2">
                      {analysis?.difficulty && (
                        <Badge variant="secondary" className={cefrColors[analysis.difficulty.cefrLevel] || ""}>
                          <BarChart3 className="w-3 h-3 mr-1" />
                          {analysis.difficulty.cefrLevel}
                        </Badge>
                      )}
                      <ExportButton
                        variant="icon"
                        options={[
                          { label: "Markdown", format: "md", icon: FileCode, action: () => exportReadingAnalysis(
                            article.substring(0, 30),
                            article,
                            analysis?.translation || "",
                            analysis?.vocabulary || [],
                            analysis?.grammar_points || [],
                            analysis?.summary || ""
                          ) },
                          { label: "Word 文档", format: "doc", icon: FileText, action: () => exportReadingAnalysisAsWord(
                            article.substring(0, 30),
                            article,
                            analysis?.translation || "",
                            analysis?.vocabulary || [],
                            analysis?.grammar_points || [],
                            analysis?.summary || ""
                          ) },
                        ]}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setSubmitted(false); setAnalysis(null); setSelectedSentence(null); setSentenceAnalysis(null); }}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1" />
                        重新输入
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-6">
                  <div className="text-base leading-relaxed text-pixel-text">
                    {words.map((word, i) => {
                      if (isVocab(word)) {
                        const vocab = getVocab(word);
                        const clean = word.toLowerCase().replace(/[^a-z]/g, "");
                        return (
                          <span key={i} className="relative inline">
                            <span
                              className={`border-b-2 cursor-pointer transition-colors ${
                                selectedWord === word ? "border-blue-600 bg-blue-50" : "border-blue-400 hover:bg-blue-50/50"
                              }`}
                              onClick={() => setSelectedWord(selectedWord === word ? null : word)}
                            >
                              {word}
                            </span>
                            {selectedWord === word && vocab && (
                              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg p-4 z-10">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-semibold text-pixel-text">{vocab.word}</span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={(e) => { e.stopPropagation(); toggleSave(word); }}
                                  >
                                    <Bookmark className={`w-4 h-4 ${hasWord(clean) ? "fill-blue-600 text-blue-600" : "text-pixel-text-muted"}`} />
                                  </Button>
                                </div>
                                <span className="block text-xs text-pixel-text-muted font-mono mb-1">{vocab.phonetic}</span>
                                <span className="block text-sm text-pixel-text-light">{vocab.meaning}</span>
                                {vocab.difficulty && (
                                  <Badge variant="secondary" className={`mt-2 text-xs ${cefrColors[vocab.difficulty] || ""}`}>{vocab.difficulty}</Badge>
                                )}
                              </span>
                            )}
                          </span>
                        );
                      }
                      return <span key={i}>{word}</span>;
                    })}
                  </div>

                  {/* Sentence selector */}
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <h3 className="text-xs font-semibold text-pixel-text-muted uppercase tracking-wider mb-2">点击句子进行深度分析</h3>
                    <div className="space-y-1.5">
                      {sentences.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => handleAnalyzeSentence(s.trim())}
                          className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${
                            selectedSentence === s.trim() ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"
                          }`}
                        >
                          {s.trim()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sentence analysis result */}
                  {selectedSentence && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <h4 className="text-xs font-semibold text-blue-700 mb-2">句子分析</h4>
                      {sentenceLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                          <span className="text-sm text-blue-600">分析中...</span>
                        </div>
                      ) : sentenceAnalysis ? (
                        <div className="space-y-3">
                          <div>
                            <span className="text-xs text-blue-500 font-medium">翻译：</span>
                            <span className="text-sm text-blue-800 ml-1">{sentenceAnalysis.translation}</span>
                          </div>
                          <div>
                            <span className="text-xs text-blue-500 font-medium">结构：</span>
                            <span className="text-sm text-blue-800 ml-1">{sentenceAnalysis.structure}</span>
                          </div>
                          {sentenceAnalysis.clauses.length > 0 && (
                            <div>
                              <span className="text-xs text-blue-500 font-medium">从句分析：</span>
                              <div className="mt-1 space-y-1">
                                {sentenceAnalysis.clauses.map((c, i) => (
                                  <div key={i} className="flex items-center gap-2 text-sm">
                                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">{c.type}</Badge>
                                    <span className="text-blue-800 font-mono">{c.text}</span>
                                    <span className="text-blue-500">— {c.function}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {sentenceAnalysis.grammarPoints.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {sentenceAnalysis.grammarPoints.map((p, i) => (
                                <Badge key={i} variant="outline" className="text-xs">{p}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-blue-600">分析失败</p>
                      )}
                    </div>
                  )}

                  {/* Translation */}
                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <h3 className="text-xs font-semibold text-pixel-text-muted uppercase tracking-wider mb-3">段落翻译</h3>
                    <p className="text-pixel-text-light text-sm leading-relaxed">
                      {analysis?.translation || "那只敏捷的棕色狐狸跳过了懒惰的狗。这个全字母句包含了英语字母表中的每一个字母至少一次。全字母句常被用来展示字体样本和测试键盘。"}
                    </p>
                  </div>

                  {/* Grammar Points */}
                  {analysis?.grammar_points && analysis.grammar_points.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <h3 className="text-xs font-semibold text-pixel-text-muted uppercase tracking-wider mb-3">语法要点</h3>
                      <div className="space-y-3">
                        {analysis.grammar_points.map((point, i) => (
                          <div key={i} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <p className="font-mono text-sm text-blue-700 mb-1">{point.phrase}</p>
                            <p className="text-sm text-blue-600">{point.explanation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Difficulty assessment */}
                  {analysis?.difficulty && (
                    <div className="mt-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                          <BarChart3 className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-indigo-900 mb-1">难度评估</h4>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-indigo-700">CEFR 等级：</span>
                            <Badge variant="secondary" className={cefrColors[analysis.difficulty.cefrLevel] || ""}>
                              {analysis.difficulty.cefrLevel}
                            </Badge>
                          </div>
                          {analysis.difficulty.difficultWords.length > 0 && (
                            <p className="text-xs text-indigo-600">
                              难词：{analysis.difficulty.difficultWords.join("、")}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  {analysis?.summary && (
                    <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                          <Lightbulb className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-amber-900 mb-1">AI 讲解</h4>
                          <p className="text-sm text-amber-700">{analysis.summary}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {!analysis && (
                    <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                          <Lightbulb className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-amber-900 mb-1">AI 讲解</h4>
                          <p className="text-sm text-amber-700">
                            "The quick brown fox jumps over the lazy dog" 是英语中最著名的全字母句（pangram）。它恰好包含26个英文字母各一次，因此常被用于字体展示和键盘测试。
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Vocab list */}
            <div>
              <Card className="bg-white border-gray-200 shadow-sm sticky top-20">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-pixel-text-muted uppercase tracking-wider">词汇表</h3>
                    {savedWordsList.some((w) => hasWord(w)) && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600 hover:text-blue-700 gap-1">
                        <Download className="w-3 h-3" />
                        导出
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {savedWordsList.map((w) => {
                      const vocab = getVocab(w);
                      if (!vocab) return null;
                      const saved = hasWord(w);
                      return (
                        <div
                          key={w}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            saved ? "bg-blue-50 border border-blue-200" : "bg-gray-50 hover:bg-gray-100"
                          }`}
                          onClick={() => toggleSave(w)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-pixel-text text-sm">{vocab.word}</span>
                            <Bookmark className={`w-3.5 h-3.5 ${saved ? "fill-blue-600 text-blue-600" : "text-pixel-text-muted"}`} />
                          </div>
                          <span className="text-xs text-pixel-text-muted font-mono">{vocab.phonetic}</span>
                          <span className="block text-xs text-pixel-text-light mt-0.5">{vocab.meaning}</span>
                          {vocab.difficulty && (
                            <Badge variant="secondary" className={`mt-1 text-xs ${cefrColors[vocab.difficulty] || ""}`}>{vocab.difficulty}</Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center gap-2 mt-4 text-red-500">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {!isConfigured && !submitted && (
          <div className="mt-8 text-center">
            <Badge variant="secondary" className="bg-amber-50 text-amber-700">
              <AlertCircle className="w-3 h-3 mr-1" />
              未配置 API，使用本地示例
            </Badge>
          </div>
        )}
      </main>
    </div>
  );
}

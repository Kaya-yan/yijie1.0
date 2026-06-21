"use client";

import { useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import {
  Search, Lightbulb, AlertTriangle, CheckCircle, Info, Loader2, AlertCircle,
  BookX, Target, Trash2, ChevronRight, RotateCcw, Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useStore, GrammarMistake } from "@/lib/store";
import { analyzeGrammar, generateGrammarPractice } from "@/lib/api/client";
import { useAuth } from "@/hooks/useAuth";
import { ApiNotConfiguredBadge, ExportButton } from "@/components/shared";
import { exportGrammarMistakes } from "@/lib/export";
import { FileCode, FileText } from "lucide-react";

interface AnalysisItem {
  type: "knowledge" | "suggestion" | "error";
  highlight: string;
  message: string;
  explanation: string;
}

interface PracticeQuestion {
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
}

const mockAnalysis: Record<string, AnalysisItem[]> = {
  "the quick brown fox jumps over the lazy dog": [
    { type: "knowledge", highlight: "the quick brown fox", message: "主语为第三人称单数", explanation: "当主语是第三人称单数（he/she/it/名词单数）时，谓语动词要加 -s 或 -es。" },
    { type: "knowledge", highlight: "jumps", message: "动词第三人称单数形式", explanation: "jump 的第三人称单数形式为 jumps，表示习惯性动作。" },
    { type: "suggestion", highlight: "over", message: "介词使用正确", explanation: "over 表示从上方越过，符合语境。" },
  ],
  "he go to school": [
    { type: "error", highlight: "go", message: "动词形式错误", explanation: "主语 he 为第三人称单数，动词应使用 goes 而非 go。" },
    { type: "suggestion", highlight: "to school", message: "缺少冠词", explanation: "建议改为 'to the school' 或 'to school'（英式习惯）。" },
  ],
};

type TabId = "analysis" | "mistakes" | "practice";

const tabs: { id: TabId; label: string; icon: typeof Lightbulb }[] = [
  { id: "analysis", label: "句子分析", icon: Search },
  { id: "mistakes", label: "错题本", icon: BookX },
  { id: "practice", label: "语法练习", icon: Target },
];

export default function GrammarPage() {
  const { grammarMistakes, addGrammarMistake, removeGrammarMistake, markMistakeMastered, getUnmasteredMistakes, addGrammarPractice, grammarPracticeHistory } = useStore();
  const { isConfigured } = useAuth();

  const [activeTab, setActiveTab] = useState<TabId>("analysis");
  const [sentence, setSentence] = useState("");
  const [results, setResults] = useState<AnalysisItem[]>([]);
  const [analyzed, setAnalyzed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Practice state
  const [practiceQuestions, setPracticeQuestions] = useState<PracticeQuestion[]>([]);
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [practiceType, setPracticeType] = useState<"fill-blank" | "multiple-choice">("multiple-choice");
  const [currentQ, setCurrentQ] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [practiceScore, setPracticeScore] = useState({ correct: 0, total: 0 });

  const handleAnalyze = async () => {
    if (!sentence.trim()) return;
    setLoading(true);
    setAnalyzed(true);
    setError(null);
    setResults([]);

    try {
      if (isConfigured) {
        const response = await analyzeGrammar(sentence.trim());
        try {
          const data = JSON.parse(response.result);
          setResults(data.items || []);
        } catch {
          setResults([{ type: "knowledge", highlight: sentence, message: "AI 分析结果", explanation: response.result }]);
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 600));
        const key = sentence.toLowerCase().trim();
        setResults(mockAnalysis[key] || [{ type: "knowledge", highlight: sentence, message: "句子结构分析", explanation: "这是一个完整的英文句子，主谓宾结构清晰。" }]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "分析失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const saveMistake = (item: AnalysisItem) => {
    addGrammarMistake({
      sentence: sentence.trim(),
      errorType: item.message,
      errorHighlight: item.highlight,
      correctForm: "",
      explanation: item.explanation,
      source: "grammar",
    });
  };

  const handleGeneratePractice = useCallback(async () => {
    setPracticeLoading(true);
    setError(null);
    try {
      const unmastered = getUnmasteredMistakes();
      const mistakeData = unmastered.map((m) => ({
        errorType: m.errorType,
        sentence: m.sentence,
        correctForm: m.correctForm,
      }));

      if (isConfigured) {
        const response = await generateGrammarPractice(mistakeData, practiceType, 5);
        try {
          const data = JSON.parse(response.result);
          setPracticeQuestions(data.questions || []);
        } catch {
          setPracticeQuestions([]);
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 500));
        setPracticeQuestions([
          {
            question: "He ___ to school every day.",
            options: ["A. go", "B. goes", "C. going", "D. gone"],
            answer: "B",
            explanation: "主语 He 是第三人称单数，谓语动词要加 -s。",
          },
          {
            question: "She ___ a beautiful song yesterday.",
            options: ["A. sing", "B. sings", "C. sang", "D. sung"],
            answer: "C",
            explanation: "yesterday 表示过去时，sing 的过去式是 sang。",
          },
          {
            question: "They ___ been waiting for two hours.",
            options: ["A. has", "B. have", "C. is", "D. was"],
            answer: "B",
            explanation: "主语 They 是复数，用 have。现在完成进行时：have been doing。",
          },
        ]);
      }
      setCurrentQ(0);
      setUserAnswer("");
      setShowAnswer(false);
      setPracticeScore({ correct: 0, total: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成练习失败");
    } finally {
      setPracticeLoading(false);
    }
  }, [practiceType, isConfigured, getUnmasteredMistakes]);

  const handleAnswer = () => {
    if (!userAnswer.trim()) return;
    const q = practiceQuestions[currentQ];
    const isCorrect = userAnswer.trim().toUpperCase() === q.answer.toUpperCase();
    setPracticeScore((s) => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));
    addGrammarPractice({
      type: practiceType,
      question: q.question,
      options: q.options,
      answer: q.answer,
      userAnswer: userAnswer.trim(),
      correct: isCorrect,
    });
    setShowAnswer(true);
  };

  const nextQuestion = () => {
    if (currentQ < practiceQuestions.length - 1) {
      setCurrentQ((c) => c + 1);
      setUserAnswer("");
      setShowAnswer(false);
    }
  };

  const typeConfig = {
    knowledge: { icon: Lightbulb, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", label: "知识点" },
    suggestion: { icon: Info, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", label: "建议" },
    error: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200", label: "错误" },
  };

  return (
    <div className="min-h-screen pixel-grid" style={{ background: "var(--pixel-bg)" }}>
      <Navbar />
      <main id="main-content" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
        <div className="text-center mb-8 section-enter">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lightbulb className="w-7 h-7 text-amber-600" />
          </div>
          <h1 className="font-pixel-title" style={{ color: "var(--pixel-text)" }}>AI 语法知识点</h1>
          <p className="text-pixel-text-light">
            {isConfigured ? "AI 驱动的语法分析，深度讲解语法要点" : "输入句子，分析语法结构并提供讲解"}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit mx-auto section-enter section-enter-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-white text-pixel-text shadow-sm"
                    : "text-pixel-text-light hover:text-pixel-text"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.id === "mistakes" && grammarMistakes.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{grammarMistakes.length}</Badge>
                )}
              </button>
            );
          })}
        </div>

        {/* Analysis Tab */}
        {activeTab === "analysis" && (
          <>
            <Card className="bg-white border-gray-200 shadow-sm mb-6 section-enter section-enter-2">
              <CardContent className="p-6">
                <Textarea
                  value={sentence}
                  onChange={(e) => setSentence(e.target.value)}
                  placeholder="输入英文句子，例如：The quick brown fox jumps over the lazy dog"
                  className="w-full h-32 resize-none border-gray-200 focus-visible:ring-blue-500"
                />
                <div className="flex items-center justify-between mt-4">
                  <div className="flex gap-2">
                    {Object.keys(mockAnalysis).map((s) => (
                      <Badge
                        key={s}
                        variant="outline"
                        className="cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors text-xs"
                        onClick={() => setSentence(s)}
                      >
                        {s.substring(0, 20)}...
                      </Badge>
                    ))}
                  </div>
                  <Button
                    onClick={handleAnalyze}
                    disabled={!sentence.trim() || loading}
                    className="bg-gray-900 hover:bg-gray-800 shadow-sm gap-2 btn-press"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    分析句子
                  </Button>
                </div>
              </CardContent>
            </Card>

            {loading && (
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                  <span className="text-sm text-pixel-text-light">AI 分析中...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center gap-2 py-8 text-red-500">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {analyzed && !loading && !error && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-pixel-text">分析结果</h2>
                  <Badge variant="secondary">{results.length} 项发现</Badge>
                </div>
                {results.map((item, i) => {
                  const config = typeConfig[item.type];
                  const Icon = config.icon;
                  return (
                    <Card key={i} className={`${config.border} border overflow-hidden`}>
                      <div className={`${config.bg} px-5 py-3 flex items-center justify-between`}>
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${config.color}`} />
                          <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
                        </div>
                        {item.type === "error" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs gap-1 text-red-600 hover:text-red-700 hover:bg-red-100"
                            onClick={() => saveMistake(item)}
                          >
                            <Save className="w-3 h-3" />
                            保存到错题本
                          </Button>
                        )}
                      </div>
                      <CardContent className="pt-4">
                        <div className="mb-3">
                          <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-mono">{item.highlight}</Badge>
                        </div>
                        <p className="font-medium text-pixel-text mb-2">{item.message}</p>
                        <p className="text-sm text-pixel-text-light">{item.explanation}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {analyzed && !loading && !error && results.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-pixel-text font-medium mb-1">句子语法正确</p>
                <p className="text-sm text-pixel-text-light">暂无发现错误</p>
              </div>
            )}
          </>
        )}

        {/* Mistakes Tab */}
        {activeTab === "mistakes" && (
          <div className="space-y-4">
            {grammarMistakes.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookX className="w-6 h-6 text-pixel-text-muted" />
                </div>
                <p className="text-pixel-text font-medium mb-1">错题本为空</p>
                <p className="text-sm text-pixel-text-light">在句子分析中发现错误时，点击"保存到错题本"</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-pixel-text">错题记录</h2>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{grammarMistakes.length} 条</Badge>
                    <Badge variant="secondary" className="bg-green-50 text-green-700">
                      已掌握 {grammarMistakes.filter((m) => m.mastered).length}
                    </Badge>
                    <ExportButton
                      variant="button"
                      size="sm"
                      label="导出"
                      options={[
                        { label: "Markdown", format: "md", icon: FileCode, action: () => exportGrammarMistakes(grammarMistakes.map((m) => ({ sentence: m.sentence, errorType: m.errorType, errorHighlight: m.errorHighlight, explanation: m.explanation, mastered: m.mastered }))) },
                      ]}
                    />
                  </div>
                </div>
                {grammarMistakes.map((mistake) => (
                  <Card key={mistake.id} className={`bg-white border-gray-200 shadow-sm ${mistake.mastered ? "opacity-60" : ""}`}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="bg-red-50 text-red-700 text-xs">{mistake.errorType}</Badge>
                            {mistake.mastered && (
                              <Badge variant="secondary" className="bg-green-50 text-green-700 text-xs">已掌握</Badge>
                            )}
                          </div>
                          <p className="text-pixel-text font-mono text-sm mb-2">{mistake.sentence}</p>
                          {mistake.errorHighlight && (
                            <Badge variant="outline" className="font-mono text-xs mb-2">{mistake.errorHighlight}</Badge>
                          )}
                          <p className="text-sm text-pixel-text-light">{mistake.explanation}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-pixel-text-muted hover:text-green-600"
                            onClick={() => markMistakeMastered(mistake.id, !mistake.mastered)}
                            title={mistake.mastered ? "标记为未掌握" : "标记为已掌握"}
                          >
                            <CheckCircle className={`w-4 h-4 ${mistake.mastered ? "text-green-500 fill-current" : ""}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-pixel-text-muted hover:text-red-600"
                            onClick={() => removeGrammarMistake(mistake.id)}
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>
        )}

        {/* Practice Tab */}
        {activeTab === "practice" && (
          <div className="space-y-4">
            {practiceQuestions.length === 0 ? (
              <>
                <Card className="bg-white border-gray-200 shadow-sm">
                  <CardHeader>
                    <h3 className="text-lg font-semibold text-pixel-text">语法练习</h3>
                    <p className="text-sm text-pixel-text-light">
                      {getUnmasteredMistakes().length > 0
                        ? `基于你的 ${getUnmasteredMistakes().length} 条错题生成针对性练习`
                        : "生成通用语法练习题，巩固语法知识"}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Button
                        variant={practiceType === "multiple-choice" ? "default" : "outline"}
                        onClick={() => setPracticeType("multiple-choice")}
                        className={practiceType === "multiple-choice" ? "bg-gray-900" : ""}
                      >
                        选择题
                      </Button>
                      <Button
                        variant={practiceType === "fill-blank" ? "default" : "outline"}
                        onClick={() => setPracticeType("fill-blank")}
                        className={practiceType === "fill-blank" ? "bg-gray-900" : ""}
                      >
                        填空题
                      </Button>
                    </div>
                    <Button
                      onClick={handleGeneratePractice}
                      disabled={practiceLoading}
                      className="w-full bg-gray-900 hover:bg-gray-800 shadow-sm gap-2 btn-press"
                    >
                      {practiceLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
                      生成练习题
                    </Button>
                  </CardContent>
                </Card>

                {grammarPracticeHistory.length > 0 && (
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardHeader>
                      <h3 className="text-sm font-semibold text-pixel-text">最近练习记录</h3>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {grammarPracticeHistory.slice(0, 5).map((record) => (
                          <div key={record.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                            {record.correct ? (
                              <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                            )}
                            <p className="text-sm text-pixel-text line-clamp-1 flex-1">{record.question}</p>
                            <Badge variant="secondary" className="text-xs shrink-0">
                              {record.type === "fill-blank" ? "填空" : "选择"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => setPracticeQuestions([])} className="gap-1">
                      <RotateCcw className="w-3.5 h-3.5" />
                      返回
                    </Button>
                    <h2 className="text-lg font-semibold text-pixel-text">
                      第 {currentQ + 1} / {practiceQuestions.length} 题
                    </h2>
                  </div>
                  <Badge variant="secondary">
                    正确 {practiceScore.correct} / {practiceScore.total}
                  </Badge>
                </div>

                <Card className="bg-white border-gray-200 shadow-sm">
                  <CardContent className="p-6">
                    <p className="text-lg text-pixel-text mb-6 font-medium">
                      {practiceQuestions[currentQ].question}
                    </p>

                    {practiceQuestions[currentQ].options && (
                      <div className="space-y-2 mb-6">
                        {practiceQuestions[currentQ].options!.map((opt) => (
                          <button
                            key={opt}
                            onClick={() => !showAnswer && setUserAnswer(opt.charAt(0))}
                            disabled={showAnswer}
                            className={`w-full text-left p-3 rounded-lg border text-sm transition-colors ${
                              showAnswer && opt.charAt(0).toUpperCase() === practiceQuestions[currentQ].answer.toUpperCase()
                                ? "bg-green-50 border-green-300 text-green-700"
                                : showAnswer && userAnswer.toUpperCase() === opt.charAt(0).toUpperCase() && !opt.toUpperCase().startsWith(practiceQuestions[currentQ].answer.toUpperCase())
                                ? "bg-red-50 border-red-300 text-red-700"
                                : userAnswer.toUpperCase() === opt.charAt(0).toUpperCase()
                                ? "bg-blue-50 border-blue-300"
                                : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}

                    {!practiceQuestions[currentQ].options && !showAnswer && (
                      <div className="mb-6">
                        <Textarea
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          placeholder="输入你的答案..."
                          className="w-full h-20 resize-none border-gray-200"
                        />
                      </div>
                    )}

                    {showAnswer && (
                      <div className={`p-4 rounded-lg mb-6 ${
                        userAnswer.trim().toUpperCase() === practiceQuestions[currentQ].answer.toUpperCase()
                          ? "bg-green-50 border border-green-200"
                          : "bg-red-50 border border-red-200"
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          {userAnswer.trim().toUpperCase() === practiceQuestions[currentQ].answer.toUpperCase() ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-600" />
                          )}
                          <span className="font-medium text-sm">
                            {userAnswer.trim().toUpperCase() === practiceQuestions[currentQ].answer.toUpperCase() ? "回答正确!" : `正确答案: ${practiceQuestions[currentQ].answer}`}
                          </span>
                        </div>
                        <p className="text-sm text-pixel-text-light">{practiceQuestions[currentQ].explanation}</p>
                      </div>
                    )}

                    <div className="flex justify-end gap-2">
                      {!showAnswer ? (
                        <Button
                          onClick={handleAnswer}
                          disabled={!userAnswer.trim()}
                          className="bg-gray-900 hover:bg-gray-800 gap-2 btn-press"
                        >
                          提交答案
                        </Button>
                      ) : (
                        <>
                          {currentQ < practiceQuestions.length - 1 ? (
                            <Button onClick={nextQuestion} className="gap-1">
                              下一题 <ChevronRight className="w-4 h-4" />
                            </Button>
                          ) : (
                            <div className="text-center w-full">
                              <Separator className="mb-4" />
                              <p className="text-lg font-semibold text-pixel-text mb-2">练习完成!</p>
                              <p className="text-pixel-text-light mb-4">
                                正确率: {practiceScore.correct}/{practiceScore.total} ({Math.round((practiceScore.correct / practiceScore.total) * 100)}%)
                              </p>
                              <Button onClick={handleGeneratePractice} className="gap-2">
                                <RotateCcw className="w-4 h-4" />
                                再来一组
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

        {!isConfigured && <ApiNotConfiguredBadge message="未配置 API，使用本地示例" />}
      </main>
    </div>
  );
}

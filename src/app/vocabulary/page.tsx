"use client";

import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader, ExportButton } from "@/components/shared";
import { exportVocabulary, exportVocabularyAsWord } from "@/lib/export";
import { FileText, FileCode } from "lucide-react";
import {
  BookText, Search, Filter, Plus, Trash2, CheckCircle, Circle,
  RotateCcw, Volume2, ChevronDown, X, Edit3, Shuffle, Target,
  TrendingUp, Bookmark, AlertCircle, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore, SavedWord, LearningStatus, WordGroup } from "@/lib/store";

const statusConfig: Record<LearningStatus, { label: string; color: string; bg: string }> = {
  new: { label: "生词", color: "text-red-600", bg: "bg-red-50" },
  fuzzy: { label: "模糊", color: "text-amber-600", bg: "bg-amber-50" },
  mastered: { label: "掌握", color: "text-green-600", bg: "bg-green-50" },
};

const groupColors = ["bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-amber-500", "bg-rose-500", "bg-teal-500"];

const sourceLabels: Record<string, string> = {
  translation: "翻译", dictionary: "词典", reading: "阅读",
  grammar: "语法", writing: "写作", manual: "手动",
};

export default function VocabularyPage() {
  useAuth();
  const {
    savedWords, removeWord, updateWordStatus, recordReview,
    wordGroups, addWordGroup, removeWordGroup, moveWordToGroup,
    spellingTestHistory, addSpellingTest,
  } = useStore();

  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LearningStatus | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"time" | "alpha" | "status">("time");
  const [expandedWord, setExpandedWord] = useState<string | null>(null);

  // Group management
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupColor, setNewGroupColor] = useState(groupColors[0]);

  // Review
  const [reviewIndex, setReviewIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  // Spelling test
  const [testWords, setTestWords] = useState<SavedWord[]>([]);
  const [testIndex, setTestIndex] = useState(0);
  const [testAnswer, setTestAnswer] = useState("");
  const [testResults, setTestResults] = useState<{ word: string; correct: boolean; userAnswer: string }[]>([]);
  const [testActive, setTestActive] = useState(false);
  const [testDone, setTestDone] = useState(false);

  // Stats
  const stats = useMemo(() => ({
    total: savedWords.length,
    new: savedWords.filter((w) => w.status === "new").length,
    fuzzy: savedWords.filter((w) => w.status === "fuzzy").length,
    mastered: savedWords.filter((w) => w.status === "mastered").length,
    forReview: savedWords.filter((w) => w.nextReviewAt && w.nextReviewAt <= Date.now()).length,
  }), [savedWords]);

  // Filtered & sorted words
  const filteredWords = useMemo(() => {
    let result = [...savedWords];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((w) => w.word.toLowerCase().includes(q) || w.meaning.toLowerCase().includes(q));
    }
    if (statusFilter !== "all") result = result.filter((w) => w.status === statusFilter);
    if (sourceFilter !== "all") result = result.filter((w) => w.source === sourceFilter);
    if (groupFilter !== "all") {
      result = groupFilter === "none" ? result.filter((w) => !w.groupId) : result.filter((w) => w.groupId === groupFilter);
    }
    if (sortBy === "alpha") result.sort((a, b) => a.word.localeCompare(b.word));
    else if (sortBy === "status") {
      const order = { new: 0, fuzzy: 1, mastered: 2 };
      result.sort((a, b) => order[a.status] - order[b.status]);
    } else result.sort((a, b) => b.addedAt - a.addedAt);
    return result;
  }, [savedWords, search, statusFilter, sourceFilter, groupFilter, sortBy]);

  // Review words
  const reviewWords = useMemo(() => savedWords.filter((w) => w.nextReviewAt && w.nextReviewAt <= Date.now()), [savedWords]);

  const speak = (text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      window.speechSynthesis.speak(u);
    }
  };

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    addWordGroup({ name: newGroupName.trim(), color: newGroupColor });
    setNewGroupName("");
    setShowGroupForm(false);
  };

  const startTest = (words: SavedWord[], count: number) => {
    const shuffled = [...words].sort(() => Math.random() - 0.5).slice(0, count);
    setTestWords(shuffled);
    setTestIndex(0);
    setTestResults([]);
    setTestAnswer("");
    setTestActive(true);
    setTestDone(false);
  };

  const submitTestAnswer = () => {
    const current = testWords[testIndex];
    const correct = testAnswer.trim().toLowerCase() === current.word.toLowerCase();
    const newResults = [...testResults, { word: current.word, correct, userAnswer: testAnswer.trim() }];
    setTestResults(newResults);
    recordReview(current.word, correct);
    setTestAnswer("");
    if (testIndex + 1 < testWords.length) {
      setTestIndex(testIndex + 1);
    } else {
      setTestActive(false);
      setTestDone(true);
      addSpellingTest({
        totalWords: testWords.length,
        correctWords: newResults.filter((r) => r.correct).length,
        words: newResults,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
        <PageHeader icon={BookText} title="生词本" subtitle="管理你的词汇，科学复习" color="blue" />

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8 section-enter section-enter-1">
          {[
            { label: "总词数", value: stats.total, icon: BookText, color: "text-gray-700", bg: "bg-white" },
            { label: "生词", value: stats.new, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
            { label: "模糊", value: stats.fuzzy, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "已掌握", value: stats.mastered, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
            { label: "待复习", value: stats.forReview, icon: RotateCcw, color: "text-blue-600", bg: "bg-blue-50" },
          ].map((s) => (
            <Card key={s.label} className={`${s.bg} border-gray-200 shadow-sm`}>
              <CardContent className="flex items-center gap-2 px-3 py-2.5">
                <s.icon className={`w-4 h-4 ${s.color}`} />
                <span className="text-xs text-gray-500">{s.label}:</span>
                <span className={`font-bold text-sm ${s.color}`}>{s.value}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={tab} onValueChange={setTab} className="section-enter section-enter-2">
          <TabsList className="bg-white border border-gray-200 shadow-sm mb-6">
            <TabsTrigger value="all" className="gap-1.5">全部词汇</TabsTrigger>
            <TabsTrigger value="groups" className="gap-1.5">分组</TabsTrigger>
            <TabsTrigger value="review" className="gap-1.5">复习 {stats.forReview > 0 && <Badge className="ml-1 bg-blue-500 text-xs px-1.5 py-0">{stats.forReview}</Badge>}</TabsTrigger>
            <TabsTrigger value="test" className="gap-1.5">拼写测试</TabsTrigger>
          </TabsList>

          {/* ===== All Words Tab ===== */}
          <TabsContent value="all">
            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
              <ExportButton
                options={[
                  { label: "Markdown", format: "md", icon: FileCode, action: () => exportVocabulary(filteredWords.map((w) => ({ word: w.word, phonetic: w.phonetic, meaning: w.meaning, pos: w.pos, frequency: w.frequency, status: w.status }))) },
                  { label: "Word 文档", format: "doc", icon: FileText, action: () => exportVocabularyAsWord(filteredWords.map((w) => ({ word: w.word, phonetic: w.phonetic, meaning: w.meaning, pos: w.pos, frequency: w.frequency, status: w.status }))) },
                ]}
                label={`导出 (${filteredWords.length})`}
              />
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索单词或释义..." className="pl-10 h-9 bg-white border-gray-200" />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="h-9 px-3 bg-white border border-gray-200 rounded-md text-sm">
                <option value="all">全部状态</option>
                <option value="new">生词</option>
                <option value="fuzzy">模糊</option>
                <option value="mastered">已掌握</option>
              </select>
              <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="h-9 px-3 bg-white border border-gray-200 rounded-md text-sm">
                <option value="all">全部来源</option>
                {Object.entries(sourceLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="h-9 px-3 bg-white border border-gray-200 rounded-md text-sm">
                <option value="time">按时间</option>
                <option value="alpha">按字母</option>
                <option value="status">按状态</option>
              </select>
            </div>

            {/* Word list */}
            {filteredWords.length === 0 ? (
              <div className="text-center py-16">
                <BookText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">还没有收藏的单词</p>
                <p className="text-sm text-gray-400 mt-1">在翻译、词典、阅读等页面中添加生词</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredWords.map((w) => {
                  const expanded = expandedWord === w.word;
                  const st = statusConfig[w.status];
                  return (
                    <Card key={w.word} className="bg-white border-gray-200 shadow-sm overflow-hidden">
                      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50/50 transition-colors" onClick={() => setExpandedWord(expanded ? null : w.word)}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{w.word}</span>
                            {w.phonetic && <span className="text-xs text-gray-400 font-mono">{w.phonetic}</span>}
                            {w.pos && <Badge variant="secondary" className="text-xs px-1.5 py-0">{w.pos}</Badge>}
                            <Badge variant="secondary" className={`text-xs px-1.5 py-0 ${st.bg} ${st.color}`}>{st.label}</Badge>
                            <Badge variant="secondary" className="text-xs px-1.5 py-0 bg-gray-100 text-gray-500">{sourceLabels[w.source]}</Badge>
                            {w.frequency && <Badge variant="secondary" className="text-xs px-1.5 py-0">{w.frequency}</Badge>}
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5 truncate">{w.meaning}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-blue-600" onClick={(e) => { e.stopPropagation(); speak(w.word); }}>
                            <Volume2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-500" onClick={(e) => { e.stopPropagation(); removeWord(w.word); }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
                        </div>
                      </div>
                      {expanded && (
                        <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-3 animate-slide-up">
                          {w.etymology && (
                            <div>
                              <span className="text-xs font-semibold text-gray-400 uppercase">词根词源</span>
                              <p className="text-sm text-gray-600 mt-1">{w.etymology}</p>
                            </div>
                          )}
                          {w.collocations && w.collocations.length > 0 && (
                            <div>
                              <span className="text-xs font-semibold text-gray-400 uppercase">常用搭配</span>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {w.collocations.map((c) => <Badge key={c} variant="outline" className="text-xs">{c}</Badge>)}
                              </div>
                            </div>
                          )}
                          {w.inflections && Object.keys(w.inflections).length > 0 && (
                            <div>
                              <span className="text-xs font-semibold text-gray-400 uppercase">词形变化</span>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {Object.entries(w.inflections).filter(([, v]) => v).map(([k, v]) => (
                                  <span key={k} className="text-xs text-gray-600"><span className="text-gray-400">{k}:</span> {v}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {w.examples && w.examples.length > 0 && (
                            <div>
                              <span className="text-xs font-semibold text-gray-400 uppercase">例句</span>
                              {w.examples.map((ex, i) => (
                                <div key={i} className="mt-1 text-sm">
                                  <p className="text-gray-700">{ex.en}</p>
                                  <p className="text-gray-400">{ex.zh}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          {w.synonyms && w.synonyms.length > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">近义词:</span>
                              {w.synonyms.map((s) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                            </div>
                          )}
                          {/* Status actions */}
                          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                            <span className="text-xs text-gray-400 mr-2">标记为:</span>
                            {(Object.entries(statusConfig) as [LearningStatus, typeof statusConfig[LearningStatus]][]).map(([key, cfg]) => (
                              <Button key={key} variant={w.status === key ? "default" : "outline"} size="sm" className={`h-7 text-xs ${w.status === key ? "" : "bg-white"}`}
                                onClick={() => updateWordStatus(w.word, key)}>
                                {cfg.label}
                              </Button>
                            ))}
                            {/* Move to group */}
                            <select className="ml-auto h-7 px-2 bg-white border border-gray-200 rounded text-xs" value={w.groupId || ""} onChange={(e) => moveWordToGroup(w.word, e.target.value || undefined)}>
                              <option value="">未分组</option>
                              {wordGroups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                            </select>
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ===== Groups Tab ===== */}
          <TabsContent value="groups">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">词汇分组</h2>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowGroupForm(true)}>
                <Plus className="w-3.5 h-3.5" /> 新建分组
              </Button>
            </div>

            {showGroupForm && (
              <Card className="bg-white border-blue-200 shadow-sm mb-4">
                <CardContent className="p-4 flex items-center gap-3">
                  <Input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="分组名称" className="h-9 flex-1" />
                  <div className="flex gap-1">
                    {groupColors.map((c) => (
                      <button key={c} className={`w-6 h-6 rounded-full ${c} ${newGroupColor === c ? "ring-2 ring-offset-2 ring-blue-500" : ""}`} onClick={() => setNewGroupColor(c)} />
                    ))}
                  </div>
                  <Button size="sm" onClick={handleAddGroup} disabled={!newGroupName.trim()}>创建</Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowGroupForm(false)}>取消</Button>
                </CardContent>
              </Card>
            )}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Ungrouped */}
              <Card className="bg-white border-gray-200 shadow-sm card-hover cursor-pointer" onClick={() => { setGroupFilter("none"); setTab("all"); }}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Bookmark className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">未分组</h3>
                      <p className="text-xs text-gray-500">{savedWords.filter((w) => !w.groupId).length} 个单词</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {wordGroups.map((g) => {
                const count = savedWords.filter((w) => w.groupId === g.id).length;
                return (
                  <Card key={g.id} className="bg-white border-gray-200 shadow-sm card-hover cursor-pointer" onClick={() => { setGroupFilter(g.id); setTab("all"); }}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${g.color} rounded-lg flex items-center justify-center`}>
                          <BookText className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{g.name}</h3>
                          <p className="text-xs text-gray-500">{count} 个单词</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-500" onClick={(e) => { e.stopPropagation(); removeWordGroup(g.id); }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* ===== Review Tab ===== */}
          <TabsContent value="review">
            {reviewWords.length === 0 ? (
              <div className="text-center py-16">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <p className="text-gray-700 font-medium">暂无待复习的单词</p>
                <p className="text-sm text-gray-400 mt-1">所有单词都已按时复习，继续保持！</p>
              </div>
            ) : (
              <div className="max-w-lg mx-auto">
                <div className="text-center mb-4">
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                    {reviewIndex + 1} / {reviewWords.length}
                  </Badge>
                </div>
                <Card className="bg-white border-gray-200 shadow-lg">
                  <CardContent className="p-8 text-center">
                    <div className="mb-6">
                      <p className="text-3xl font-bold text-gray-900 mb-2">{reviewWords[reviewIndex].word}</p>
                      {reviewWords[reviewIndex].phonetic && <p className="text-gray-400 font-mono">{reviewWords[reviewIndex].phonetic}</p>}
                      <Button variant="ghost" size="icon" className="mt-2 text-gray-400 hover:text-blue-600" onClick={() => speak(reviewWords[reviewIndex].word)}>
                        <Volume2 className="w-5 h-5" />
                      </Button>
                    </div>
                    {showAnswer ? (
                      <div className="space-y-3 animate-slide-up">
                        <p className="text-lg text-gray-700">{reviewWords[reviewIndex].meaning}</p>
                        {reviewWords[reviewIndex].examples?.[0] && (
                          <div className="text-sm text-gray-500">
                            <p>{reviewWords[reviewIndex].examples![0].en}</p>
                            <p className="text-gray-400">{reviewWords[reviewIndex].examples![0].zh}</p>
                          </div>
                        )}
                        <div className="flex justify-center gap-4 pt-4">
                          <Button variant="outline" className="gap-2 text-red-600 border-red-200 hover:bg-red-50" onClick={() => { recordReview(reviewWords[reviewIndex].word, false); setShowAnswer(false); setReviewIndex((i) => Math.min(i + 1, reviewWords.length - 1)); }}>
                            <X className="w-4 h-4" /> 不认识
                          </Button>
                          <Button className="gap-2 bg-green-600 hover:bg-green-700" onClick={() => { recordReview(reviewWords[reviewIndex].word, true); setShowAnswer(false); setReviewIndex((i) => Math.min(i + 1, reviewWords.length - 1)); }}>
                            <CheckCircle className="w-4 h-4" /> 认识
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button className="mt-4" onClick={() => setShowAnswer(true)}>显示答案</Button>
                    )}
                  </CardContent>
                </Card>
                <div className="flex justify-center gap-2 mt-4">
                  <Button variant="outline" size="sm" disabled={reviewIndex === 0} onClick={() => { setReviewIndex((i) => i - 1); setShowAnswer(false); }}>上一个</Button>
                  <Button variant="outline" size="sm" disabled={reviewIndex >= reviewWords.length - 1} onClick={() => { setReviewIndex((i) => i + 1); setShowAnswer(false); }}>下一个</Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ===== Spelling Test Tab ===== */}
          <TabsContent value="test">
            {!testActive && !testDone && (
              <div className="max-w-md mx-auto text-center">
                <Target className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">拼写测试</h2>
                <p className="text-gray-500 mb-6">看中文释义，拼写英文单词</p>
                {savedWords.length < 3 ? (
                  <p className="text-gray-400">至少需要 3 个单词才能开始测试</p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-2 justify-center">
                      {[5, 10, 20].filter((n) => n <= savedWords.length).map((n) => (
                        <Button key={n} variant="outline" onClick={() => startTest(savedWords, n)}>
                          <Shuffle className="w-4 h-4 mr-1.5" /> {n} 词测试
                        </Button>
                      ))}
                    </div>
                    {wordGroups.map((g) => {
                      const gWords = savedWords.filter((w) => w.groupId === g.id);
                      if (gWords.length < 3) return null;
                      return (
                        <Button key={g.id} variant="outline" className="w-full" onClick={() => startTest(gWords, Math.min(10, gWords.length))}>
                          <Shuffle className="w-4 h-4 mr-1.5" /> {g.name}（{gWords.length} 词）
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {testActive && testWords[testIndex] && (
              <div className="max-w-md mx-auto text-center">
                <Badge variant="secondary" className="mb-4">{testIndex + 1} / {testWords.length}</Badge>
                <Card className="bg-white border-gray-200 shadow-lg">
                  <CardContent className="p-8">
                    <p className="text-lg text-gray-700 mb-2">{testWords[testIndex].meaning}</p>
                    {testWords[testIndex].phonetic && <p className="text-sm text-gray-400 font-mono mb-4">{testWords[testIndex].phonetic}</p>}
                    <Input
                      value={testAnswer}
                      onChange={(e) => setTestAnswer(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && testAnswer.trim() && submitTestAnswer()}
                      placeholder="输入英文单词..."
                      className="h-11 text-center text-lg font-mono mb-4"
                      autoFocus
                    />
                    <Button onClick={submitTestAnswer} disabled={!testAnswer.trim()} className="w-full">确认</Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {testDone && (
              <div className="max-w-md mx-auto text-center">
                <TrendingUp className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">测试完成</h2>
                <p className="text-3xl font-bold text-gray-900 mb-4">
                  {testResults.filter((r) => r.correct).length} / {testResults.length}
                </p>
                <div className="space-y-2 mb-6">
                  {testResults.map((r, i) => (
                    <div key={i} className={`flex items-center justify-between p-2 rounded-lg ${r.correct ? "bg-green-50" : "bg-red-50"}`}>
                      <span className="text-sm text-gray-700">{testWords[i]?.meaning}</span>
                      <div className="flex items-center gap-2">
                        {r.correct ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <>
                            <span className="text-sm text-red-500 line-through">{r.userAnswer}</span>
                            <span className="text-sm text-green-600 font-medium">{r.word}</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <Button onClick={() => { setTestDone(false); setTestActive(false); }}>再来一次</Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

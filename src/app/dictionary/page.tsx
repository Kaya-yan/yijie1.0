"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Search, Volume2, Star, BookOpen, Loader2, AlertCircle, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useStore } from "@/lib/store";
import { lookupWord } from "@/lib/api/client";
import { useAuth } from "@/hooks/useAuth";
import { ApiNotConfiguredBadge } from "@/components/shared";

interface WordResult {
  word: string;
  phonetic: string;
  pos: string;
  defs: string[];
  examples: { en: string; zh: string }[];
  synonyms?: string[];
  antonyms?: string[];
  frequency?: string;
  etymology?: string;
  collocations?: string[];
  inflections?: Record<string, string>;
}

const mockWords: Record<string, WordResult> = {
  hello: {
    word: "hello",
    phonetic: "/həˈloʊ/",
    pos: "int.",
    defs: ["你好；喂", "嘿（引起注意）"],
    examples: [
      { en: "Hello, how are you?", zh: "你好，你好吗？" },
      { en: "Hello, is anyone there?", zh: "嘿，有人吗？" },
    ],
    synonyms: ["hi", "greetings"],
    antonyms: ["goodbye"],
    frequency: "common",
    etymology: "源自古英语 hāl，意为'健康、完整'，后演变为问候语",
    collocations: ["say hello", "hello there", "hello world"],
    inflections: { plural: "hellos" },
  },
  world: {
    word: "world",
    phonetic: "/wɜːrld/",
    pos: "n.",
    defs: ["世界", "地球", "领域"],
    examples: [
      { en: "The world is beautiful.", zh: "世界很美好。" },
      { en: "He is the best in the world.", zh: "他是世界上最好的。" },
    ],
    frequency: "common",
    etymology: "源自古英语 weorold，由 wer (人) + old (时代) 组成，意为'人的时代'",
    collocations: ["around the world", "world peace", "world class"],
    inflections: { plural: "worlds" },
  },
  love: {
    word: "love",
    phonetic: "/lʌv/",
    pos: "n./v.",
    defs: ["爱；热爱", "喜爱；爱好"],
    examples: [
      { en: "I love you.", zh: "我爱你。" },
      { en: "Love is patient, love is kind.", zh: "爱是耐心，爱是仁慈。" },
    ],
    synonyms: ["adore", "cherish"],
    antonyms: ["hate"],
    frequency: "common",
    etymology: "源自古英语 lufu，与拉丁语 lubēre (令人愉悦) 同源",
    collocations: ["fall in love", "love story", "true love", "love at first sight"],
    inflections: { verb: "love", pastTense: "loved", presentParticiple: "loving", thirdPerson: "loves", plural: "loves" },
  },
};

export default function DictionaryPage() {
  const { addWord, removeWord, hasWord } = useStore();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<WordResult | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isConfigured } = useAuth();

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    setError(null);
    setResult(null);

    try {
      if (isConfigured) {
        // Use real API
        const response = await lookupWord(query.trim());
        try {
          const data = JSON.parse(response.result);
          setResult(data);
        } catch {
          // If JSON parse fails, show raw response
          setResult({
            word: query.trim(),
            phonetic: "",
            pos: "",
            defs: [response.result],
            examples: [],
          });
        }
      } else {
        // Use mock data
        await new Promise((resolve) => setTimeout(resolve, 500));
        const key = query.toLowerCase().trim();
        setResult(mockWords[key] || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "查询失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const toggleSave = () => {
    if (!result) return;
    if (hasWord(result.word)) {
      removeWord(result.word);
    } else {
      addWord({
        word: result.word,
        phonetic: result.phonetic,
        meaning: result.defs.join("; "),
        pos: result.pos,
        source: "dictionary",
        frequency: result.frequency as any,
        etymology: result.etymology,
        collocations: result.collocations,
        inflections: result.inflections,
        examples: result.examples,
        synonyms: result.synonyms,
        antonyms: result.antonyms,
      });
    }
  };

  const speak = (text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="min-h-screen pixel-grid" style={{ background: "var(--pixel-bg)" }}>
      <Navbar />
      <main id="main-content" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
        <div className="text-center mb-8 section-enter">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-7 h-7 text-blue-600" />
          </div>
          <h1 className="font-pixel-title" style={{ color: "var(--pixel-text)" }}>智能词典</h1>
          <p className="text-pixel-text-light">
            {isConfigured ? "AI 驱动的智能词典，提供详细释义" : "输入单词，获取释义、例句与发音"}
          </p>
        </div>

        <div className="max-w-xl mx-auto mb-8 section-enter section-enter-1">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pixel-text-muted" />
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="输入单词或短语..."
                className="pl-10 h-11 bg-white border-gray-200"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="h-11 px-6 bg-gray-900 hover:bg-gray-800 shadow-sm btn-press"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "搜索"}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {Object.keys(mockWords).map((word) => (
              <Badge
                key={word}
                variant="secondary"
                className="cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors"
                onClick={() => {
                  setQuery(word);
                  setTimeout(() => handleSearch(), 100);
                }}
              >
                {word}
              </Badge>
            ))}
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              <span className="text-sm text-pixel-text-light">查询中...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center gap-2 py-8 text-red-500">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {searched && !loading && !error && result && (
          <Card className="bg-white border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-pixel-text mb-1">{result.word}</h2>
                  <div className="flex items-center gap-3">
                    {result.phonetic && (
                      <span className="font-mono text-pixel-text-light">{result.phonetic}</span>
                    )}
                    {result.pos && (
                      <Badge variant="secondary" className="bg-gray-100 text-pixel-text-light">{result.pos}</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-pixel-text-muted hover:text-blue-600"
                    onClick={() => speak(result.word)}
                  >
                    <Volume2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-9 w-9 ${
                      hasWord(result.word) ? "text-yellow-500" : "text-pixel-text-muted hover:text-yellow-500"
                    }`}
                    onClick={toggleSave}
                  >
                    <Bookmark className={`w-4 h-4 ${hasWord(result.word) ? "fill-current" : ""}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <Separator />

            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xs font-semibold text-pixel-text-muted uppercase tracking-wider">释义</h3>
                {result.frequency && (
                  <Badge variant="secondary" className={`text-xs ${
                    result.frequency === "common" ? "bg-green-50 text-green-700" :
                    result.frequency === "medium" ? "bg-blue-50 text-blue-700" :
                    result.frequency === "academic" ? "bg-purple-50 text-purple-700" :
                    "bg-gray-100 text-pixel-text-light"
                  }`}>
                    {result.frequency === "common" ? "高频" : result.frequency === "medium" ? "中频" : result.frequency === "academic" ? "学术" : "低频"}
                  </Badge>
                )}
              </div>
              <ul className="space-y-2.5">
                {result.defs.map((def, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-blue-600 font-medium text-sm mt-0.5">{i + 1}.</span>
                    <span className="text-pixel-text">{def}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            {result.etymology && (
              <>
                <Separator />
                <CardContent className="pt-6">
                  <h3 className="text-xs font-semibold text-pixel-text-muted uppercase tracking-wider mb-3">词根词源</h3>
                  <p className="text-sm text-pixel-text-light leading-relaxed">{result.etymology}</p>
                </CardContent>
              </>
            )}

            {result.collocations && result.collocations.length > 0 && (
              <>
                <Separator />
                <CardContent className="pt-6">
                  <h3 className="text-xs font-semibold text-pixel-text-muted uppercase tracking-wider mb-3">常用搭配</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.collocations.map((c) => (
                      <Badge key={c} variant="outline" className="text-sm font-mono">{c}</Badge>
                    ))}
                  </div>
                </CardContent>
              </>
            )}

            {result.inflections && Object.keys(result.inflections).length > 0 && (
              <>
                <Separator />
                <CardContent className="pt-6">
                  <h3 className="text-xs font-semibold text-pixel-text-muted uppercase tracking-wider mb-3">词形变化</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(result.inflections).filter(([, v]) => v).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 text-sm">
                        <span className="text-pixel-text-muted text-xs w-20 shrink-0">{key}</span>
                        <span className="text-pixel-text font-mono">{value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </>
            )}

            {result.examples.length > 0 && (
              <>
                <Separator />
                <CardContent className="pt-6">
                  <h3 className="text-xs font-semibold text-pixel-text-muted uppercase tracking-wider mb-3">例句</h3>
                  <div className="space-y-3">
                    {result.examples.map((ex, i) => (
                      <div key={i} className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-pixel-text mb-1">{ex.en}</p>
                        <p className="text-pixel-text-light text-sm">{ex.zh}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </>
            )}

            {(result.synonyms || result.antonyms) && (
              <>
                <Separator />
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    {result.synonyms && result.synonyms.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold text-pixel-text-muted uppercase tracking-wider mb-2">近义词</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {result.synonyms.map((word) => (
                            <Badge key={word} variant="outline" className="text-xs">
                              {word}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.antonyms && result.antonyms.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold text-pixel-text-muted uppercase tracking-wider mb-2">反义词</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {result.antonyms.map((word) => (
                            <Badge key={word} variant="outline" className="text-xs">
                              {word}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        )}

        {searched && !loading && !error && !result && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 text-pixel-text-muted" />
            </div>
            <p className="text-pixel-text-light mb-2">未找到该单词</p>
            <p className="text-sm text-pixel-text-muted">
              {isConfigured ? "请检查拼写或尝试其他词汇" : "提示：试试 hello, world, love"}
            </p>
          </div>
        )}

        {!isConfigured && <ApiNotConfiguredBadge message="未配置 API，使用本地词库" />}
      </main>
    </div>
  );
}

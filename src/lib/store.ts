import { create } from "zustand";
import { persist } from "zustand/middleware";

// ============ Model configuration ============
export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  apiKey: string;
  baseUrl: string;
  enabled: boolean;
}

// ============ Translation ============
export interface TranslationHistory {
  id: string;
  sourceText: string;
  targetText: string;
  sourceLang: string;
  targetLang: string;
  model: string;
  timestamp: number;
}

// ============ Vocabulary ============
export type WordFrequency = "common" | "medium" | "rare" | "academic";
export type LearningStatus = "new" | "fuzzy" | "mastered";
export type WordSource = "translation" | "dictionary" | "reading" | "grammar" | "writing" | "manual";

export interface SavedWord {
  word: string;
  phonetic: string;
  meaning: string;
  addedAt: number;
  pos?: string;
  frequency?: WordFrequency;
  etymology?: string;
  collocations?: string[];
  inflections?: Record<string, string>;
  examples?: { en: string; zh: string }[];
  synonyms?: string[];
  antonyms?: string[];
  groupId?: string;
  status: LearningStatus;
  source: WordSource;
  lastReviewAt?: number;
  nextReviewAt?: number;
  reviewCount: number;
  correctCount: number;
  wrongCount: number;
}

export interface WordGroup {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: number;
  updatedAt: number;
}

export interface SpellingTestRecord {
  id: string;
  wordGroupId?: string;
  totalWords: number;
  correctWords: number;
  words: { word: string; correct: boolean; userAnswer: string }[];
  timestamp: number;
}

// ============ Grammar ============
export interface GrammarMistake {
  id: string;
  sentence: string;
  errorType: string;
  errorHighlight: string;
  correctForm: string;
  explanation: string;
  source: "grammar" | "writing";
  timestamp: number;
  reviewCount: number;
  mastered: boolean;
}

export interface GrammarPracticeRecord {
  id: string;
  type: "fill-blank" | "multiple-choice";
  question: string;
  options?: string[];
  answer: string;
  userAnswer: string;
  correct: boolean;
  relatedMistakeId?: string;
  timestamp: number;
}

// ============ Writing ============
export interface WritingHistory {
  id: string;
  scene: string;
  text: string;
  score: number;
  suggestions: string[];
  timestamp: number;
  dimensionScores?: {
    grammar: number;
    vocabulary: number;
    logic: number;
    format: number;
  };
  polishedVersion?: string;
  wordCount: number;
}

// ============ Reading ============
export interface ReadingMaterial {
  id: string;
  title: string;
  content: string;
  level: "beginner" | "intermediate" | "advanced";
  cefrLevel: string;
  wordCount: number;
  category: string;
  source?: string;
  createdAt: number;
}

export interface ReadingProgress {
  id: string;
  materialId: string;
  progress: number;
  lastReadAt: number;
  readTimeSeconds: number;
  highlightedWords: string[];
}

// ============ SM-2 spaced repetition ============
function calculateNextReview(reviewCount: number, correctRatio: number): number {
  const intervals = [1, 3, 7, 14, 30, 60]; // days
  const idx = Math.min(reviewCount, intervals.length - 1);
  const days = correctRatio >= 0.8 ? intervals[idx] : Math.max(1, Math.floor(intervals[idx] / 2));
  return Date.now() + days * 24 * 60 * 60 * 1000;
}

// ============ Default models ============
export const defaultModels: ModelConfig[] = [
  { id: "kimi", name: "Kimi", provider: "月之暗面", apiKey: "", baseUrl: "https://api.moonshot.cn/v1", enabled: true },
  { id: "deepseek", name: "DeepSeek", provider: "深度求索", apiKey: "", baseUrl: "https://api.deepseek.com/v1", enabled: true },
  { id: "tongyi", name: "通义千问", provider: "阿里云", apiKey: "", baseUrl: "https://dashscope.aliyuncs.com/api/v1", enabled: true },
  { id: "wenxin", name: "文心一言", provider: "百度", apiKey: "", baseUrl: "https://aip.baidubce.com/rpc/2.0/ai_custom/v1", enabled: true },
  { id: "zhipu", name: "智谱清言", provider: "清华", apiKey: "", baseUrl: "https://open.bigmodel.cn/api/paas/v4", enabled: true },
  { id: "xinghuo", name: "讯飞星火", provider: "科大讯飞", apiKey: "", baseUrl: "https://spark-api-open.xf-yun.com/v1", enabled: true },
];

// ============ AppState ============
interface AppState {
  // API Models
  models: ModelConfig[];
  setModels: (models: ModelConfig[]) => void;
  updateModel: (id: string, updates: Partial<ModelConfig>) => void;
  addModel: (model: ModelConfig) => void;
  removeModel: (id: string) => void;
  getConfiguredModel: (modelId?: string) => ModelConfig | null;
  hasConfiguredModel: () => boolean;

  // Translation history
  translationHistory: TranslationHistory[];
  addTranslation: (item: Omit<TranslationHistory, "id" | "timestamp">) => void;
  clearTranslationHistory: () => void;

  // Vocabulary book
  savedWords: SavedWord[];
  addWord: (word: Omit<SavedWord, "addedAt" | "status" | "reviewCount" | "correctCount" | "wrongCount"> & Partial<Pick<SavedWord, "status">>) => void;
  removeWord: (word: string) => void;
  hasWord: (word: string) => boolean;
  updateWord: (word: string, updates: Partial<SavedWord>) => void;
  updateWordStatus: (word: string, status: LearningStatus) => void;
  recordReview: (word: string, correct: boolean) => void;
  moveWordToGroup: (word: string, groupId: string | undefined) => void;
  getWordsByGroup: (groupId?: string) => SavedWord[];
  getWordsByStatus: (status: LearningStatus) => SavedWord[];
  getWordsForReview: () => SavedWord[];

  // Word groups
  wordGroups: WordGroup[];
  addWordGroup: (group: Omit<WordGroup, "id" | "createdAt" | "updatedAt">) => void;
  updateWordGroup: (id: string, updates: Partial<WordGroup>) => void;
  removeWordGroup: (id: string) => void;

  // Spelling test
  spellingTestHistory: SpellingTestRecord[];
  addSpellingTest: (record: Omit<SpellingTestRecord, "id" | "timestamp">) => void;

  // Grammar mistakes
  grammarMistakes: GrammarMistake[];
  addGrammarMistake: (mistake: Omit<GrammarMistake, "id" | "timestamp" | "reviewCount" | "mastered">) => void;
  removeGrammarMistake: (id: string) => void;
  markMistakeMastered: (id: string, mastered: boolean) => void;
  getUnmasteredMistakes: () => GrammarMistake[];

  // Grammar practice
  grammarPracticeHistory: GrammarPracticeRecord[];
  addGrammarPractice: (record: Omit<GrammarPracticeRecord, "id" | "timestamp">) => void;

  // Writing history
  writingHistory: WritingHistory[];
  addWriting: (item: Omit<WritingHistory, "id" | "timestamp">) => void;
  clearWritingHistory: () => void;

  // Reading
  readingProgresses: ReadingProgress[];
  updateReadingProgress: (materialId: string, updates: Partial<ReadingProgress>) => void;
  getReadingProgress: (materialId: string) => ReadingProgress | undefined;

  // Selected model
  selectedModelId: string | null;
  setSelectedModelId: (id: string | null) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ===== API Models =====
      models: defaultModels,
      setModels: (models) => set({ models }),
      updateModel: (id, updates) =>
        set((state) => ({
          models: state.models.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        })),
      addModel: (model) => set((state) => ({ models: [...state.models, model] })),
      removeModel: (id) => set((state) => ({ models: state.models.filter((m) => m.id !== id) })),
      getConfiguredModel: (modelId) => {
        const { models } = get();
        if (modelId) return models.find((m) => m.id === modelId && m.enabled && m.apiKey) || null;
        return models.find((m) => m.enabled && m.apiKey) || null;
      },
      hasConfiguredModel: () => {
        const { models } = get();
        return models.some((m) => m.enabled && m.apiKey);
      },

      // ===== Translation history =====
      translationHistory: [],
      addTranslation: (item) =>
        set((state) => ({
          translationHistory: [{ ...item, id: Date.now().toString(), timestamp: Date.now() }, ...state.translationHistory].slice(0, 100),
        })),
      clearTranslationHistory: () => set({ translationHistory: [] }),

      // ===== Vocabulary book =====
      savedWords: [],
      addWord: (word) =>
        set((state) => {
          if (state.savedWords.some((w) => w.word === word.word)) return state;
          const newWord: SavedWord = {
            ...word,
            addedAt: Date.now(),
            status: word.status || "new",
            reviewCount: 0,
            correctCount: 0,
            wrongCount: 0,
          };
          return { savedWords: [newWord, ...state.savedWords].slice(0, 500) };
        }),
      removeWord: (word) => set((state) => ({ savedWords: state.savedWords.filter((w) => w.word !== word) })),
      hasWord: (word) => get().savedWords.some((w) => w.word === word),
      updateWord: (word, updates) =>
        set((state) => ({
          savedWords: state.savedWords.map((w) => (w.word === word ? { ...w, ...updates } : w)),
        })),
      updateWordStatus: (word, status) =>
        set((state) => ({
          savedWords: state.savedWords.map((w) => (w.word === word ? { ...w, status } : w)),
        })),
      recordReview: (word, correct) =>
        set((state) => ({
          savedWords: state.savedWords.map((w) => {
            if (w.word !== word) return w;
            const newCorrect = w.correctCount + (correct ? 1 : 0);
            const newWrong = w.wrongCount + (correct ? 0 : 1);
            const newReviewCount = w.reviewCount + 1;
            const ratio = newCorrect / newReviewCount;
            return {
              ...w,
              reviewCount: newReviewCount,
              correctCount: newCorrect,
              wrongCount: newWrong,
              lastReviewAt: Date.now(),
              nextReviewAt: calculateNextReview(newReviewCount, ratio),
              status: ratio >= 0.8 && newReviewCount >= 3 ? "mastered" : ratio >= 0.4 ? "fuzzy" : "new",
            };
          }),
        })),
      moveWordToGroup: (word, groupId) =>
        set((state) => ({
          savedWords: state.savedWords.map((w) => (w.word === word ? { ...w, groupId } : w)),
        })),
      getWordsByGroup: (groupId) => {
        const { savedWords } = get();
        if (!groupId) return savedWords.filter((w) => !w.groupId);
        return savedWords.filter((w) => w.groupId === groupId);
      },
      getWordsByStatus: (status) => get().savedWords.filter((w) => w.status === status),
      getWordsForReview: () => {
        const now = Date.now();
        return get().savedWords.filter((w) => w.nextReviewAt && w.nextReviewAt <= now);
      },

      // ===== Word groups =====
      wordGroups: [],
      addWordGroup: (group) =>
        set((state) => ({
          wordGroups: [...state.wordGroups, { ...group, id: Date.now().toString(), createdAt: Date.now(), updatedAt: Date.now() }],
        })),
      updateWordGroup: (id, updates) =>
        set((state) => ({
          wordGroups: state.wordGroups.map((g) => (g.id === id ? { ...g, ...updates, updatedAt: Date.now() } : g)),
        })),
      removeWordGroup: (id) =>
        set((state) => ({
          wordGroups: state.wordGroups.filter((g) => g.id !== id),
          savedWords: state.savedWords.map((w) => (w.groupId === id ? { ...w, groupId: undefined } : w)),
        })),

      // ===== Spelling test =====
      spellingTestHistory: [],
      addSpellingTest: (record) =>
        set((state) => ({
          spellingTestHistory: [{ ...record, id: Date.now().toString(), timestamp: Date.now() }, ...state.spellingTestHistory].slice(0, 50),
        })),

      // ===== Grammar mistakes =====
      grammarMistakes: [],
      addGrammarMistake: (mistake) =>
        set((state) => ({
          grammarMistakes: [{ ...mistake, id: Date.now().toString(), timestamp: Date.now(), reviewCount: 0, mastered: false }, ...state.grammarMistakes].slice(0, 200),
        })),
      removeGrammarMistake: (id) =>
        set((state) => ({ grammarMistakes: state.grammarMistakes.filter((m) => m.id !== id) })),
      markMistakeMastered: (id, mastered) =>
        set((state) => ({
          grammarMistakes: state.grammarMistakes.map((m) => (m.id === id ? { ...m, mastered } : m)),
        })),
      getUnmasteredMistakes: () => get().grammarMistakes.filter((m) => !m.mastered),

      // ===== Grammar practice =====
      grammarPracticeHistory: [],
      addGrammarPractice: (record) =>
        set((state) => ({
          grammarPracticeHistory: [{ ...record, id: Date.now().toString(), timestamp: Date.now() }, ...state.grammarPracticeHistory].slice(0, 200),
        })),

      // ===== Writing history =====
      writingHistory: [],
      addWriting: (item) =>
        set((state) => ({
          writingHistory: [{ ...item, id: Date.now().toString(), timestamp: Date.now() }, ...state.writingHistory].slice(0, 50),
        })),
      clearWritingHistory: () => set({ writingHistory: [] }),

      // ===== Reading =====
      readingProgresses: [],
      updateReadingProgress: (materialId, updates) =>
        set((state) => {
          const existing = state.readingProgresses.find((p) => p.materialId === materialId);
          if (existing) {
            return {
              readingProgresses: state.readingProgresses.map((p) =>
                p.materialId === materialId ? { ...p, ...updates, lastReadAt: Date.now() } : p
              ),
            };
          }
          return {
            readingProgresses: [
              { id: Date.now().toString(), materialId, progress: 0, lastReadAt: Date.now(), readTimeSeconds: 0, highlightedWords: [], ...updates },
              ...state.readingProgresses,
            ].slice(0, 100),
          };
        }),
      getReadingProgress: (materialId) => get().readingProgresses.find((p) => p.materialId === materialId),

      // ===== Selected model =====
      selectedModelId: null,
      setSelectedModelId: (id) => set({ selectedModelId: id }),
    }),
    {
      name: "yijie-storage",
      version: 2,
      migrate: (persisted: any, version: number) => {
        if (version < 2) {
          // Migrate old savedWords to new format
          if (persisted.savedWords) {
            persisted.savedWords = persisted.savedWords.map((w: any) => ({
              ...w,
              status: w.status || "new",
              source: w.source || "manual",
              reviewCount: w.reviewCount || 0,
              correctCount: w.correctCount || 0,
              wrongCount: w.wrongCount || 0,
            }));
          }
        }
        return persisted;
      },
    }
  )
);

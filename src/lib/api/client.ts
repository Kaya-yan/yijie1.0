import { ModelConfig, useStore } from "@/lib/store";

export type { ModelConfig };

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface ChatResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface TranslationRequest {
  text: string;
  sourceLang: string;
  targetLang: string;
  modelId?: string;
}

export interface TranslationResponse {
  result: string;
  model: string;
  latency: number;
}

export interface AnalysisResponse {
  result: string;
  model: string;
  latency: number;
}

// Module-level constants
const apiModelMap: Record<string, string> = {
  kimi: "moonshot-v1-8k",
  deepseek: "deepseek-chat",
  tongyi: "qwen-turbo",
  wenxin: "ernie-speed-128k",
  zhipu: "glm-4-flash",
  xinghuo: "generalv3.5",
};

const langMap: Record<string, string> = {
  zh: "中文",
  en: "英文",
  ja: "日文",
  ko: "韩文",
  fr: "法文",
  de: "德文",
  es: "西班牙文",
  ru: "俄文",
};

export const sceneMap: Record<string, string> = {
  email: "商务邮件",
  essay: "学术论文",
  resume: "简历",
  creative: "创意写作",
  business: "商务文档",
  diary: "日记",
  book_review: "读后感",
  movie_review: "影评",
  speech: "演讲稿",
  application: "申请书",
  custom: "自定义场景",
};

function getModels(): ModelConfig[] {
  return useStore.getState().models;
}

function getModel(modelId?: string): ModelConfig | null {
  const models = getModels();
  if (modelId) {
    return models.find((m) => m.id === modelId && m.enabled && m.apiKey) || null;
  }
  return models.find((m) => m.enabled && m.apiKey) || null;
}

export function hasConfiguredModel(): boolean {
  const models = getModels();
  return models.some((m) => m.enabled && m.apiKey);
}

export async function chatCompletion(
  messages: ChatMessage[],
  options: {
    modelId?: string;
    temperature?: number;
    max_tokens?: number;
    signal?: AbortSignal;
  } = {}
): Promise<{ content: string; model: string; latency: number }> {
  const model = getModel(options.modelId);
  if (!model) {
    throw new Error("未配置可用的 AI 模型，请在设置中添加 API Key");
  }

  const startTime = Date.now();

  const request: ChatRequest = {
    model: apiModelMap[model.id] || model.id,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 2000,
    stream: false,
  };

  const response = await fetch(`${model.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${model.apiKey}`,
    },
    body: JSON.stringify(request),
    signal: options.signal,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API 调用失败: ${response.status} - ${error}`);
  }

  const data: ChatResponse = await response.json();
  const latency = Date.now() - startTime;

  return {
    content: data.choices[0]?.message?.content || "",
    model: model.name,
    latency,
  };
}

export async function translate(request: TranslationRequest): Promise<TranslationResponse> {
  const sourceLang = langMap[request.sourceLang] || request.sourceLang;
  const targetLang = langMap[request.targetLang] || request.targetLang;

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `你是一个专业的翻译助手。请将用户提供的文本从${sourceLang}翻译成${targetLang}。只返回翻译结果，不要添加任何解释。`,
    },
    { role: "user", content: request.text },
  ];

  const response = await chatCompletion(messages, {
    modelId: request.modelId,
    temperature: 0.3,
    max_tokens: 2000,
  });

  return { result: response.content, model: response.model, latency: response.latency };
}

export async function analyzeGrammar(sentence: string, modelId?: string): Promise<AnalysisResponse> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `你是一个英语语法分析助手。请分析用户提供的英文句子，返回 JSON 格式的分析结果。

返回格式：
{
  "items": [
    {
      "type": "knowledge|suggestion|error",
      "highlight": "需要高亮的文本",
      "message": "简短说明",
      "explanation": "详细解释"
    }
  ]
}

只返回 JSON，不要添加其他内容。`,
    },
    { role: "user", content: sentence },
  ];

  const response = await chatCompletion(messages, { modelId, temperature: 0.3, max_tokens: 2000 });
  return { result: response.content, model: response.model, latency: response.latency };
}

export async function analyzeWriting(text: string, scene: string, modelId?: string): Promise<AnalysisResponse> {
  const sceneName = sceneMap[scene] || scene;

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `你是一个专业的写作助手，正在帮助用户进行${sceneName}写作。

请分析用户的文本，返回 JSON 格式的分析结果：

{
  "score": 85,
  "dimensionScores": {
    "grammar": 90,
    "vocabulary": 75,
    "logic": 85,
    "format": 88
  },
  "suggestions": ["建议1", "建议2"],
  "analysis": "整体评价",
  "polishedVersion": "在保持原意的基础上润色后的版本"
}

dimensionScores 各维度说明：
- grammar: 语法准确性(0-100)
- vocabulary: 词汇丰富度(0-100)
- logic: 逻辑连贯性(0-100)
- format: 格式规范性(0-100)
score 是综合评分，为四个维度的加权平均。

只返回 JSON，不要添加其他内容。`,
    },
    { role: "user", content: text },
  ];

  const response = await chatCompletion(messages, { modelId, temperature: 0.5, max_tokens: 3000 });
  return { result: response.content, model: response.model, latency: response.latency };
}

export async function generateWritingTemplate(scene: string, topic?: string, modelId?: string): Promise<AnalysisResponse> {
  const sceneName = sceneMap[scene] || scene;

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `你是一个写作指导助手。请为${sceneName}场景生成写作模板和指导，返回 JSON 格式：

{
  "outline": ["第一段要点", "第二段要点", "第三段要点"],
  "template": "模板文本框架（含占位符[主题]等）",
  "usefulSentences": ["常用句式1", "常用句式2", "常用句式3"],
  "tips": ["写作技巧1", "写作技巧2"]
}

只返回 JSON，不要添加其他内容。`,
    },
    { role: "user", content: topic || `请为${sceneName}生成写作模板` },
  ];

  const response = await chatCompletion(messages, { modelId, temperature: 0.5, max_tokens: 2000 });
  return { result: response.content, model: response.model, latency: response.latency };
}

export async function generateGrammarPractice(
  mistakes: { errorType: string; sentence: string; correctForm: string }[],
  type: "fill-blank" | "multiple-choice",
  count: number,
  modelId?: string
): Promise<AnalysisResponse> {
  const mistakeContext = mistakes.length > 0
    ? `用户常犯的错误类型：\n${mistakes.map((m) => `- ${m.errorType}: "${m.sentence}" → 正确: "${m.correctForm}"`).join("\n")}`
    : "用户尚未有错题记录，请生成通用语法练习题。";

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `你是一个英语语法练习出题助手。${mistakeContext}

请生成 ${count} 道${type === "fill-blank" ? "填空" : "选择"}题，返回 JSON 格式：

{
  "questions": [
    {
      "question": "题目文本（填空题用___标记空格）",
      "options": ["A. 选项1", "B. 选项2", "C. 选项3", "D. 选项4"],
      "answer": "正确答案",
      "explanation": "解析"
    }
  ]
}

${type === "fill-blank" ? "options 字段不需要。" : "必须有4个选项。"}
题目难度应针对用户的薄弱环节。只返回 JSON，不要添加其他内容。`,
    },
    { role: "user", content: `请生成 ${count} 道${type === "fill-blank" ? "填空" : "选择"}题` },
  ];

  const response = await chatCompletion(messages, { modelId, temperature: 0.7, max_tokens: 3000 });
  return { result: response.content, model: response.model, latency: response.latency };
}

export async function analyzeSentence(sentence: string, modelId?: string): Promise<AnalysisResponse> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `你是一个英语句子分析助手。请分析用户提供的英文句子，返回 JSON 格式：

{
  "translation": "完整中文翻译",
  "structure": "句子结构分析（主语/谓语/宾语/从句等）",
  "clauses": [
    {"type": "主句/定语从句/状语从句等", "text": "从句文本", "function": "语法功能"}
  ],
  "keyPhrases": [{"phrase": "关键短语", "meaning": "含义"}],
  "grammarPoints": ["涉及的语法点1", "涉及的语法点2"]
}

只返回 JSON，不要添加其他内容。`,
    },
    { role: "user", content: sentence },
  ];

  const response = await chatCompletion(messages, { modelId, temperature: 0.3, max_tokens: 2000 });
  return { result: response.content, model: response.model, latency: response.latency };
}

export async function lookupWord(word: string, modelId?: string): Promise<AnalysisResponse> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `你是一个英语词典助手。请提供单词的详细信息，返回 JSON 格式：

{
  "word": "单词",
  "phonetic": "音标",
  "pos": "词性",
  "defs": ["释义1", "释义2"],
  "examples": [{"en": "英文例句", "zh": "中文翻译"}],
  "synonyms": ["近义词1", "近义词2"],
  "antonyms": ["反义词1", "反义词2"],
  "frequency": "common 或 medium 或 rare 或 academic",
  "etymology": "词根词源说明，如 port = carry, 来自拉丁语 portare",
  "collocations": ["常用搭配1", "常用搭配2"],
  "inflections": {
    "comparative": "比较级",
    "superlative": "最高级",
    "pastTense": "过去式",
    "pastParticiple": "过去分词",
    "presentParticiple": "现在分词",
    "thirdPerson": "第三人称单数",
    "plural": "复数",
    "noun": "名词形式",
    "verb": "动词形式",
    "adjective": "形容词形式",
    "adverb": "副词形式"
  }
}

frequency 取值说明：common=最常用词(四六级核心), medium=中频词, rare=低频词, academic=学术词汇
inflections 中，不适用的字段填 null。只返回 JSON，不要添加其他内容。`,
    },
    { role: "user", content: word },
  ];

  const response = await chatCompletion(messages, { modelId, temperature: 0.3, max_tokens: 2000 });
  return { result: response.content, model: response.model, latency: response.latency };
}

export async function analyzeReading(text: string, modelId?: string): Promise<AnalysisResponse> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `你是一个英语阅读助手。请分析用户提供的英文文本，返回 JSON 格式：

{
  "translation": "完整的中文翻译",
  "vocabulary": [
    {
      "word": "重要词汇",
      "phonetic": "音标",
      "meaning": "中文释义",
      "example": "例句",
      "difficulty": "A1/A2/B1/B2/C1/C2",
      "frequency": "common/medium/rare/academic"
    }
  ],
  "grammar_points": [{"phrase": "语法短语", "explanation": "语法解释"}],
  "summary": "文章摘要（30字以内）",
  "difficulty": {
    "cefrLevel": "A1/A2/B1/B2/C1/C2",
    "difficultWords": ["难词1", "难词2"]
  }
}

vocabulary 应包含文中较难或重要的词汇（5-15个），按重要性排序。
difficulty.cefrLevel 是文章整体难度等级。
只返回 JSON，不要添加其他内容。`,
    },
    { role: "user", content: text },
  ];

  const response = await chatCompletion(messages, { modelId, temperature: 0.3, max_tokens: 3000 });
  return { result: response.content, model: response.model, latency: response.latency };
}

export async function testConnection(modelId: string, directModel?: ModelConfig): Promise<{
  success: boolean;
  latency?: number;
  error?: string;
}> {
  try {
    const model = directModel || getModel(modelId);
    if (!model) return { success: false, error: "未找到模型配置" };
    if (!model.apiKey) return { success: false, error: "未配置 API Key" };

    const startTime = Date.now();
    const response = await fetch(`${model.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${model.apiKey}`,
      },
      body: JSON.stringify({
        model: apiModelMap[model.id] || model.id,
        messages: [{ role: "user", content: "Hi" }],
        max_tokens: 10,
      }),
    });

    const latency = Date.now() - startTime;

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${error}` };
    }

    return { success: true, latency };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "连接失败" };
  }
}

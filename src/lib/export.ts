// ============ Export Utilities ============

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============ Markdown Export ============

export function exportAsMarkdown(filename: string, content: string) {
  downloadFile(`${filename}.md`, content, "text/markdown;charset=utf-8");
}

// ============ Word (HTML-based .doc) Export ============

export function exportAsWord(filename: string, htmlContent: string) {
  const fullHtml = `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif; line-height: 1.8; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { font-size: 24px; color: #1a1a1a; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; }
    h2 { font-size: 18px; color: #1e40af; margin-top: 24px; }
    h3 { font-size: 15px; color: #374151; }
    table { border-collapse: collapse; width: 100%; margin: 12px 0; }
    th, td { border: 1px solid #d1d5db; padding: 8px 12px; text-align: left; }
    th { background-color: #f3f4f6; font-weight: 600; }
    .highlight { background-color: #fef3c7; padding: 2px 4px; border-radius: 3px; }
    .tag { display: inline-block; background: #eff6ff; color: #1d4ed8; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-right: 4px; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; text-align: center; }
    blockquote { border-left: 3px solid #3b82f6; padding-left: 12px; color: #6b7280; margin: 12px 0; }
    pre { background: #f9fafb; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 13px; }
  </style>
</head>
<body>
${htmlContent}
<div class="footer">由「译界 · 多语言智能聚合平台」生成 | ${new Date().toLocaleString("zh-CN")}</div>
</body>
</html>`;
  downloadFile(`${filename}.doc`, fullHtml, "application/msword;charset=utf-8");
}

// ============ TXT Export ============

export function exportAsText(filename: string, content: string) {
  downloadFile(`${filename}.txt`, content, "text/plain;charset=utf-8");
}

// ============ Specific Export Functions ============

export function exportTranslation(sourceText: string, targetText: string, sourceLang: string, targetLang: string, model: string) {
  const md = `# 翻译结果

| 项目 | 内容 |
|------|------|
| 源语言 | ${sourceLang} |
| 目标语言 | ${targetLang} |
| 翻译模型 | ${model} |
| 导出时间 | ${new Date().toLocaleString("zh-CN")} |

## 原文

${sourceText}

## 译文

${targetText}
`;
  exportAsMarkdown(`翻译_${sourceText.substring(0, 20).replace(/\s+/g, "_")}`, md);
}

export function exportTranslationAsWord(sourceText: string, targetText: string, sourceLang: string, targetLang: string, model: string) {
  const html = `
<h1>翻译结果</h1>
<table>
  <tr><th>源语言</th><td>${sourceLang}</td></tr>
  <tr><th>目标语言</th><td>${targetLang}</td></tr>
  <tr><th>翻译模型</th><td>${model}</td></tr>
  <tr><th>导出时间</th><td>${new Date().toLocaleString("zh-CN")}</td></tr>
</table>
<h2>原文</h2>
<p>${sourceText.replace(/\n/g, "<br>")}</p>
<h2>译文</h2>
<p>${targetText.replace(/\n/g, "<br>")}</p>`;
  exportAsWord(`翻译_${sourceText.substring(0, 20).replace(/\s+/g, "_")}`, html);
}

export function exportVocabulary(words: { word: string; phonetic: string; meaning: string; pos?: string; frequency?: string; status?: string }[]) {
  const md = `# 生词本

> 共 ${words.length} 个单词 | 导出时间: ${new Date().toLocaleString("zh-CN")}

| 单词 | 音标 | 词性 | 释义 | 频率 | 状态 |
|------|------|------|------|------|------|
${words.map((w) => `| ${w.word} | ${w.phonetic} | ${w.pos || "-"} | ${w.meaning} | ${w.frequency || "-"} | ${w.status || "new"} |`).join("\n")}
`;
  exportAsMarkdown(`生词本_${words.length}词`, md);
}

export function exportVocabularyAsWord(words: { word: string; phonetic: string; meaning: string; pos?: string; frequency?: string; status?: string }[]) {
  const html = `
<h1>生词本</h1>
<p>共 ${words.length} 个单词</p>
<table>
  <tr><th>单词</th><th>音标</th><th>词性</th><th>释义</th><th>频率</th><th>状态</th></tr>
  ${words.map((w) => `<tr><td>${w.word}</td><td>${w.phonetic}</td><td>${w.pos || "-"}</td><td>${w.meaning}</td><td>${w.frequency || "-"}</td><td>${w.status || "new"}</td></tr>`).join("")}
</table>`;
  exportAsWord(`生词本_${words.length}词`, html);
}

export function exportWritingAnalysis(scene: string, text: string, score: number, suggestions: string[], dimensionScores?: { grammar: number; vocabulary: number; logic: number; format: number }, polishedVersion?: string) {
  const sceneNames: Record<string, string> = {
    email: "邮件", essay: "论文", resume: "简历", creative: "创意写作", business: "商务",
    diary: "日记", book_review: "读后感", movie_review: "影评", speech: "演讲稿", application: "申请书", custom: "自定义",
  };

  let md = `# 写作分析报告

| 项目 | 内容 |
|------|------|
| 写作场景 | ${sceneNames[scene] || scene} |
| 综合评分 | ${score} 分 |
| 字数 | ${text.length} 字 |
| 导出时间 | ${new Date().toLocaleString("zh-CN")} |

## 原文

${text}
`;

  if (dimensionScores) {
    md += `
## 维度评分

| 维度 | 得分 |
|------|------|
| 语法准确性 | ${dimensionScores.grammar} |
| 词汇丰富度 | ${dimensionScores.vocabulary} |
| 逻辑连贯性 | ${dimensionScores.logic} |
| 格式规范性 | ${dimensionScores.format} |
`;
  }

  if (suggestions.length > 0) {
    md += `
## AI 建议

${suggestions.map((s, i) => `${i + 1}. ${s}`).join("\n")}
`;
  }

  if (polishedVersion) {
    md += `
## 润色版本

${polishedVersion}
`;
  }

  exportAsMarkdown(`写作分析_${scene}`, md);
}

export function exportWritingAnalysisAsWord(scene: string, text: string, score: number, suggestions: string[], dimensionScores?: { grammar: number; vocabulary: number; logic: number; format: number }, polishedVersion?: string) {
  const sceneNames: Record<string, string> = {
    email: "邮件", essay: "论文", resume: "简历", creative: "创意写作", business: "商务",
    diary: "日记", book_review: "读后感", movie_review: "影评", speech: "演讲稿", application: "申请书", custom: "自定义",
  };

  let html = `
<h1>写作分析报告</h1>
<table>
  <tr><th>写作场景</th><td>${sceneNames[scene] || scene}</td></tr>
  <tr><th>综合评分</th><td>${score} 分</td></tr>
  <tr><th>字数</th><td>${text.length} 字</td></tr>
</table>
<h2>原文</h2>
<p>${text.replace(/\n/g, "<br>")}</p>`;

  if (dimensionScores) {
    html += `
<h2>维度评分</h2>
<table>
  <tr><th>维度</th><th>得分</th></tr>
  <tr><td>语法准确性</td><td>${dimensionScores.grammar}</td></tr>
  <tr><td>词汇丰富度</td><td>${dimensionScores.vocabulary}</td></tr>
  <tr><td>逻辑连贯性</td><td>${dimensionScores.logic}</td></tr>
  <tr><td>格式规范性</td><td>${dimensionScores.format}</td></tr>
</table>`;
  }

  if (suggestions.length > 0) {
    html += `<h2>AI 建议</h2><ol>${suggestions.map((s) => `<li>${s}</li>`).join("")}</ol>`;
  }

  if (polishedVersion) {
    html += `<h2>润色版本</h2><p>${polishedVersion.replace(/\n/g, "<br>")}</p>`;
  }

  exportAsWord(`写作分析_${scene}`, html);
}

export function exportReadingAnalysis(title: string, content: string, translation: string, vocabulary: { word: string; phonetic: string; meaning: string }[], grammarPoints: { phrase: string; explanation: string }[], summary: string) {
  const md = `# 阅读分析: ${title}

> 导出时间: ${new Date().toLocaleString("zh-CN")}

## 原文

${content}

## 翻译

${translation}

## 重点词汇

| 单词 | 音标 | 释义 |
|------|------|------|
${vocabulary.map((v) => `| ${v.word} | ${v.phonetic} | ${v.meaning} |`).join("\n")}

## 语法要点

${grammarPoints.map((g) => `- **${g.phrase}**: ${g.explanation}`).join("\n")}

## 文章摘要

${summary}
`;
  exportAsMarkdown(`阅读分析_${title}`, md);
}

export function exportReadingAnalysisAsWord(title: string, content: string, translation: string, vocabulary: { word: string; phonetic: string; meaning: string }[], grammarPoints: { phrase: string; explanation: string }[], summary: string) {
  const html = `
<h1>阅读分析: ${title}</h1>
<h2>原文</h2>
<p>${content.replace(/\n/g, "<br>")}</p>
<h2>翻译</h2>
<p>${translation.replace(/\n/g, "<br>")}</p>
<h2>重点词汇</h2>
<table>
  <tr><th>单词</th><th>音标</th><th>释义</th></tr>
  ${vocabulary.map((v) => `<tr><td>${v.word}</td><td>${v.phonetic}</td><td>${v.meaning}</td></tr>`).join("")}
</table>
<h2>语法要点</h2>
<ul>${grammarPoints.map((g) => `<li><strong>${g.phrase}</strong>: ${g.explanation}</li>`).join("")}</ul>
<h2>文章摘要</h2>
<p>${summary}</p>`;
  exportAsWord(`阅读分析_${title}`, html);
}

export function exportGrammarMistakes(mistakes: { sentence: string; errorType: string; errorHighlight: string; explanation: string; mastered: boolean }[]) {
  const md = `# 语法错题本

> 共 ${mistakes.length} 条记录 | 已掌握 ${mistakes.filter((m) => m.mastered).length} 条 | 导出时间: ${new Date().toLocaleString("zh-CN")}

${mistakes.map((m, i) => `## ${i + 1}. ${m.errorType} ${m.mastered ? "✅" : "❌"}

- **句子**: ${m.sentence}
- **错误处**: ${m.errorHighlight}
- **解释**: ${m.explanation}
`).join("\n")}
`;
  exportAsMarkdown(`语法错题本_${mistakes.length}条`, md);
}

"use client";

import { useState } from "react";
import { Bookmark, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore, WordSource, SavedWord } from "@/lib/store";

interface AddToVocabularyButtonProps {
  word: string;
  phonetic?: string;
  meaning?: string;
  pos?: string;
  source: WordSource;
  fullWordData?: Partial<SavedWord>;
  variant?: "icon" | "button" | "badge";
  size?: "sm" | "default";
  onAdded?: () => void;
}

export function AddToVocabularyButton({
  word,
  phonetic = "",
  meaning = "",
  pos = "",
  source,
  fullWordData,
  variant = "icon",
  size = "default",
  onAdded,
}: AddToVocabularyButtonProps) {
  const { addWord, hasWord, removeWord } = useStore();
  const [justAdded, setJustAdded] = useState(false);
  const saved = hasWord(word);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (saved) {
      removeWord(word);
    } else {
      addWord({
        word,
        phonetic: fullWordData?.phonetic || phonetic,
        meaning: fullWordData?.meaning || meaning,
        pos: fullWordData?.pos || pos,
        source,
        frequency: fullWordData?.frequency,
        etymology: fullWordData?.etymology,
        collocations: fullWordData?.collocations,
        inflections: fullWordData?.inflections,
        examples: fullWordData?.examples,
        synonyms: fullWordData?.synonyms,
        antonyms: fullWordData?.antonyms,
      });
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
      onAdded?.();
    }
  };

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${saved ? "text-blue-600" : "text-gray-400 hover:text-blue-600"}`}
        onClick={handleClick}
        title={saved ? "从生词本移除" : "添加到生词本"}
      >
        {justAdded ? <Check className="w-4 h-4 text-green-500" /> : <Bookmark className={`w-4 h-4 ${saved ? "fill-current" : ""}`} />}
      </Button>
    );
  }

  if (variant === "badge") {
    return (
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors ${
          saved ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
        }`}
      >
        {justAdded ? <Check className="w-3 h-3" /> : saved ? <Bookmark className="w-3 h-3 fill-current" /> : <Plus className="w-3 h-3" />}
        {saved ? "已收藏" : "加入生词本"}
      </button>
    );
  }

  return (
    <Button
      variant={saved ? "secondary" : "outline"}
      size={size === "sm" ? "sm" : "default"}
      className={`gap-1.5 ${saved ? "text-blue-600" : ""}`}
      onClick={handleClick}
    >
      {justAdded ? <Check className="w-3.5 h-3.5 text-green-500" /> : saved ? <Bookmark className="w-3.5 h-3.5 fill-current" /> : <Plus className="w-3.5 h-3.5" />}
      {saved ? "已收藏" : "加入生词本"}
    </Button>
  );
}

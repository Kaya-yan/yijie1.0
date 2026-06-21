import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = "加载中..." }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
        <span className="text-sm font-pixel-body" style={{ color: "var(--pixel-text-light)" }}>{message}</span>
      </div>
    </div>
  );
}

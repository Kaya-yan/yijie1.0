import { AlertCircle } from "lucide-react";

interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-red-500">
      <AlertCircle className="w-4 h-4" />
      <span className="text-sm">{message}</span>
    </div>
  );
}

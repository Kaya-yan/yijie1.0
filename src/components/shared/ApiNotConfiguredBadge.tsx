import { AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ApiNotConfiguredBadgeProps {
  message?: string;
}

export function ApiNotConfiguredBadge({ message = "未配置 API，使用本地数据" }: ApiNotConfiguredBadgeProps) {
  return (
    <div className="mt-8 text-center">
      <Badge variant="secondary" className="bg-amber-50 text-amber-700">
        <AlertCircle className="w-3 h-3 mr-1" />
        {message}
      </Badge>
    </div>
  );
}

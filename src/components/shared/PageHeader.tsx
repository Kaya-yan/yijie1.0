import { LucideIcon } from "lucide-react";

const colorMap: Record<string, { bg: string; text: string }> = {
  blue: { bg: "bg-blue-50", text: "text-blue-600" },
  amber: { bg: "bg-amber-50", text: "text-amber-600" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
  rose: { bg: "bg-rose-50", text: "text-rose-600" },
  purple: { bg: "bg-purple-50", text: "text-purple-600" },
  gray: { bg: "bg-gray-100", text: "text-gray-600" },
};

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  color?: string;
}

export function PageHeader({ icon: Icon, title, subtitle, color = "blue" }: PageHeaderProps) {
  const colors = colorMap[color] || colorMap.blue;
  return (
    <div className="text-center mb-8">
      <div className={`w-14 h-14 ${colors.bg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
        <Icon className={`w-7 h-7 ${colors.text}`} />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">{title}</h1>
      <p className="text-gray-500">{subtitle}</p>
    </div>
  );
}

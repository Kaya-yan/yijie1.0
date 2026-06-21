import { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  color?: string;
}

export function PageHeader({ icon: Icon, title, subtitle }: PageHeaderProps) {
  return (
    <div className="text-center mb-8">
      <div className="w-14 h-14 flex items-center justify-center mx-auto mb-4 pixel-border" style={{ background: "var(--pixel-blue)" }}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      <h1 className="text-3xl font-bold mb-2 tracking-tight" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "clamp(12px, 3vw, 18px)", color: "var(--pixel-text)", lineHeight: "2" }}>{title}</h1>
      <p style={{ fontFamily: "'VT323', monospace", fontSize: "20px", color: "var(--pixel-text-light)" }}>{subtitle}</p>
    </div>
  );
}

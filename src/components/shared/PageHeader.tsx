interface PageHeaderProps {
  icon: React.ComponentType<any>;
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
      <h1 className="font-pixel-title" style={{ color: "var(--pixel-text)" }}>{title}</h1>
      <p className="font-pixel-body" style={{ color: "var(--pixel-text-light)" }}>{subtitle}</p>
    </div>
  );
}

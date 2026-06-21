"use client";

import { useState } from "react";
import { Download, FileText, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ExportOption {
  label: string;
  format: string;
  icon: typeof FileText;
  action: () => void;
}

interface ExportButtonProps {
  options: ExportOption[];
  variant?: "icon" | "button";
  size?: "sm" | "default";
  label?: string;
}

export function ExportButton({ options, variant = "button", size = "sm", label = "导出" }: ExportButtonProps) {
  const [open, setOpen] = useState(false);

  if (variant === "icon") {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className="inline-flex items-center justify-center h-8 w-8 text-pixel-text-muted hover:text-blue-600 rounded-md transition-colors cursor-pointer"
          title={label}
        >
          <Download className="w-4 h-4" />
        </PopoverTrigger>
        <PopoverContent className="w-40 p-1" align="end">
          {options.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.format}
                onClick={() => { opt.action(); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-pixel-text hover:bg-gray-100 rounded-md transition-colors"
              >
                <Icon className="w-4 h-4 text-pixel-text-muted" />
                {opt.label}
              </button>
            );
          })}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="inline-flex items-center justify-center gap-1.5 h-9 px-3 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors cursor-pointer text-sm font-medium">
        <Download className="w-3.5 h-3.5" />
        {label}
      </PopoverTrigger>
      <PopoverContent className="w-40 p-1" align="end">
        {options.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.format}
              onClick={() => { opt.action(); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-pixel-text hover:bg-gray-100 rounded-md transition-colors"
            >
              <Icon className="w-4 h-4 text-pixel-text-muted" />
              {opt.label}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

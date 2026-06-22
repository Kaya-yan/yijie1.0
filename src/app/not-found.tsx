"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center pixel-grid" style={{ background: "var(--pixel-bg)" }}>
      <div className="text-center page-enter">
        {/* Pixel art 404 */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="font-pixel text-6xl" style={{ color: "var(--pixel-blue)" }}>4</span>
          <Icon
            icon="game-icons:crystal-shine"
            width="64"
            height="64"
            className="animate-float"
            style={{ color: "var(--pixel-yellow)" }}
          />
          <span className="font-pixel text-6xl" style={{ color: "var(--pixel-blue)" }}>4</span>
        </div>

        <h1 className="font-pixel-heading mb-3" style={{ color: "var(--pixel-text)" }}>
          PAGE NOT FOUND
        </h1>
        <p className="font-pixel-body text-lg mb-8" style={{ color: "var(--pixel-text-light)" }}>
          你走到了未知的地图区域...
        </p>

        {/* Decorative game icons */}
        <div className="flex items-center justify-center gap-4 mb-8 opacity-30">
          <Icon icon="game-icons:crossed-swords" width="24" height="24" style={{ color: "var(--pixel-text-muted)" }} />
          <Icon icon="game-icons:question-mark" width="24" height="24" style={{ color: "var(--pixel-text-muted)" }} />
          <Icon icon="game-icons:treasure-map" width="24" height="24" style={{ color: "var(--pixel-text-muted)" }} />
        </div>

        <Link href="/dashboard">
          <Button className="pixel-btn gap-2">
            <span className="font-pixel" style={{ fontSize: "10px" }}>RETURN</span>
          </Button>
        </Link>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-4 left-4 w-4 h-4" style={{ background: "var(--pixel-border)" }} />
      <div className="absolute top-4 right-4 w-4 h-4" style={{ background: "var(--pixel-border)" }} />
      <div className="absolute bottom-4 left-4 w-4 h-4" style={{ background: "var(--pixel-border)" }} />
      <div className="absolute bottom-4 right-4 w-4 h-4" style={{ background: "var(--pixel-border)" }} />
    </div>
  );
}

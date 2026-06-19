"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

export function useAuth() {
  const router = useRouter();
  const models = useStore((s) => s.models);
  const isConfigured = models.some((m) => m.enabled && m.apiKey);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("auth") !== "true") {
      router.push("/");
    }
  }, [router]);

  return { isConfigured };
}

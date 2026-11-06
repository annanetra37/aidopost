"use client";
import { useEffect } from "react";
import { initAnalytics } from "@/lib/analytics";

export function Analytics() {
  useEffect(() => {
    const start = () => {
      try {
        if (localStorage.getItem("cookie-consent") === "all") initAnalytics();
      } catch {}
    };
    start();
    window.addEventListener("cookie-consent", start);
    return () => window.removeEventListener("cookie-consent", start);
  }, []);
  return null;
}

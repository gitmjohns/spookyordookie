"use client";

import { useEffect } from "react";

export function ScrollReset() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, []);
  return null;
}

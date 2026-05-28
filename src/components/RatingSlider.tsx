"use client";

import { useState, useTransition, useCallback, useEffect, useRef } from "react";
import * as Slider from "@radix-ui/react-slider";
import { getRatingLabel, getRatingColor } from "@/lib/utils";

interface RatingSliderProps {
  titleId: string;
  initialScore: number | null;
  disabled?: boolean;
}

export function RatingSlider({ titleId, initialScore, disabled = false }: RatingSliderProps) {
  const [score, setScore] = useState(initialScore ?? 50);
  const [isDragging, setIsDragging] = useState(false);
  const [saved, setSaved] = useState(!!initialScore);
  const [unlocked, setUnlocked] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Score reveal animation state
  const [revealed, setRevealed] = useState(!!initialScore);
  const [displayCount, setDisplayCount] = useState(initialScore ?? 0);
  const [animating, setAnimating] = useState(false);
  const [submissionCount, setSubmissionCount] = useState(0);
  const submittedScoreRef = useRef(0);

  const color = getRatingColor(score);
  const label = getRatingLabel(score);
  const isLocked = saved && !unlocked;

  const handleCommit = useCallback(([v]: number[]) => {
    setScore(v);
    setIsDragging(false);
  }, []);

  const handleChange = useCallback(([v]: number[]) => {
    setScore(v);
    setIsDragging(true);
  }, []);

  function handleSubmit() {
    startTransition(async () => {
      const res = await fetch("/api/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ titleId, score }),
      });
      if (!res.ok) return;
      submittedScoreRef.current = score;
      setSaved(true);
      setUnlocked(false);
      setRevealed(false);
      setDisplayCount(0);
      setSubmissionCount(c => c + 1);
    });
  }

  useEffect(() => {
    if (submissionCount === 0) return;

    const target = submittedScoreRef.current;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAnimating(true);
    let step = 0;
    const steps = 20;
    const stepTime = 50;

    const timer = setInterval(() => {
      step++;
      const current = Math.round(target * Math.min(step / steps, 1));
      setDisplayCount(current);
      if (step >= steps) {
        clearInterval(timer);
        setDisplayCount(target);
        setRevealed(true);
        setAnimating(false);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [submissionCount]);

  // ── Disabled / preview state (logged-out teaser) ──────────────────────────

  if (disabled) {
    const previewScore = 50;
    const previewColor = getRatingColor(previewScore);
    const previewLabel = getRatingLabel(previewScore);

    return (
      <div className="space-y-4 pointer-events-none select-none">
        <div
          className="relative rounded-2xl border-2 p-6 text-center overflow-hidden"
          style={{ borderColor: previewColor, background: `${previewColor}10` }}
        >
          <div className="font-display text-4xl sm:text-5xl leading-tight" style={{ color: previewColor }}>
            {previewLabel}
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-3 sm:px-1">
          <span className="text-2xl sm:text-4xl">☠</span>
          <div className="flex-1">
            <Slider.Root
              min={1}
              max={100}
              step={1}
              value={[previewScore]}
              disabled
              className="relative flex items-center select-none touch-none w-full h-10"
            >
              <Slider.Track className="rating-track relative grow rounded-full h-4 shadow-inner">
                <Slider.Range className="absolute h-full rounded-full opacity-0" />
              </Slider.Track>
              <Slider.Thumb
                className="flex items-center justify-center w-9 h-9 rounded-full shadow-xl border-2 border-void text-base leading-none"
                style={{ backgroundColor: previewColor }}
                aria-label="Rating"
              >
                ✖
              </Slider.Thumb>
            </Slider.Root>
            <div className="flex justify-between px-3 mt-1">
              {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((n) => (
                <div
                  key={n}
                  className="w-0.5 h-2 rounded-full"
                  style={{ backgroundColor: n <= previewScore ? previewColor : "#333333" }}
                />
              ))}
            </div>
          </div>
          <span className="text-2xl sm:text-4xl">🩶</span>
        </div>

        <div className="flex justify-between px-7 sm:px-12 text-sm font-bold">
          <span style={{ color: "#cc0000", fontFamily: "var(--font-inter)" }}>Terrible</span>
          <span style={{ color: "#ffffff", fontFamily: "var(--font-inter)" }}>Terrifying</span>
        </div>
      </div>
    );
  }

  // ── Locked (submitted) state ──────────────────────────────────────────────

  if (isLocked) {
    const revealColor = getRatingColor(score);
    const revealLabel = getRatingLabel(score);

    return (
      <div className="space-y-4 rating-enter">
        <div
          className="relative rounded-2xl border-2 p-8 text-center overflow-hidden transition-all duration-300"
          style={{ borderColor: revealColor, background: `${revealColor}12` }}
        >
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{ background: `radial-gradient(circle at 50% 100%, ${revealColor}, transparent 70%)` }}
          />

          <div className="relative z-10">
            <div
              className="font-display text-5xl sm:text-6xl leading-tight"
              style={{ color: revealColor }}
            >
              {revealLabel}
            </div>

            {(animating || revealed) && (
              <div
                className="font-score text-3xl sm:text-4xl font-bold leading-none mt-3 tabular-nums"
                style={{
                  color: revealColor,
                  opacity: animating ? 0.85 : 1,
                  transition: "opacity 0.2s ease",
                }}
              >
                {displayCount}
                <span className="text-lg font-normal opacity-60">/100</span>
              </div>
            )}
          </div>

          {animating && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div
                className="w-32 h-32 rounded-full animate-ping opacity-10"
                style={{ backgroundColor: revealColor }}
              />
            </div>
          )}
        </div>

        {!animating && (
          <div className="flex justify-center mt-3">
            <button
              onClick={() => setUnlocked(true)}
              className="text-sm font-bold text-muted hover:text-specter transition-colors underline underline-offset-2"
            >
              Changed Your Mind? Update Your Verdict
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Interactive (unlocked) state ──────────────────────────────────────────

  return (
    <div className="space-y-4 rating-enter">
      <div
        className="relative rounded-2xl border-2 p-6 text-center overflow-hidden transition-colors duration-200"
        style={{ borderColor: color, background: `${color}10` }}
      >
        <div className="font-display text-4xl sm:text-5xl leading-tight" style={{ color }}>
          {label}
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-3 sm:px-1">
        <span className="text-2xl sm:text-4xl select-none" title="Terrible">☠</span>

        <div className="flex-1">
          <Slider.Root
            min={1}
            max={100}
            step={1}
            value={[score]}
            onValueChange={handleChange}
            onValueCommit={handleCommit}
            className="relative flex items-center select-none touch-none w-full h-10"
          >
            <Slider.Track className="rating-track relative grow rounded-full h-4 cursor-pointer shadow-inner">
              <Slider.Range className="absolute h-full rounded-full opacity-0" />
            </Slider.Track>
            <Slider.Thumb
              className="flex items-center justify-center w-9 h-9 rounded-full shadow-xl border-2 border-void cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-void transition-transform duration-100 active:scale-125 select-none text-base leading-none"
              style={{ backgroundColor: color, boxShadow: `0 0 20px ${color}80` }}
              aria-label="Rating"
              onFocus={(e) => {
                if (!e.relatedTarget) e.currentTarget.blur();
              }}
            >
              ✖
            </Slider.Thumb>
          </Slider.Root>

          <div className="flex justify-between px-3 mt-1">
            {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((n) => (
              <div
                key={n}
                className="w-0.5 h-2 rounded-full transition-colors duration-200"
                style={{ backgroundColor: n <= score ? color : "#333333" }}
              />
            ))}
          </div>
        </div>

        <span className="text-2xl sm:text-4xl select-none" title="Terrifying">🩶</span>
      </div>

      <div className="flex justify-between px-7 sm:px-12 text-sm font-bold">
        <span style={{ color: "#cc0000", fontFamily: "var(--font-inter)" }}>Terrible</span>
        <span style={{ color: "#ffffff", fontFamily: "var(--font-inter)" }}>Terrifying</span>
      </div>

      <div className="flex justify-center pt-2">
        <button
          onClick={handleSubmit}
          disabled={isPending || isDragging}
          className="px-10 py-3 rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-50 active:scale-95 shadow-lg"
          style={{
            backgroundColor: "#cc0000",
            color: "#ffffff",
            boxShadow: "0 4px 20px rgba(204,0,0,0.4)",
            minWidth: "160px",
          }}
        >
          {isPending ? "Saving…" : unlocked ? "Update Verdict" : "Submit Verdict"}
        </button>
      </div>
    </div>
  );
}

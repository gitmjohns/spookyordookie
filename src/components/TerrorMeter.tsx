"use client";

import { useState, useTransition, useCallback, useEffect, useRef } from "react";

interface TerrorMeterProps {
  titleId: string;
  initialScore: number | null;
  disabled?: boolean;
}

function getVerdict(score: number): { label: string; color: string } {
  if (score >= 90) return { label: "Truly Terrifying", color: "#22c55e" };
  if (score >= 75) return { label: "Pretty Scary", color: "#22c55e" };
  if (score >= 60) return { label: "Kinda Creepy", color: "#22c55e" };
  if (score >= 45) return { label: "Meh-diocre", color: "#d4a017" };
  if (score >= 30) return { label: "Kinda Bad", color: "#d4a017" };
  if (score >= 15) return { label: "Pretty Awful", color: "#cc0000" };
  return { label: "Truly Terrible", color: "#cc0000" };
}

function getZoneColor(score: number): string {
  if (score >= 60) return "#22c55e";
  if (score >= 30) return "#d4a017";
  return "#cc0000";
}

function drawGauge(canvas: HTMLCanvasElement, score: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const CX = 170;
  const CY = 260;
  const R = 120;
  const START = Math.PI;
  const END = 0;

  // Background arc
  ctx.beginPath();
  ctx.arc(CX, CY, R, START, END);
  ctx.strokeStyle = "#1a1a1a";
  ctx.lineWidth = 18;
  ctx.lineCap = "round";
  ctx.stroke();

  // Gradient filled arc
  const grad = ctx.createLinearGradient(CX - R, 0, CX + R, 0);
  grad.addColorStop(0, "#cc0000");
  grad.addColorStop(0.5, "#d4a017");
  grad.addColorStop(1, "#22c55e");

  const fillEnd = START + (Math.PI * score) / 100;
  if (score > 0) {
    ctx.beginPath();
    ctx.arc(CX, CY, R, START, fillEnd);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 18;
    ctx.lineCap = "round";
    ctx.stroke();
  }

  // Skull emoji at left end
  ctx.font = "18px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("💀", CX - R - 18, CY);

  // Heart emoji at right end
  ctx.fillText("🩶", CX + R + 18, CY);
}

function drawSubmittedGauge(canvas: HTMLCanvasElement, score: number, displayCount: number, animating: boolean) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const CX = 170;
  const CY = 260;
  const R = 120;
  const START = Math.PI;
  const END = 0;

  // Background arc
  ctx.beginPath();
  ctx.arc(CX, CY, R, START, END);
  ctx.strokeStyle = "#1a1a1a";
  ctx.lineWidth = 18;
  ctx.lineCap = "round";
  ctx.stroke();

  // Filled arc up to score
  const grad = ctx.createLinearGradient(CX - R, 0, CX + R, 0);
  grad.addColorStop(0, "#cc0000");
  grad.addColorStop(0.5, "#d4a017");
  grad.addColorStop(1, "#22c55e");

  const fillEnd = START + (Math.PI * score) / 100;
  if (score > 0) {
    ctx.beginPath();
    ctx.arc(CX, CY, R, START, fillEnd);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 18;
    ctx.lineCap = "round";
    ctx.stroke();
  }

  // Score count in center of arc
  const scoreColor = getZoneColor(score);
  const fontSize = 52;
  ctx.font = `700 ${fontSize}px var(--font-oswald, 'Oswald', sans-serif)`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = animating ? scoreColor + "cc" : scoreColor;
  ctx.fillText(String(displayCount), CX, CY - 38);

  ctx.font = `400 16px var(--font-oswald, 'Oswald', sans-serif)`;
  ctx.fillStyle = scoreColor + "99";
  ctx.fillText("/100", CX, CY - 10);

  // Emojis
  ctx.font = "18px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("💀", CX - R - 18, CY);
  ctx.fillText("🩶", CX + R + 18, CY);
}

const SCREW_POSITIONS = [
  { top: 8, left: 8 },
  { top: 8, right: 8 },
  { bottom: 8, left: 8 },
  { bottom: 8, right: 8 },
] as const;

export function TerrorMeter({ titleId, initialScore, disabled = false }: TerrorMeterProps) {
  const [score, setScore] = useState(initialScore ?? 45);
  const [submitted, setSubmitted] = useState(!!initialScore);
  const [unlocked, setUnlocked] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [displayCount, setDisplayCount] = useState(initialScore ?? 0);
  const [animating, setAnimating] = useState(false);
  const [submissionCount, setSubmissionCount] = useState(0);
  const submittedScoreRef = useRef(initialScore ?? 0);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isLocked = submitted && !unlocked;
  const verdict = getVerdict(score);
  const zoneColor = getZoneColor(score);

  const redActive = score <= 44;
  const orangeActive = score >= 30 && score <= 74;
  const greenActive = score >= 60;

  // Draw gauge on canvas whenever score or locked state changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (isLocked) {
      drawSubmittedGauge(canvas, submittedScoreRef.current, displayCount, animating);
    } else {
      drawGauge(canvas, score);
    }
  }, [score, isLocked, displayCount, animating]);

  // Count-up animation after submission
  useEffect(() => {
    if (submissionCount === 0) return;
    const target = submittedScoreRef.current;
    setAnimating(true);
    let step = 0;
    const steps = 20;
    const timer = setInterval(() => {
      step++;
      setDisplayCount(Math.round(target * Math.min(step / steps, 1)));
      if (step >= steps) {
        clearInterval(timer);
        setDisplayCount(target);
        setAnimating(false);
      }
    }, 50);
    return () => clearInterval(timer);
  }, [submissionCount]);

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
      setSubmitted(true);
      setUnlocked(false);
      setDisplayCount(0);
      setSubmissionCount((c) => c + 1);
    });
  }

  const panelStyle: React.CSSProperties = {
    background: "linear-gradient(180deg, #3a3a3a 0%, #2a2a2a 40%, #1e1e1e 60%, #2a2a2a 100%)",
    border: "2px solid #555",
    borderRadius: 8,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.6)",
    position: "relative",
  };

  const screwStyle: React.CSSProperties = {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "radial-gradient(circle at 30% 30%, #666, #333)",
    border: "1px solid #222",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", maxWidth: 400, margin: "0 auto", width: "100%" }}>
      {/* Titles */}
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <p style={{
          fontFamily: "var(--font-oswald, 'Oswald', sans-serif)",
          fontSize: 11,
          fontWeight: 300,
          letterSpacing: 4,
          textTransform: "uppercase",
          color: "#888",
          marginBottom: 2,
        }}>
          Rate this title
        </p>
        <p style={{
          fontFamily: "var(--font-creepster, 'Creepster', cursive)",
          fontSize: 44,
          color: "#ffffff",
          letterSpacing: 3,
          lineHeight: 1,
          margin: 0,
        }}>
          TERRORMETER
        </p>
      </div>

      {/* Metal panel */}
      <div style={{ ...panelStyle, width: "100%" }}>
        {/* Corner screws */}
        {SCREW_POSITIONS.map((pos, i) => (
          <div key={i} style={{ ...screwStyle, ...pos }} />
        ))}

        {/* Canvas gauge */}
        <div style={{ position: "relative", width: "100%", paddingTop: "47%", overflow: "visible" }}>
          <canvas
            ref={canvasRef}
            width={340}
            height={280}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "auto",
            }}
          />
        </div>

        {/* Lights + verdict — hidden when locked */}
        {!isLocked && (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            paddingBottom: 12,
            paddingTop: 4,
          }}>
            {/* Red light */}
            <div style={{
              width: 11,
              height: 11,
              borderRadius: "50%",
              backgroundColor: "#cc0000",
              boxShadow: redActive ? "0 0 8px 3px #cc000099" : "none",
              opacity: redActive ? 1 : 0.3,
              transition: "all 0.15s ease",
            }} />
            {/* Orange light */}
            <div style={{
              width: 11,
              height: 11,
              borderRadius: "50%",
              backgroundColor: "#d4a017",
              boxShadow: orangeActive ? "0 0 8px 3px #d4a01799" : "none",
              opacity: orangeActive ? 1 : 0.3,
              transition: "all 0.15s ease",
            }} />
            {/* Green light */}
            <div style={{
              width: 11,
              height: 11,
              borderRadius: "50%",
              backgroundColor: "#22c55e",
              boxShadow: greenActive ? "0 0 8px 3px #22c55e99" : "none",
              opacity: greenActive ? 1 : 0.3,
              transition: "all 0.15s ease",
            }} />

            {/* Verdict text */}
            <span style={{
              fontFamily: "var(--font-oswald, 'Oswald', sans-serif)",
              fontWeight: 700,
              fontSize: "clamp(11px, 3.25vw, 13px)",
              textTransform: "uppercase",
              letterSpacing: 1,
              color: verdict.color,
              whiteSpace: "nowrap",
              transition: "color 0.15s ease",
            }}>
              {verdict.label}
            </span>
          </div>
        )}

        {/* Slider + submit — bottom section */}
        <div style={{ borderTop: "1px solid #333", padding: "14px 20px 16px" }}>
          {!isLocked ? (
            <>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={score}
                disabled={disabled}
                onChange={(e) => setScore(Number(e.target.value))}
                style={{
                  width: "100%",
                  accentColor: zoneColor,
                  cursor: disabled ? "not-allowed" : "pointer",
                  marginBottom: 12,
                  display: "block",
                }}
              />
              {!disabled && (
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <button
                    onClick={handleSubmit}
                    disabled={isPending}
                    style={{
                      fontFamily: "var(--font-oswald, 'Oswald', sans-serif)",
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: 2,
                      textTransform: "uppercase",
                      backgroundColor: zoneColor,
                      color: "#ffffff",
                      border: "none",
                      borderRadius: 6,
                      padding: "8px 28px",
                      cursor: isPending ? "not-allowed" : "pointer",
                      opacity: isPending ? 0.6 : 1,
                      transition: "all 0.15s ease",
                    }}
                  >
                    {isPending ? "Saving…" : unlocked ? "Update Verdict" : "Submit Verdict"}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "4px 0" }}>
              <span style={{
                fontFamily: "var(--font-oswald, 'Oswald', sans-serif)",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: "#888",
              }}>
                {animating ? "Saving verdict…" : "Verdict Submitted"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Change verdict link — shown after submission */}
      {isLocked && !animating && (
        <button
          onClick={() => setUnlocked(true)}
          style={{
            fontFamily: "var(--font-oswald, 'Oswald', sans-serif)",
            fontSize: 11,
            fontWeight: 400,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: "#888",
            textDecoration: "underline",
            textUnderlineOffset: 3,
            background: "none",
            border: "none",
            cursor: "pointer",
            marginTop: 10,
          }}
        >
          Changed your mind? Update your verdict
        </button>
      )}
    </div>
  );
}

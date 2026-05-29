"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface TerrorMeterProps {
  titleId: string;
  initialScore: number | null;
  disabled?: boolean;
}

const VERDICTS = [
  { min: 0,  max: 14,  label: "Truly Terrible",   color: "#cc0000" },
  { min: 15, max: 29,  label: "Pretty Awful",      color: "#cc0000" },
  { min: 30, max: 44,  label: "Kinda Bad",         color: "#d4a017" },
  { min: 45, max: 59,  label: "Meh-diocre",        color: "#d4a017" },
  { min: 60, max: 74,  label: "Kinda Creepy",      color: "#22c55e" },
  { min: 75, max: 89,  label: "Pretty Scary",      color: "#22c55e" },
  { min: 90, max: 100, label: "Truly Terrifying",  color: "#22c55e" },
];

function getZoneColor(val: number): string {
  if (val <= 44) return "#cc0000";
  if (val <= 74) return "#d4a017";
  return "#22c55e";
}

function getVerdict(val: number) {
  return VERDICTS.find((v) => val >= v.min && val <= v.max) ?? VERDICTS[3];
}

function drawArc(canvas: HTMLCanvasElement, val: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const CX = 170, CY = 260, R = 120;
  ctx.clearRect(0, 0, 340, 280);

  ctx.beginPath();
  ctx.arc(CX, CY, R, Math.PI, 0, false);
  ctx.strokeStyle = "#1a1a1a";
  ctx.lineWidth = 18;
  ctx.lineCap = "round";
  ctx.stroke();

  if (val > 0) {
    const end = Math.PI + (val / 100) * Math.PI;
    const gr = ctx.createLinearGradient(CX - R, CY, CX + R, CY);
    gr.addColorStop(0, "#cc0000");
    gr.addColorStop(0.5, "#d4a017");
    gr.addColorStop(1, "#22c55e");
    ctx.beginPath();
    ctx.arc(CX, CY, R, Math.PI, end, false);
    ctx.strokeStyle = gr;
    ctx.lineWidth = 18;
    ctx.lineCap = "round";
    ctx.stroke();
  }

  ctx.font = "20px serif";
  ctx.textAlign = "center";
  ctx.fillText("💀", CX - R - 28, CY + 4);
  ctx.fillText("🩶", CX + R + 28, CY + 4);
}

export function TerrorMeter({ titleId, initialScore, disabled = false }: TerrorMeterProps) {
  const [score, setScore] = useState(initialScore ?? 45);
  const [submitted, setSubmitted] = useState(initialScore !== null);
  const [displayCount, setDisplayCount] = useState(initialScore ?? 0);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [isPending, startTransition] = useTransition();

  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const submittedScoreRef = useRef(initialScore ?? 0);

  const verdict = getVerdict(score);
  const zoneColor = getZoneColor(score);
  const redOn = score <= 44;
  const orangeOn = score >= 30 && score <= 74;
  const greenOn = score >= 60;

  useEffect(() => {
    if (canvasRef.current) {
      drawArc(canvasRef.current, submitted ? submittedScoreRef.current : score);
    }
  }, [score, submitted]);

  useEffect(() => {
    if (submissionCount === 0) return;
    const val = submittedScoreRef.current;
    setDisplayCount(0);
    let c = 0;
    const iv = setInterval(() => {
      c = Math.min(c + Math.ceil(val / 20), val);
      setDisplayCount(c);
      if (c >= val) clearInterval(iv);
    }, 40);
    return () => clearInterval(iv);
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
      setSubmissionCount((c) => c + 1);
      router.refresh();
    });
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 12,
      width: "100%",
      maxWidth: 400,
      margin: "0 auto",
    }}>

      <div style={{
        fontFamily: "var(--font-label, 'Oswald', sans-serif)",
        fontSize: 11,
        fontWeight: 400,
        letterSpacing: 4,
        textTransform: "uppercase",
        color: "#888",
        textAlign: "center",
      }}>
        Rate this title
      </div>

      <div style={{
        fontFamily: "var(--font-creepster, 'Creepster', cursive)",
        fontSize: 44,
        color: "#ffffff",
        letterSpacing: 3,
        textAlign: "center",
        lineHeight: 1,
      }}>
        TERRORMETER
      </div>

      {/* Metal panel */}
      <div style={{
        width: "100%",
        maxWidth: 360,
        background: "linear-gradient(180deg, #3a3a3a 0%, #2a2a2a 40%, #1e1e1e 60%, #2a2a2a 100%)",
        border: "2px solid #555",
        borderRadius: 8,
        padding: "16px 16px 12px",
        position: "relative",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.6)",
      }}>

        {/* Screws */}
        <div style={{ position: "absolute", top: 8,    left: 8,  width: 10, height: 10, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, #666, #333)", border: "1px solid #222" }} />
        <div style={{ position: "absolute", top: 8,    right: 8, width: 10, height: 10, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, #666, #333)", border: "1px solid #222" }} />
        <div style={{ position: "absolute", bottom: 8, left: 8,  width: 10, height: 10, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, #666, #333)", border: "1px solid #222" }} />
        <div style={{ position: "absolute", bottom: 8, right: 8, width: 10, height: 10, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, #666, #333)", border: "1px solid #222" }} />

        {/* Gauge */}
        <div style={{ position: "relative", width: "100%", paddingTop: "47%", overflow: "hidden" }}>

          {/* Canvas wrapper */}
          <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}>
            <canvas
              ref={canvasRef}
              width={340}
              height={280}
              style={{ width: "100%", height: "auto", display: "block", marginTop: "-35.3%" }}
            />
          </div>

          {/* Center overlay: lights+verdict OR score */}
          <div style={{
            position: "absolute",
            bottom: "5%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "55%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
          }}>
            {!submitted ? (
              <div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 6 }}>
                  <div style={{
                    width: 11, height: 11, borderRadius: "50%",
                    border: `1.5px solid ${redOn ? "#ff6666" : "#222"}`,
                    background: redOn ? "#cc0000" : "#111",
                    boxShadow: redOn ? "0 0 6px #cc0000" : "none",
                    transition: "all 0.2s",
                  }} />
                  <div style={{
                    width: 11, height: 11, borderRadius: "50%",
                    border: `1.5px solid ${orangeOn ? "#ffcc44" : "#222"}`,
                    background: orangeOn ? "#d4a017" : "#111",
                    boxShadow: orangeOn ? "0 0 6px #d4a017" : "none",
                    transition: "all 0.2s",
                  }} />
                  <div style={{
                    width: 11, height: 11, borderRadius: "50%",
                    border: `1.5px solid ${greenOn ? "#66ffaa" : "#222"}`,
                    background: greenOn ? "#22c55e" : "#111",
                    boxShadow: greenOn ? "0 0 6px #22c55e" : "none",
                    transition: "all 0.2s",
                  }} />
                </div>
                <div style={{
                  fontFamily: "var(--font-label, 'Oswald', sans-serif)",
                  fontSize: "clamp(11px, 3vw, 15px)",
                  fontWeight: 700,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  textAlign: "center",
                  minHeight: 18,
                  whiteSpace: "nowrap",
                  color: verdict.color,
                  transition: "color 0.2s",
                }}>
                  {verdict.label}
                </div>
              </div>
            ) : (
              <div style={{
                fontFamily: "var(--font-score, 'Oswald', sans-serif)",
                fontSize: "clamp(24px, 8vw, 40px)",
                fontWeight: 700,
                textAlign: "center",
                color: getZoneColor(submittedScoreRef.current),
              }}>
                {displayCount}/100
              </div>
            )}
          </div>
        </div>

        {/* Panel bottom: slider + button */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          marginTop: 4,
          paddingTop: 8,
          borderTop: "1px solid #333",
        }}>
          <div style={{ width: "85%" }}>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={score}
              disabled={submitted || disabled}
              onChange={(e) => setScore(Number(e.target.value))}
              style={{ width: "100%", accentColor: zoneColor }}
            />
          </div>
          {!disabled && (
            <button
              onClick={handleSubmit}
              disabled={submitted || isPending}
              style={{
                fontFamily: "var(--font-oswald, 'Oswald', sans-serif)",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: 2,
                textTransform: "uppercase",
                padding: "7px 20px",
                color: "#fff",
                border: "none",
                cursor: submitted || isPending ? "default" : "pointer",
                borderRadius: 2,
                boxShadow: submitted || isPending ? "none" : "0 2px 4px rgba(0,0,0,0.4)",
                background: submitted || isPending ? "#333" : zoneColor,
                transition: "background 0.3s",
              }}
            >
              {submitted ? "Verdict Submitted" : isPending ? "Saving…" : "Submit Verdict"}
            </button>
          )}
        </div>
      </div>

      {/* Change verdict link */}
      {submitted && (
        <button
          onClick={() => setSubmitted(false)}
          style={{
            fontFamily: "var(--font-oswald, 'Oswald', sans-serif)",
            fontSize: 11,
            fontWeight: 400,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: "#888",
            textDecoration: "underline",
            opacity: 0.6,
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
        >
          Changed your mind? Update your verdict
        </button>
      )}
    </div>
  );
}

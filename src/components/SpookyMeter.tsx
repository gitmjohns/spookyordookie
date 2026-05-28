import { getRatingLabel, getRatingColor, tieredCombinedScore } from "@/lib/utils";

interface SpookyMeterProps {
  criticScore: number;
  avg: number;
  count: number;
}

export function SpookyMeter({ criticScore, avg, count }: SpookyMeterProps) {
  const overallScore = tieredCombinedScore(criticScore, avg, count);
  const displayScore = overallScore / 10;
  const color = getRatingColor(overallScore);
  const label = getRatingLabel(overallScore);

  return (
    <div className="space-y-4">
      {/* Overall verdict — label + score, no bar */}
      <div className="text-center">
        <div className="font-display text-4xl sm:text-5xl leading-tight" style={{ color }}>
          {label}
        </div>
        <div
          className="text-6xl sm:text-7xl font-black mt-1 leading-none"
          style={{ color }}
        >
          {displayScore.toFixed(1)}
        </div>
        <div className="text-muted text-xs mt-1">Overall score</div>
      </div>

      {/* Critic / Fan breakdown */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="bg-shadow rounded-xl px-3 py-3 text-center">
          <div className="text-xs text-muted uppercase tracking-wider mb-1">Critic Score</div>
          <div
            className="font-bold text-2xl leading-none"
            style={{ color: getRatingColor(criticScore / 10) }}
          >
            {criticScore}
            <span className="text-muted text-xs font-normal">/100</span>
          </div>
        </div>
        <div className="bg-shadow rounded-xl px-3 py-3 text-center">
          <div className="text-xs text-muted uppercase tracking-wider mb-1">
            Fan Score{count > 0 ? ` (${count})` : ""}
          </div>
          <div
            className="font-bold text-2xl leading-none"
            style={{ color: count > 0 ? getRatingColor(avg) : "#888888" }}
          >
            {count > 0 ? avg.toFixed(1) : "—"}
            <span className="text-muted text-xs font-normal">/10</span>
          </div>
        </div>
      </div>
    </div>
  );
}

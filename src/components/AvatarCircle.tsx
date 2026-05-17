import { DEFAULT_BG } from "@/lib/constants";

interface AvatarCircleProps {
  emoji: string;
  bg?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZES = {
  xs: { div: "w-6 h-6",   text: "text-xs" },
  sm: { div: "w-7 h-7",   text: "text-sm" },
  md: { div: "w-8 h-8",   text: "text-base" },
  lg: { div: "w-10 h-10", text: "text-xl" },
  xl: { div: "w-20 h-20", text: "text-4xl" },
};

export function AvatarCircle({ emoji, bg, size = "md", className = "" }: AvatarCircleProps) {
  const { div, text } = SIZES[size];
  return (
    <div
      className={`${div} rounded-full flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ backgroundColor: bg ?? DEFAULT_BG }}
    >
      <span className={text}>{emoji}</span>
    </div>
  );
}

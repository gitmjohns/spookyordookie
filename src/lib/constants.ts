export const AVATAR_COLORS = [
  { name: "Pitch Black",   hex: "#0a0a0f" },
  { name: "Dark Purple",   hex: "#2d0a4a" },
  { name: "Blood Red",     hex: "#4a0a0a" },
  { name: "Midnight Blue", hex: "#0a0a3a" },
  { name: "Rotting Brown", hex: "#2a1500" },
  { name: "Slate Grey",    hex: "#1a1a2a" },
  { name: "Burnt Orange",  hex: "#3a1500" },
  { name: "Toxic Green",   hex: "#0a2a0a" },
  { name: "Ghost Blue",    hex: "#0a1a2a" },
  { name: "Deep Crimson",  hex: "#3a0015" },
] as const;

export type AvatarColor = typeof AVATAR_COLORS[number]["hex"];
export const DEFAULT_BG = "#0a0a0f";

export const HORROR_EMOJIS = [
  '💀','👻','🧟','🕷','🎃','🧛','🔪','🪓','🩸','🦇',
  '🐺','👁','🕸','⚰️','🪦','🧠','🐀','🌕',
] as const;

export type HorrorEmoji = typeof HORROR_EMOJIS[number];
export const DEFAULT_EMOJI = '💀';

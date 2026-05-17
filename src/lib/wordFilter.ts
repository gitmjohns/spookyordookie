const FILTERS: [RegExp, string][] = [
  // n-word + nigga variants (leet-speak aware)
  [/\bn[i1!|l]+[g9]{1,3}(?:[e3]+r[sz]?|[a@4]+[sz]?)\b/gi, "🥷"],
  // rape / raped / raping / rapist (leet-speak aware)
  [/\br[a@4]p(?:e[ds]?|[i1!]+ng|[i1!]+sts?)\b/gi, "🍇"],
];

export function applyWordFilter(text: string): string {
  return FILTERS.reduce((t, [re, replacement]) => t.replace(re, replacement), text);
}

export function usernameHasBannedWord(username: string): boolean {
  return /n[il1]+g+[ea]/i.test(username) || /r[a4]p[ei]/i.test(username);
}

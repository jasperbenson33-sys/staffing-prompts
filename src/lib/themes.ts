export const THEMES = [
  { id: 'dark', label: 'Dark (default)' },
  { id: 'light', label: 'Light' },
  { id: 'terminal', label: 'Terminal' },
  { id: 'colorful', label: 'Colorful' },
  { id: 'spooky', label: 'Spooky', emoji: '🎃' },
  { id: 'awareness', label: 'Awareness', ribbon: true },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];

const emojiIcon = (emoji: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${emoji}</text></svg>`;

const yellowSmiley =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#ffd400" stroke="#111" stroke-width="5"/>' +
  '<circle cx="35" cy="40" r="6" fill="#111"/><circle cx="65" cy="40" r="6" fill="#111"/>' +
  '<path d="M27 58q23 26 46 0" fill="none" stroke="#111" stroke-width="6" stroke-linecap="round"/></svg>';

export const RIBBON_LOOP = 'M32 40C14 22 18 6 32 6s18 16 0 34z';
export const RIBBON_TAILS = 'M32 38L18 60M32 38L46 60';

const pinkRibbon =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="#ec407a" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">` +
  `<path d="${RIBBON_LOOP}"/><path d="${RIBBON_TAILS}"/></svg>`;

const FAVICONS: Record<ThemeId, string> = {
  dark: emojiIcon('🤠'),
  light: emojiIcon('🤠'),
  terminal: emojiIcon('🤖'),
  colorful: yellowSmiley,
  spooky: emojiIcon('🎃'),
  awareness: pinkRibbon,
};

export function setFavicon(theme: ThemeId): void {
  let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.type = 'image/svg+xml';
  link.href = `data:image/svg+xml,${encodeURIComponent(FAVICONS[theme])}`;
}

// Small words stay lowercase inside a name ("District of Columbia").
const SMALL_WORDS = new Set(['of', 'the', 'and']);

/** Title-case each word, but leave deliberate CamelCase names (McKinney, DeKalb) alone. */
function titleCase(text: string): string {
  let first = true;
  return text.split(/(\s+)/).map((token) => {
    if (!/[A-Za-z]/.test(token)) return token;
    const lower = token.toLowerCase();
    const isFirst = first;
    first = false;
    if (/^[A-Z][a-z]+[A-Z][a-z]/.test(token)) return token;
    if (!isFirst && SMALL_WORDS.has(lower)) return lower;
    return lower.replace(/(^|[-'’./])([a-z])/g, (_, edge: string, letter: string) => edge + letter.toUpperCase());
  }).join('');
}

/** Trim, collapse extra spaces, and fix capitalization: "  wa " → "WA", "SEATTLE" → "Seattle". */
export function formatValue(format: 'city' | 'state', text: string): string {
  const cleaned = text.trim().replace(/\s+/g, ' ');
  if (format === 'state' && /^[A-Za-z]{2}$/.test(cleaned)) return cleaned.toUpperCase();
  return titleCase(cleaned);
}

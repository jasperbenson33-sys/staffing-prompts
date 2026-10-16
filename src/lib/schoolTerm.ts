// Regular school years start in August; ESY/summer assignments start in May.
const UPCOMING_AFTER_MONTHS = 5;

/** The school year in session now (or just finished starting): August starts a new one. */
export function currentSchoolYear(now = new Date()): string {
  const start = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  return `${start}-${start + 1}`;
}

/** Best guess at when a typed term starts, or null when it can't be read. */
export function termStart(text: string, now = new Date()): Date | null {
  const range = text.match(/\b(20\d{2})\s*[-–/]\s*(\d{2,4})\b/);
  const years = (text.match(/\b20\d{2}\b/g) ?? []).map(Number);
  if (range) {
    const end = range[2].length === 2 ? Number(`${range[1].slice(0, 2)}${range[2]}`) : Number(range[2]);
    years.push(end);
  }
  if (/\b(esy|summer|extended school year)\b/i.test(text)) {
    // ESY follows the school year it belongs to, so a range like 2026-2027 means summer 2027.
    const year = years.length ? Math.max(...years) : now.getMonth() <= 7 ? now.getFullYear() : now.getFullYear() + 1;
    return new Date(year, 4, 1);
  }
  return years.length ? new Date(Math.min(...years), 7, 1) : null;
}

export function isUpcoming(text: string, now = new Date()): boolean {
  const start = termStart(text, now);
  if (!start) return false;
  const cutoff = new Date(now.getFullYear(), now.getMonth() + UPCOMING_AFTER_MONTHS, now.getDate());
  return start.getTime() > cutoff.getTime();
}

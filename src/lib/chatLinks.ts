// Keep prefilled prompts short. Long prompts can fail in the URL, so we
// fall back to opening the bare site, and the prompt is already on the clipboard.
const SAFE_URL_PROMPT_CHARS = 1500;

export const CHAT_TARGETS = {
  claude:  { label: "Open in Claude",  base: "https://claude.ai/new",   prefill: true },
  chatgpt: { label: "Open in ChatGPT", base: "https://chatgpt.com/",    prefill: true },
} as const;

export type ChatTarget = keyof typeof CHAT_TARGETS;

export function buildChatLink(target: ChatTarget, prompt: string): string {
  const { base, prefill } = CHAT_TARGETS[target];
  if (!prefill || prompt.length > SAFE_URL_PROMPT_CHARS) return base;
  return `${base}?q=${encodeURIComponent(prompt)}`;
}

export function openInChat(target: ChatTarget, prompt: string): void {
  // Start the clipboard write and open the window in the same click.
  // Waiting on the clipboard first can trigger the popup blocker.
  navigator.clipboard.writeText(prompt).catch(() => {});
  window.open(buildChatLink(target, prompt), "_blank", "noopener,noreferrer");
}

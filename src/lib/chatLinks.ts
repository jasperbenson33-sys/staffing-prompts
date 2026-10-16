// Prefilled prompts travel in the URL, which servers cap at roughly 8,000 characters.
// Longer prompts open the bare site instead, and the prompt is on the clipboard to paste.
const MAX_URL_LENGTH = 6000;

export const CHAT_TARGETS = {
  claude:  { label: "Open in Claude",  base: "https://claude.ai/new",   prefill: true },
  chatgpt: { label: "Open in ChatGPT", base: "https://chatgpt.com/",    prefill: true },
} as const;

export type ChatTarget = keyof typeof CHAT_TARGETS;

export function buildChatLink(target: ChatTarget, prompt: string): string {
  const { base, prefill } = CHAT_TARGETS[target];
  const url = `${base}?q=${encodeURIComponent(prompt)}`;
  return prefill && url.length <= MAX_URL_LENGTH ? url : base;
}

function copyWithSelection(text: string): boolean {
  const box = document.createElement("textarea");
  box.value = text;
  box.setAttribute("readonly", "");
  box.style.cssText = "position:fixed;top:0;left:0;opacity:0";
  document.body.appendChild(box);
  box.select();
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    box.remove();
  }
}

/** Copies text, using the older selection method when the Clipboard API is missing or refused. */
export function copyText(text: string): Promise<boolean> {
  if (!navigator.clipboard) return Promise.resolve(copyWithSelection(text));
  return navigator.clipboard.writeText(text).then(() => true, () => copyWithSelection(text));
}

export type OpenResult = { prefilled: boolean; copied: Promise<boolean> };

export function openInChat(target: ChatTarget, prompt: string): OpenResult {
  // Start the copy and open the window in the same click.
  // Waiting on the clipboard first can trigger the popup blocker.
  const copied = copyText(prompt);
  const link = buildChatLink(target, prompt);
  window.open(link, "_blank", "noopener,noreferrer");
  return { prefilled: link !== CHAT_TARGETS[target].base, copied };
}

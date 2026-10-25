Make the following changes to the Present section
    - Place the Present at the top of the list,(above TOro) and have it open on app "login"
    - Keep internal info bullets to 4, 5 maximum.
    - use city, state to look up zip code if none exists in resume or notes (pick the one with the median numerical value if there are multiple found)
    - Add "(works best in Claude)" under the header

Add to Job Posting section:
 - Pull pay range based on the table in the attached screen shot, determine by job location (state) and role/title.
 -  Include an option for custom pay range (text box) and a "do not disclose pay range" checkbox
 - Default fill the school year or term to the current school term at time of use (so right now, 2026-2027)
 - If school term is more than 5 months in the future, write "upcoming" (assume each regular school year starts in August, and each ESY/summer assignment starts in May)

Add to all sections:
- Add a "Open in Claude" and "Open in ChatGPT" buttons to the left of all "Copy Prompt" buttons across the app.
- Use the code block copied below, if helpful. Modify as needed to fit existing app and match instructions above.
// src/lib/chatLinks.ts
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





Add a smiley face in a cowboy hat emoji as the tab icon in browsers (unless otherwise noted below). Include a settings module in the top right corner of the page that changes between the following themes:
- "Dark (default)" [this is the existing theme]
- "Light" [light version of existing dark theme]
- "Terminal" [terminal (coding) themed - browser icon changes to robot emoji]
- "Colorful" [same as existing format, but very colorful, using bright primary colors - browser icon changes to yellow]
- "Spooky [jack-o-lantern emoji]" [ get creative with this one! use halloween themed color scheme, font(s) and images (ghosts, frankenstein, bats, witches, jack o lantern etc. - changes header icon to ghost, browser icon to jack-o-lantern ]
- "Awareness [pink ribbon emoji]" [breast cancer awareness themed. changes header icon and browser icon to pink ribbon, and incorporates pink color scheme throughout.]

Some notes: 
- browser icon = icon displayed in browser tab
- header icon = displayed next to "prompt studio" in top left of page (currently an S in a blue square)
- Always ensure all text is readable (no light text on light background, or dark on dark background) and buttons are clearly visible.
- in every theme, make the "Open in Claude" button a variation on the Claude orange/black/tan color scheme, and make "Open in ChatGPT" a variation on OpenAI's black and white color scheme. Put the icon for each app to the left of the text inside the button.

Also, in the Job posting section, auto-capitalize the State field (so if wa is entered, it converts it to WA) and the City field (seattle or SEATTLE becomes "Seattle"). Delete any spaces at the beginning or end of a city or state entry (spaces are fine in the middle of a city name, like Los Angeles, etc.)
Deploy all of the above changes and commit to git so it's all saved in the repo history.
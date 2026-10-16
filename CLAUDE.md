# Soliant Prompt Studio

Internal prompt-building tool for recruiters. Users choose a workflow, fill in simple fields, review a live prompt, and copy it into an approved AI tool or Toro.

## Stack
- Vite, React, and TypeScript
- Plain CSS
- Static site only: no backend, API keys, analytics, or persistence

## Rules
- All use cases live in `src/data/use-cases.json`. Adding one should not require app code changes.
- Templates use `{{fieldId}}`. Unfilled fields must render as `[missing]`, never as blank text.
- Keep labels plain-English and keep “Copy prompt” as the primary action.
- Do not add dependencies without asking first.
- Never include actual candidate or client names or data in the repository. Use placeholders such as `[Candidate Name]`.
- Do not store user-entered data in browser storage or send it anywhere.
- Do not treat a shared password or a browser-side password check as access control.
- Before reporting a task done, run `npm run build` and fix any errors.
# Prompt Studio

A static prompt builder for recruiter workflows. Choose a workflow, complete its fields, review the generated prompt, and copy it into an approved AI tool or Toro.

## Run locally

```sh
npm install
npm run dev
```

Run `npm run build` to create the production site in `dist/`.

## Themes

The Settings button (top right) switches between Dark (default), Light, Terminal, Colorful, Spooky, and Awareness. Each theme is a block of colour variables in `src/styles.css`, and the tab icon and header icon change with the theme (`src/lib/themes.ts`). The choice is not saved, so each visit starts on Dark.

## Included workflows

- Bullhorn/Toro candidate search (target: recent SPIN, hot nearby jobs only, or recently engaged), with a fixed follow-up message to repeat
- School-based job posting
- Cold email builder
- Improve this message (outreach, response, or follow-up)
- Candidate interview preparation
- State licensing research for SLPs and OTs

Workflow definitions are in `src/data/use-cases.json`. Templates adapt to the inputs, so wording, tense, and instructions change with the selections:

- `{{field}}` inserts a value; empty required fields show `[missing]`. Fields marked `"optional": true` are simply left out.
- Filters: `{{role.name}}`, `{{role.abbr}}`, `{{role.a}}` (a/an), `{{skills.list}}` / `{{skills.list:or}}`, `{{days.count:day}}` (1 day, 30 days), `{{time.phrase}}` (prose from the field's `phrases`).
- Conditionals: `{{#if remote}} … {{else}} … {{/if}}`, with `field=A|B`, `field!=A`, `field~text`, `field>2`, `!field`, `&&`, `||`. A line holding only a block tag leaves no blank line, and numbered lines renumber automatically.
- A field's `format` (`city` or `state`) trims spaces and fixes capitalization, e.g. "  wa " becomes "WA" and "SEATTLE" becomes "Seattle".
- `{{@schoolYear}}` is the current school year (August starts a new one), and `{{term.upcoming}}` adds "upcoming" when a typed term starts more than 5 months away (regular years start in August, ESY in May).
- A field's `lookup` prefills from a state-by-role table, as the job posting's pay range does.
- `defaultValue` may reference other fields (the skills default follows the selected role); `hiddenWhen` hides a field; `checks` shows a warning when inputs contradict each other.

The engine is in `src/lib/template.ts`. Use `[missing]` in the preview as a reminder to complete any required details before copying. The app does not save entered values or send them to a server. The only exception is the "Open in Claude" and "Open in ChatGPT" buttons: when clicked, they copy the prompt and open that site, passing short prompts (under 1,500 characters) in the link.

The supplied source material did not include examples for outreach, candidate responses, or client responses, so those workflows are not fabricated here.
# FAST BRIDGE GROUP workspace instructions

- Prefer small, targeted edits over broad rewrites.
- Preserve the existing stack: static HTML pages, plain browser JavaScript, Express on Node.js, and Electron with CommonJS.
- Do not introduce React, TypeScript, build tooling, or new frameworks unless the task explicitly requires it.
- Keep existing page structure, naming, and visual patterns unless the task is a design refresh.
- Reuse existing endpoints, storage helpers, and theme utilities before adding new abstractions.
- Treat this repository as a mixed web and desktop app: browser-facing pages live at the workspace root, server logic is primarily in `server.js`, and desktop shell code lives in `electron/`.
- When editing authentication, storage, or admin flows, avoid weakening existing checks and prefer minimal behavioral changes.
- Treat the My Agents workspace page and its search/filter implementation in `my-agents.html` as production-stable and immutable unless the user explicitly instructs otherwise. Do not modify, refactor, rename, remove, or alter that protected block without direct permission.

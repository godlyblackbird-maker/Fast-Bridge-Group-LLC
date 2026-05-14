---
name: Plain JavaScript Files
description: Use when editing root-level JavaScript files in this workspace.
applyTo: "*.js"
---

- Keep JavaScript compatible with the repository's existing plain-script and CommonJS usage.
- Prefer small functions and direct control flow over framework-heavy abstractions.
- Reuse existing helpers and shared page logic before adding new modules.
- Avoid introducing bundler-only patterns or assumptions that break direct browser loading.
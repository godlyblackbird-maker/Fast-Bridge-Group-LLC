---
name: Utility Scripts
description: Use when editing Node utility scripts under scripts/.
applyTo: "scripts/**/*.js"
---

- Keep scripts runnable directly with Node in the current repository setup.
- Favor explicit logging, clear argument handling, and minimal dependencies.
- Avoid changes that assume a browser runtime or Electron renderer context.
---
name: Backend Node CommonJS
description: Use when editing server-side Node.js files such as server.js, auth.js, profile.js, login.js, register.js, or scripts in scripts/.
applyTo: "server.js"
---

- Keep server-side JavaScript in CommonJS style unless the file already uses something else.
- Prefer extending existing Express routes, helpers, and persistence flows instead of creating parallel systems.
- Keep API changes narrow and backward-compatible with the current HTML pages and desktop shell.
- Validate inputs and preserve existing authentication and authorization checks.
- For storage changes, respect the repository's mix of SQLite, optional Postgres, and S3-backed persistence.
- Avoid adding dependencies unless the task clearly benefits from them.

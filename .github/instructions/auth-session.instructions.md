---
name: Auth Session Guardrails
description: Use when editing auth.js and the shared authentication/session enforcement layer.
applyTo: "auth.js"
---

- Treat `auth.js` as the shared enforcement layer for login state, role gating, nav injection, unread indicators, and cross-tab session safety.
- Preserve both `localStorage` and `sessionStorage` token reads unless a task explicitly changes session behavior.
- Do not weaken forced logout, auth mismatch detection, verified user lock, or tab snapshot protections.
- Prefer extending existing auth helpers instead of duplicating token parsing or authorization header logic in page scripts.
- When changing campaign, Gmail, or FBG message navigation logic, keep auth-aware nav state and unread indicators consistent.

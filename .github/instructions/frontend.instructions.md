---
name: Frontend Pages
description: Use when editing root HTML, CSS, or browser JavaScript files for the FAST dashboard and public pages.
applyTo: "*.html"
---

- Preserve the current multi-page structure built from root-level `.html` files and plain browser scripts.
- Prefer direct DOM updates and small helper functions over new client-side frameworks.
- Keep script behavior compatible with existing pages that load scripts directly in the browser.
- Reuse existing theme and dashboard utilities instead of duplicating theme state logic.
- Match the current file style: simple functions, minimal indirection, and straightforward event wiring.
- Avoid breaking auth-aware pages that rely on existing token or profile flows.

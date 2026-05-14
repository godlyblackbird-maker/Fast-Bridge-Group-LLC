---
name: Electron Shell
description: Use when editing Electron desktop shell files under electron/.
applyTo: "electron/**/*.cjs"
---

- Keep Electron entry points and preload files in CommonJS.
- Prefer minimal desktop-shell changes that preserve the existing app boot flow around the local FAST server.
- Be explicit about security-sensitive Electron settings such as preload exposure, navigation, and window creation.
- Do not duplicate logic that already exists in the browser app or Express server unless Electron-specific behavior requires it.
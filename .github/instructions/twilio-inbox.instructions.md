---
name: Twilio Inbox Page
description: Use when editing fbg-messages.html and the unified message inbox experience.
applyTo: "fbg-messages.html"
---

- Preserve the inbox mental model that combines message history, unread state, and follow-up actions.
- Keep AI reply assistance grounded in message direction so outbound-only threads do not generate replies as if they came from the contact.
- Reuse existing unread state, auth helpers, and message-fetch flows instead of creating parallel state models.
- Prefer precise fixes to thread rendering, unread indicators, or reply drafting over broad inbox rewrites.
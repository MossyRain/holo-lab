# HOLO LAB v2.1

## Changes from v2.0
- COLLECTION / EDITOR / VIEWER are all landscape-oriented from launch.
- COLLECTION grid scroll fixed for iPhone/PWA, including momentum scrolling.
- Default STORM order: 天変ストム → 溟流ストム → 曐暴ストム.
- EDITOR adds MOVE UP / MOVE DOWN for custom display order.
- Viewer previous/next continues to follow the current collection order/filter.
- EDITOR now shows UNSAVED CHANGES ● after edits and SAVED ✓ after SAVE.
- SAVE button gives a temporary visual confirmation after a successful IndexedDB write.
- Existing local sticker data remains in IndexedDB.

## Gesture input
- Sticker surface remains viewing-only.
- Swipe outside the sticker pair is reserved for holo input.
- Two-finger pinch outside the sticker pair changes viewDepth; sticker size itself does not zoom.

`src/ezshop-extension-e2e.ts` loads the built extension in headless Chromium and captures a live product page through the
real popup channel: the same `ezshop-capture` port request `popup.html` sends to the service worker. It checks:
- the first-run screen, the "no product on this page" screen, and the toolbar badge
- that the capture saves
- that the spec sheet renders cleanly (no script JSON in availability, no sideways scroll)
- that "Open sheet automatically" opens the sheet tab

A scripted run can't click the toolbar button to get `activeTab`, so the script copies `apps/extension/dist` to a temp
dir and adds the product's origin to `host_permissions` (set `EZSHOP_EXT_DIR` to use your own copy instead).
Usage: `npx tsx src/ezshop-extension-e2e.ts [product-url] [screenshot-dir]`. Needs the API and web dev servers running.

`src/ezshop-cdp-drive.ts` drives a headed Chromium started in debug mode (`--remote-debugging-port=9222`) with the
real `apps/extension/dist`:
- It turns off the first-run screen and turns on auto-open in `chrome.storage.local`.
- It presses Alt+Shift+E with a real OS keystroke (`wtype`). This opens the popup, which captures at once and then opens the sheet tab.
- It takes screen captures with `grim` and checks the ezshop UI: the search, the gallery, the library store filter and the import errors.

Usage: `npx tsx src/ezshop-cdp-drive.ts [product-url] <screenshot-dir> [second-url-to-import]`.

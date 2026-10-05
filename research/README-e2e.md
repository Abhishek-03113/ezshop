`src/ezshop-extension-e2e.ts` loads the built extension in Chromium, captures a live Amazon page and screenshots ezshop.
It needs a copy of `apps/extension/dist` whose manifest also grants `https://www.amazon.in/*`, because a scripted run
can't click the toolbar button to get `activeTab`. Point `EZSHOP_EXT_DIR` at that copy.

`src/ezshop-cdp-drive.ts` drives a headed Chromium started in debug mode (`--remote-debugging-port=9222`) with the
real `apps/extension/dist`. It triggers capture with a real OS keystroke (`wtype` Alt+Shift+E), takes screen
captures with `grim`, and checks the ezshop UI. Usage: `npx tsx src/ezshop-cdp-drive.ts <screenshot-dir>`.

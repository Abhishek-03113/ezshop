import { describe, expect, test } from "bun:test";
import { join } from "node:path";

interface ManifestCommand {
  suggested_key: { default: string };
  description: string;
}
interface Manifest {
  action: { default_title: string };
  commands: Record<string, ManifestCommand>;
}

async function readManifest(): Promise<Manifest> {
  return (await Bun.file(join(import.meta.dir, "../public/manifest.json")).json()) as Manifest;
}

describe("manifest.json commands", () => {
  test("the toolbar action and Alt+Shift+S open Specs", async () => {
    const manifest = await readManifest();
    expect(manifest.commands["_execute_action"]?.suggested_key.default).toBe("Alt+Shift+S");
    expect(manifest.commands["_execute_action"]?.description).toBe("Quick Look: specs of this page");
    expect(manifest.action.default_title).toBe("Quick Look: specs of this page");
  });

  // Not Alt+Shift+C: Chromium leaves that suggested key unassigned (chrome.commands.getAll() → shortcut "").
  test("open-comparison is Alt+Shift+V", async () => {
    const command = (await readManifest()).commands["open-comparison"];
    expect(command?.suggested_key.default).toBe("Alt+Shift+V");
    expect(command?.description).toBe("Quick Look: compare this page");
  });
});

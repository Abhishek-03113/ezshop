import { mkdir, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";

/** File access the fixture store needs; paths are relative to the fixture root, "/"-separated. */
export interface FixtureFiles {
  listFiles(): Promise<string[]>;
  readText(path: string): Promise<string>;
  writeText(path: string, text: string): Promise<void>;
}

/**
 * FixtureFiles over a real directory.
 *
 * @example new PageFixtureStore(new DirectoryFixtureFiles(PAGE_FIXTURES_DIR))
 */
export class DirectoryFixtureFiles implements FixtureFiles {
  constructor(private readonly rootDir: string) {}

  async listFiles(): Promise<string[]> {
    const entries = await readdir(this.rootDir, { recursive: true, withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile())
      .map((entry) =>
        join(entry.parentPath, entry.name)
          .slice(this.rootDir.length + 1)
          .replaceAll("\\", "/"),
      )
      .sort();
  }

  async readText(path: string): Promise<string> {
    return Bun.file(join(this.rootDir, path)).text();
  }

  async writeText(path: string, text: string): Promise<void> {
    await mkdir(dirname(join(this.rootDir, path)), { recursive: true });
    await Bun.write(join(this.rootDir, path), text);
  }
}

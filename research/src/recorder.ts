import { appendFileSync, writeFileSync } from "node:fs";
import type { Page } from "playwright";

export interface NetRecord {
  step: string; method: string; type: string; status: number; url: string;
  reqHeaders: Record<string, string>; postData: string | null; contentType: string; bodySample: string;
}

/** Logs every xhr/fetch (and documents) to a JSONL file, tagged with the current step label. */
export function recordNetwork(page: Page, file: string) {
  writeFileSync(file, "");
  let step = "init";
  page.on("response", async (r) => {
    const req = r.request();
    const type = req.resourceType();
    if (!["xhr", "fetch", "document"].includes(type)) return;
    const ct = r.headers()["content-type"] ?? "";
    let bodySample = "";
    try { if (/json|text|javascript|vnd\.com\.amazon/.test(ct)) bodySample = (await r.text()).slice(0, 1500); } catch {}
    const rec: NetRecord = {
      step, method: req.method(), type, status: r.status(), url: r.url(),
      reqHeaders: await req.allHeaders().catch(() => ({})), postData: req.postData(),
      contentType: ct, bodySample,
    };
    appendFileSync(file, JSON.stringify(rec) + "\n");
  });
  return { setStep: (s: string) => { step = s; } };
}

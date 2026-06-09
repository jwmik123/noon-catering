// Convert a markdown file to a styled PDF via headless Chrome.
// Usage: node scripts/md-to-pdf.mjs <input.md> [output.pdf]
import { marked } from "marked";
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve, dirname, basename } from "node:path";

const input = process.argv[2];
if (!input) {
  console.error("Usage: node scripts/md-to-pdf.mjs <input.md> [output.pdf]");
  process.exit(1);
}
const inPath = resolve(input);
const outPath = resolve(process.argv[3] || inPath.replace(/\.md$/i, ".pdf"));
const tmpHtml = resolve(dirname(inPath), `.${basename(inPath)}.tmp.html`);

const body = marked.parse(readFileSync(inPath, "utf8"));

const html = `<!doctype html><html lang="nl"><head><meta charset="utf-8">
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Helvetica Neue", Arial, sans-serif; color: #1f2430;
         font-size: 11px; line-height: 1.55; }
  h1 { color: #524a98; font-size: 20px; margin: 0 0 4px; }
  h2 { color: #524a98; font-size: 14px; margin: 22px 0 8px; padding-bottom: 4px;
       border-bottom: 2px solid #524a98; }
  h1 + p, p { margin: 6px 0; }
  table { border-collapse: collapse; width: 100%; margin: 10px 0; font-size: 10px; }
  th, td { border: 1px solid #d4d2e4; padding: 5px 7px; text-align: left; vertical-align: top; }
  th { background: #524a98; color: #fff; font-weight: 600; }
  tr:nth-child(even) td { background: #f6f5fb; }
  strong { color: #2c2660; }
  blockquote { margin: 10px 0; padding: 8px 12px; background: #f0f7ff;
               border-left: 3px solid #524a98; color: #333; }
  hr { border: 0; border-top: 1px solid #d4d2e4; margin: 18px 0; }
  code { background: #eee; padding: 1px 4px; border-radius: 3px; font-size: 10px; }
  em { color: #666; }
</style></head><body>${body}</body></html>`;

writeFileSync(tmpHtml, html, "utf8");

const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
try {
  execFileSync(chrome, [
    "--headless=new",
    "--disable-gpu",
    "--no-pdf-header-footer",
    `--print-to-pdf=${outPath}`,
    `file://${tmpHtml}`,
  ], { stdio: "pipe" });
  console.log(`Wrote ${outPath}`);
} finally {
  try { unlinkSync(tmpHtml); } catch {}
}

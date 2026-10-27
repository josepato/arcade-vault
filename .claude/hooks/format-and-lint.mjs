// PostToolUse hook (Write|Edit): pasa el archivo tocado por Prettier y ESLint.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const PRETTIER_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".md", ".mdx", ".json", ".css", ".html", ".yml", ".yaml"]);
const ESLINT_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const SKIP_DIRS = ["node_modules", ".next", ".git", "references", ".playwright-mcp"];

let input = "";
for await (const chunk of process.stdin) input += chunk;

let file;
try {
  file = JSON.parse(input).tool_input?.file_path;
} catch {
  process.exit(0);
}
if (!file || !existsSync(file)) process.exit(0);

const rel = path.relative(root, file);
if (rel.startsWith("..") || path.isAbsolute(rel)) process.exit(0);
if (rel.split(path.sep).some((part) => SKIP_DIRS.includes(part))) process.exit(0);

const ext = path.extname(file).toLowerCase();
const bin = (name) => path.join(root, "node_modules", ".bin", name);
const failures = [];

const run = (name, args) => {
  const res = spawnSync(bin(name), args, { cwd: root, encoding: "utf8" });
  if (res.status !== 0) failures.push(`${name} falló en ${rel}:\n${res.stdout}${res.stderr}`);
};

if (PRETTIER_EXT.has(ext)) run("prettier", ["--write", file]);
if (ESLINT_EXT.has(ext)) run("eslint", ["--fix", file]);

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(2);
}

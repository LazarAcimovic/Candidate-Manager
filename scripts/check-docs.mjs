#!/usr/bin/env node
// scripts/check-docs.mjs — mechanical sanity-check for the docs system.
//
// Covers the ten checks in prompt_existing_project.md Appendix E (via
// prompt.md Appendix E). Exits non-zero on error. Prints warnings
// separately; with --warnings-as-errors a warning fails the run too.

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, relative, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(fileURLToPath(import.meta.url), "..", "..");
const warningsAsErrors = process.argv.includes("--warnings-as-errors");

const errors = [];
const warnings = [];
const info = [];

const rel = (p) => relative(repoRoot, p).split("\\").join("/");
const read = (p) => readFileSync(p, "utf8");

const SOURCE_DOCS = [
  "docs/Overview.md",
  "docs/PRD.md",
  "docs/Tech.md",
  "docs/Tech-Backend.md",
  "docs/Tech-Frontend.md",
  "docs/UI.md",
  "docs/DB.md",
  "docs/Decisions.md",
  "AGENTS.md",
];

const INDEXED_DOCS = [
  "docs/PRD.md",
  "docs/Tech.md",
  "docs/Tech-Backend.md",
  "docs/Tech-Frontend.md",
  "docs/UI.md",
];

const KNOWN_RULE_PREFIXES = [
  "PRD",
  "UI",
  "DB",
  "Tech",
  "Tech-Backend",
  "Tech-Frontend",
  "AGENTS",
  "Overview",
  "§",
  "D-",
  "none",
  "see",
];

const VALID_SUBTAGS = new Set([
  "Backend-service",
  "Backend-endpoint",
  "Backend-migration",
  "Frontend-service",
  "Frontend-component",
  "Frontend-page",
  "Frontend-store",
  "Seed",
  "UI",
  "Test",
  "Refactor",
  "Docs",
  "DevOps",
]);

// -----------------------------------------------------------------------------
// Check 1 — Section index drift
// -----------------------------------------------------------------------------
function checkSectionIndex(docPath) {
  const full = join(repoRoot, docPath);
  if (!existsSync(full)) return;
  const text = read(full);
  const lines = text.split(/\r?\n/);

  const indexHeader = lines.findIndex((l) => /^## Section index\b/.test(l));
  if (indexHeader === -1) return; // No index — not required for all docs

  // Collect rows from the index table: | N | title |
  const indexRows = [];
  let inTable = false;
  for (let i = indexHeader; i < lines.length; i++) {
    const l = lines[i];
    if (/^## /.test(l) && i !== indexHeader) break;
    const m = l.match(/^\| (\d+) \| (.+?) \|\s*$/);
    if (m) {
      indexRows.push({ num: Number(m[1]), title: m[2].trim(), line: i + 1 });
      inTable = true;
    } else if (inTable && !/^\|/.test(l) && l.trim() !== "") {
      // Table ended.
      inTable = false;
    }
  }

  // Collect numbered `## N.` headings
  const headings = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^## (\d+)\. (.+)$/);
    if (m) headings.push({ num: Number(m[1]), title: m[2].trim(), line: i + 1 });
  }

  // Line-range syntax in the index is forbidden
  for (const row of indexRows) {
    if (/\d+\s*[-–]\s*\d+/.test(row.title) && /lines?/i.test(row.title)) {
      errors.push(
        `${docPath}:${row.line}: section index row contains a line range (indexes must carry no line numbers)`
      );
    }
  }

  // Indexed-row → real heading
  for (const row of indexRows) {
    const hit = headings.find((h) => h.num === row.num);
    if (!hit) {
      errors.push(
        `${docPath}:${row.line}: section-index row "${row.num} | ${row.title}" has no matching '## ${row.num}.' heading`
      );
    }
  }

  // Real heading → indexed row
  for (const h of headings) {
    const hit = indexRows.find((r) => r.num === h.num);
    if (!hit) {
      errors.push(
        `${docPath}:${h.line}: heading '## ${h.num}. ${h.title}' is missing from the section index`
      );
    }
  }
}

// -----------------------------------------------------------------------------
// Check 2 — Dangling § references in source docs
// Check 3 — Dangling D-0NN references
// -----------------------------------------------------------------------------
function collectHeadings(docPath) {
  const full = join(repoRoot, docPath);
  if (!existsSync(full)) return { top: new Set(), sub: new Set() };
  const text = read(full);
  const top = new Set();
  const sub = new Set();
  for (const line of text.split(/\r?\n/)) {
    const m2 = line.match(/^## (\d+)\./);
    if (m2) top.add(m2[1]);
    const m3 = line.match(/^### (\d+)\.(\d+)/);
    if (m3) sub.add(`${m3[1]}.${m3[2]}`);
    const m4 = line.match(/^#### (\d+)\.(\d+)\.(\d+)/);
    if (m4) sub.add(`${m4[1]}.${m4[2]}.${m4[3]}`);
  }
  return { top, sub };
}

function docHasSection(docPath, ref) {
  const { top, sub } = collectHeadings(docPath);
  if (/^\d+$/.test(ref)) return top.has(ref);
  if (/^\d+\.\d+$/.test(ref)) return sub.has(ref) || top.has(ref.split(".")[0]);
  if (/^\d+\.\d+\.\d+$/.test(ref)) {
    const [a, b] = ref.split(".");
    return sub.has(ref) || sub.has(`${a}.${b}`) || top.has(a);
  }
  return false;
}

function checkCrossRefs() {
  // Collect all D-0NN definitions.
  const decisionsPath = join(repoRoot, "docs/Decisions.md");
  const defined = new Set();
  if (existsSync(decisionsPath)) {
    for (const line of read(decisionsPath).split(/\r?\n/)) {
      const m = line.match(/^### (D-\d{3,4})\b/);
      if (m) defined.add(m[1]);
    }
  }

  // Scan all docs (plus task files) for refs.
  const scanPaths = [
    ...SOURCE_DOCS,
    ...walk("docs/tasks/active", /\.md$/),
    ...walk("docs/refactors/active", /\.md$/),
  ];

  for (const docPath of scanPaths) {
    const full = join(repoRoot, docPath);
    if (!existsSync(full)) continue;
    const lines = read(full).split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip inline code
      const stripped = line.replace(/`[^`]*`/g, "");

      // § refs: "PRD §4.8", "DB §2.1", "Tech-Backend §10"
      const sectionRefs = [
        ...stripped.matchAll(
          /\b(PRD|UI|DB|Tech|Tech-Backend|Tech-Frontend|AGENTS|Overview|Decisions)\s+§(\d+(?:\.\d+){0,2})\b/g
        ),
      ];
      for (const m of sectionRefs) {
        const [, docName, ref] = m;
        const targetMap = {
          PRD: "docs/PRD.md",
          UI: "docs/UI.md",
          DB: "docs/DB.md",
          Tech: "docs/Tech.md",
          "Tech-Backend": "docs/Tech-Backend.md",
          "Tech-Frontend": "docs/Tech-Frontend.md",
          AGENTS: "AGENTS.md",
          Overview: "docs/Overview.md",
          Decisions: "docs/Decisions.md",
        };
        const target = targetMap[docName];
        if (target && !docHasSection(target, ref)) {
          errors.push(
            `${docPath}:${i + 1}: reference "${docName} §${ref}" has no matching heading in ${target}`
          );
        }
      }

      // D-0NN refs
      const dRefs = [...stripped.matchAll(/\b(D-\d{3,4})\b/g)];
      for (const m of dRefs) {
        if (!defined.has(m[1])) {
          errors.push(
            `${docPath}:${i + 1}: reference "${m[1]}" has no entry in docs/Decisions.md`
          );
        }
      }
    }
  }
}

// -----------------------------------------------------------------------------
// Check 4 — Rules: contract violations
// Check 5 — Missing subtask lines
// -----------------------------------------------------------------------------
function checkTaskFile(taskPath) {
  const full = join(repoRoot, taskPath);
  const text = read(full);
  const lines = text.split(/\r?\n/);

  // Find subtask headings: #### N.M — <sub-tag>: <title>  OR  #### RNN.M — Refactor: <title>
  const headings = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^#### (R?\d+\.\d+(?:\.\d+)?) — (\S+):\s*(.+)$/);
    if (m) {
      headings.push({ id: m[1], subtag: m[2], title: m[3], line: i + 1, i });
      continue;
    }
    // Reject the bare-prefix form "#### N.M — Backend: ..."
    const bad = lines[i].match(/^#### (R?\d+\.\d+(?:\.\d+)?) — ([^\s:]+):/);
    if (bad && !VALID_SUBTAGS.has(bad[2])) {
      errors.push(
        `${taskPath}:${i + 1}: invalid sub-tag "${bad[2]}" — see AGENTS §9`
      );
    }
  }

  for (let h = 0; h < headings.length; h++) {
    const { subtag, line, i, id } = headings[h];
    const end = h + 1 < headings.length ? headings[h + 1].i : lines.length;

    if (!VALID_SUBTAGS.has(subtag)) {
      errors.push(
        `${taskPath}:${line}: invalid sub-tag "${subtag}" — see AGENTS §9`
      );
    }

    // Skip the four-line requirement for the mandatory "Docs rule promotion"
    // subtask (it's the one that writes the rules into the source docs).
    // Still require the four lines there too — they carry the four lines
    // in the template, so enforce.
    const body = lines.slice(i + 1, end).join("\n");
    const required = ["Rules:", "Not in scope:", "Docs to update:", "Verify:"];
    for (const key of required) {
      if (!new RegExp(`^\\s*${key.replace(":", ":")}`, "m").test(body)) {
        errors.push(
          `${taskPath}:${line}: subtask ${id} is missing required line "${key}"`
        );
      }
    }

    // Rules: contract — no task-file refs, must start with a known token.
    const rulesMatch = body.match(/^\s*Rules:\s*(.+?)$/m);
    if (rulesMatch) {
      const raw = rulesMatch[1].trim();

      if (/task-\d/i.test(raw)) {
        errors.push(
          `${taskPath}:${line}: subtask ${id} Rules: line references a task file ("${raw}") — Rules may only name PRD / UI / DB / Tech sections or 'none'`
        );
      }

      // Each fragment (comma-separated) must look rule-shaped.
      const frags = raw
        .split(",")
        .map((f) => f.trim())
        .filter((f) => f.length);
      for (const f of frags) {
        const first = f.split(/[\s(]/)[0];
        const ok = KNOWN_RULE_PREFIXES.some(
          (p) => first === p || first.startsWith(p)
        );
        if (!ok) {
          warnings.push(
            `${taskPath}:${line}: subtask ${id} Rules fragment "${f}" does not start with a known token (PRD, UI, DB, Tech, §, D-, none)`
          );
        }
      }
    }
  }

  return headings;
}

function walk(dir, pattern) {
  const full = join(repoRoot, dir);
  if (!existsSync(full)) return [];
  const out = [];
  for (const entry of readdirSync(full)) {
    const p = join(full, entry);
    const s = statSync(p);
    if (s.isDirectory()) {
      out.push(...walk(join(dir, entry), pattern));
    } else if (pattern.test(entry)) {
      out.push(join(dir, entry).split("\\").join("/"));
    }
  }
  return out;
}

// -----------------------------------------------------------------------------
// Check 6 — Index drift for both trackers
// -----------------------------------------------------------------------------
function checkTracker(tracker) {
  // tracker: "tasks" | "refactors"
  const indexPath = `docs/${tracker}/active/index.md`;
  const activeDir = `docs/${tracker}/active`;
  const indexFull = join(repoRoot, indexPath);
  if (!existsSync(indexFull)) {
    errors.push(`${indexPath}: missing`);
    return;
  }

  const text = read(indexFull);
  const lines = text.split(/\r?\n/);

  // Collect rows: | id | title | N/M | ... | [file.md](file.md) |
  const rowRe =
    /^\|\s*(R?\d+[a-z]?)\s*\|.+?\|\s*(\d+)\/(\d+)\s*\|.+?\|.*?\|.*?\|\s*\[.+?\]\((.+?\.md)\)\s*\|\s*$/;
  const rows = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(rowRe);
    if (m) {
      rows.push({
        id: m[1],
        done: Number(m[2]),
        total: Number(m[3]),
        file: m[4],
        line: i + 1,
      });
    }
  }

  const activeFiles = walk(activeDir, /\.md$/)
    .map((p) => p.replace(`${activeDir}/`, ""))
    .filter((p) => p !== "index.md");

  // Rows → files exist
  for (const row of rows) {
    const path = join(repoRoot, activeDir, row.file);
    if (!existsSync(path)) {
      errors.push(
        `${indexPath}:${row.line}: index row links "${row.file}" but no such file in ${activeDir}/`
      );
    }
  }

  // Files → rows exist
  for (const f of activeFiles) {
    const hit = rows.find((r) => r.file === f);
    if (!hit) {
      errors.push(
        `${activeDir}/${f}: no row in ${indexPath} points at this file`
      );
    }
  }

  // Progress cells agree with their files
  for (const row of rows) {
    const path = join(repoRoot, activeDir, row.file);
    if (!existsSync(path)) continue;
    const t = read(path);
    const subtaskHeadings = [...t.matchAll(/^#### (R?\d+\.\d+(?:\.\d+)?) /gm)];
    // Count subtasks via ####, but skip Overview/Baseline/Out of scope/Rollback
    const subtaskCount = subtaskHeadings.length;

    // A subtask is done iff every "- [ ]" box in its body is "- [x]".
    const lines2 = t.split(/\r?\n/);
    const starts = [];
    for (let i = 0; i < lines2.length; i++) {
      const m = lines2[i].match(/^#### (R?\d+\.\d+(?:\.\d+)?) /);
      if (m) starts.push(i);
    }
    let doneCount = 0;
    for (let s = 0; s < starts.length; s++) {
      const from = starts[s];
      const to = s + 1 < starts.length ? starts[s + 1] : lines2.length;
      const body = lines2.slice(from, to).join("\n");
      const open = (body.match(/^-\s*\[ \]/gm) || []).length;
      const total = (body.match(/^-\s*\[[ xX]\]/gm) || []).length;
      if (total > 0 && open === 0) doneCount += 1;
    }

    if (row.total !== subtaskCount) {
      errors.push(
        `${indexPath}:${row.line}: progress total ${row.total} does not match subtask count ${subtaskCount} in ${row.file}`
      );
    }
    if (row.done !== doneCount) {
      errors.push(
        `${indexPath}:${row.line}: progress done ${row.done} does not match fully-ticked subtasks ${doneCount} in ${row.file}`
      );
    }
  }
}

// -----------------------------------------------------------------------------
// Check 7 — Documented paths that do not exist (source docs only)
// -----------------------------------------------------------------------------
const PATH_ROOTS = ["backend/", "frontend/", "docs/", "scripts/", ".githooks/"];

function checkDocumentedPaths() {
  for (const docPath of SOURCE_DOCS) {
    const full = join(repoRoot, docPath);
    if (!existsSync(full)) continue;
    if (docPath === "docs/Decisions.md") continue;
    const lines = read(full).split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const matches = [...line.matchAll(/`([^`]+)`/g)];
      for (const m of matches) {
        const raw = m[1];
        // Strip :line suffix
        const noLine = raw.replace(/:\d+(-\d+)?$/, "").replace(/:\d+,\d+.*$/, "");
        // Only validate paths that start with a known root
        if (!PATH_ROOTS.some((r) => noLine.startsWith(r))) continue;
        // Skip glob patterns, placeholders, ellipses, and the ignored-folder reference
        if (/[*?[\]<>]|\.\.\.|YYYY|NN(?![-a-z])|\{slug\}/.test(noLine)) continue;
        if (/^docs\/old(\/|$)/.test(noLine)) continue;
        // Strip trailing punctuation
        const clean = noLine.replace(/[.,;)]+$/, "");
        const fp = join(repoRoot, clean);
        if (!existsSync(fp)) {
          errors.push(
            `${docPath}:${i + 1}: documented path \`${clean}\` does not exist on disk`
          );
        }
      }
    }
  }
}

// -----------------------------------------------------------------------------
// Check 8 — Section size over ~150 lines
// -----------------------------------------------------------------------------
function checkSectionSize() {
  const LIMIT = 150;
  for (const docPath of SOURCE_DOCS) {
    const full = join(repoRoot, docPath);
    if (!existsSync(full)) continue;
    const lines = read(full).split(/\r?\n/);
    const h2 = [];
    for (let i = 0; i < lines.length; i++) {
      if (/^## /.test(lines[i])) h2.push(i);
    }
    for (let k = 0; k < h2.length; k++) {
      const from = h2[k];
      const to = k + 1 < h2.length ? h2[k + 1] : lines.length;
      const len = to - from;
      if (len > LIMIT) {
        warnings.push(
          `${docPath}:${from + 1}: '${lines[from].trim()}' is ${len} lines (> ${LIMIT}) — split the section or the file`
        );
      }
    }
  }
}

// -----------------------------------------------------------------------------
// Check 9 — docs/old mentions outside sanctioned places
// -----------------------------------------------------------------------------
const OLD_SANCTIONED = new Set([
  "AGENTS.md",
  "docs/Overview.md",
  "scripts/check-docs.mjs",
  ".gitignore",
]);

function checkOldMentions() {
  const all = [
    ...SOURCE_DOCS,
    ...walk("docs/tasks/active", /\.md$/),
    ...walk("docs/refactors/active", /\.md$/),
    "docs/tasks/TEMPLATE.md",
    "docs/refactors/TEMPLATE.md",
    "docs/tasks/done/2026-11.md",
  ];
  for (const docPath of all) {
    if (OLD_SANCTIONED.has(docPath)) continue;
    const full = join(repoRoot, docPath);
    if (!existsSync(full)) continue;
    const lines = read(full).split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      if (/docs\/old/.test(lines[i])) {
        errors.push(
          `${docPath}:${i + 1}: mentions 'docs/old' outside sanctioned places`
        );
      }
    }
  }
}

// -----------------------------------------------------------------------------
// Check 10 — OPEN decisions reported
// -----------------------------------------------------------------------------
function checkOpenDecisions() {
  const p = join(repoRoot, "docs/Decisions.md");
  if (!existsSync(p)) return;
  const lines = read(p).split(/\r?\n/);
  let currentId = null;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^### (D-\d{3,4})\b/);
    if (m) currentId = m[1];
    if (/\*\*Status:\*\* .*\bOPEN\b/.test(lines[i])) {
      info.push(
        `${rel(p)}:${i + 1}: OPEN decision ${currentId} — blocks sections under "Lives in"`
      );
    }
  }
}

// -----------------------------------------------------------------------------
// Drive
// -----------------------------------------------------------------------------
for (const d of INDEXED_DOCS) checkSectionIndex(d);
checkCrossRefs();
for (const f of walk("docs/tasks/active", /\.md$/)) checkTaskFile(f);
for (const f of walk("docs/refactors/active", /\.md$/)) checkTaskFile(f);
checkTracker("tasks");
checkTracker("refactors");
checkDocumentedPaths();
checkSectionSize();
checkOldMentions();
checkOpenDecisions();

for (const line of info) console.log(`info:    ${line}`);
for (const line of warnings) console.log(`warn:    ${line}`);
for (const line of errors) console.error(`error:   ${line}`);

const failed =
  errors.length > 0 || (warningsAsErrors && warnings.length > 0);

if (failed) {
  console.error(
    `\ncheck-docs: ${errors.length} error(s), ${warnings.length} warning(s)`
  );
  process.exit(1);
} else {
  console.log(
    `check-docs: OK — ${warnings.length} warning(s), ${info.length} info`
  );
}

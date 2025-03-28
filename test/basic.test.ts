import assert from "node:assert";
import test from "node:test";

import { transformSync } from "@babel/core";
import prettier from "prettier";

import plugin from "../src/index";

function formatCode(code: string) {
  return prettier.format(code, { parser: "babel" });
}

async function assertCode(code: string, output: string) {
  assert.strictEqual(await formatCode(code), await formatCode(output));
}

test('transform-fs-promises: const fsPromises = require("fs/promises")', async (t) => {
  const code = `const fsPromises = require("fs/promises");`;
  const output = `const fsPromises = require("fs").promises;`;

  const result = transformSync(code, { plugins: [plugin] });
  await assertCode(result!.code!, output);
});

test('transform-fs-promises: module.exports = require("fs/promises")', async (t) => {
  const code = `module.exports = require("fs/promises");`;
  const output = `module.exports = require("fs").promises;`;

  const result = transformSync(code, { plugins: [plugin] });
  await assertCode(result!.code!, output);
});

test('transform-fs-promises: const { readFile } = require("fs/promises")', async (t) => {
  const code = `const { readFile } = require("fs/promises");`;
  const output = `const { readFile } = require("fs").promises;`;

  const result = transformSync(code, { plugins: [plugin] });
  await assertCode(result!.code!, output);
});

test('transform-fs-promises: dynamic import("fs/promises")', async (t) => {
  const code = `const fsPromises = await import('fs/promises');`;
  const output = `const fsPromises = await import('fs').then(m => m.promises);`;

  const result = transformSync(code, { plugins: [plugin] });
  await assertCode(result!.code!, output);
});

test('transform-fs-promises: import fs from "fs/promises"', async (t) => {
  const code = `import fs from 'fs/promises';`;
  const output = `import { promises as fs } from 'fs';`;

  const result = transformSync(code, { plugins: [plugin] });
  await assertCode(result!.code!, output);
});

test('transform-fs-promises: import { readFile } from "fs/promises"', async (t) => {
  const code = `import { readFile } from 'fs/promises';`;
  const output = `import { promises as promises_no_conflict_alias } from 'fs';\nconst { readFile } = promises_no_conflict_alias;`;

  const result = transformSync(code, { plugins: [plugin] });
  await assertCode(result!.code!, output);
});

test('transform-fs-promises: import fs, { readFile, stat } from "fs/promises"', async (t) => {
  const code = `import fs, { readFile, stat } from 'fs/promises';`;
  const output = `import fs, { promises as promises_no_conflict_alias } from 'fs';\nconst { readFile, stat } = promises_no_conflict_alias;`;

  const result = transformSync(code, { plugins: [plugin] });
  await assertCode(result!.code!, output);
});

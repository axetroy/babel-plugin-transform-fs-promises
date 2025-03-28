import assert from "node:assert";
import test, { describe } from "node:test";

import { transformSync } from "@babel/core";
import prettier from "prettier";
import outdent from "outdent";
import babelCoreFrame from "@babel/code-frame";

import babelPluginTransformFsPromises from "../src/index";

function formatCode(code: string) {
  return prettier.format(code, { parser: "babel" });
}

async function assertCode(code: string, output: string) {
  assert.strictEqual(await formatCode(code), await formatCode(output));
}

function paddingLines(code: string, padding: number) {
  const lines = code.split("\n");
  return lines.map((line) => " ".repeat(padding) + line).join("\n");
}

type TestCase = [string | string[], string]

function testSnapshot(name: string, codes: Array<TestCase>) {
  describe(`transform-fs-promises: ${name}`, () => {
    for (const code of codes) {
      const inputs = Array.isArray(code[0]) ? code[0] : [code[0]];

      for (const input of inputs) {
        test(input, async (t) => {
          const result = transformSync(input, {
            plugins: [babelPluginTransformFsPromises],
          });
  
          if (Array.isArray(code) && code.length > 1) {
            const output = code[1];
            assert(result);
            await assertCode(result.code!, output);
          }
  
          const markdown = outdent`
          ### Input
  
          ${paddingLines(babelCoreFrame(input, 0, 0, {}), 4)}
  
          ### Output
          
          ${paddingLines(babelCoreFrame(result?.code!, 0, 0, { linesAbove: Infinity, linesBelow: Infinity }), 4)}
          `;
  
          t.assert.snapshot(markdown, {
            serializers: [(value) => value],
          });
        });
      }
    }
  });
}

const cjs: Array<TestCase> = [
  // cjs: import default
  [
    [
      `const fs = require("fs/promises");`,
      `const fs = require("node:fs/promises");`
    ],
    `const fs = require("fs").promises;`,
  ],
  // cjs: import named
  [
    [
      `const { readFile } = require("fs/promises");`,
      `const { readFile } = require("node:fs/promises");`,
    ],
    `const { readFile } = require("fs").promises;`
  ],
  // cjs: import multiple named
  [
    [
      `const { readFile, stat } = require("fs/promises");`,
      `const { readFile, stat } = require("node:fs/promises");`,
    ],
    `const { readFile, stat } = require("fs").promises;`
  ],
]

testSnapshot('cjs', cjs);

const esm: Array<TestCase> = [
  // esm: import dynamic
  [
    [
      `const fs = import("fs/promises");`,
      `const fs = import("node:fs/promises");`,
    ],
    `const fs = import("fs").then((m) => m.promises);`,
  ],
  // esm: import default
  [
    [
      `import fs from "fs/promises";`,
      `import fs from "node:fs/promises";`,
    ],
    `import { promises as fs } from "fs";`,
  ],
  // esm: import named
  [
    [
      `import { readFile } from "fs/promises";`,
      `import { readFile } from "node:fs/promises";`,
    ],
    `
      import { promises as _promises_no_conflict_alias} from "fs";
      const { readFile } = _promises_no_conflict_alias;
    `,
  ],
  // esm: import multiple named
  [
    [
      `import { readFile, stat } from "fs/promises";`,
      `import { readFile, stat } from "node:fs/promises";`,
    ],
    `
      import { promises as _promises_no_conflict_alias } from "fs";
      const { readFile, stat } = _promises_no_conflict_alias;
    `,
  ],
  // esm: import default + named
  [
    [
      `import fs, { readFile } from "fs/promises";`,
      `import fs, { readFile } from "node:fs/promises";`,
    ],
    `
      import fs, { promises as _promises_no_conflict_alias } from "fs";
      const { readFile } = _promises_no_conflict_alias;
    `
  ]
]

testSnapshot('esm', esm);

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

function testSnapshot(codes: Array<string | [string, string]>) {
  describe("transform-fs-promises", () => {
    for (const code of codes) {
      const input = typeof code === "string" ? code : code[0];

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
  });
}

testSnapshot([
  // cjs: import default
  [
    `const fs = require("fs/promises");`,
    `const fs = require("fs").promises;`,
  ],
  // cjs: import named
  [
    `const { readFile } = require("fs/promises");`,
    `const { readFile } = require("fs").promises;`
  ],
  // cjs: import multiple named
  [
    `const { readFile, stat } = require("fs/promises");`,
    `const { readFile, stat } = require("fs").promises;`
  ],
  // esm: import dynamic
  [
    `const fs = import("fs/promises");`,
    `const fs = import("fs").then((m) => m.promises);`,
  ],
  // esm: import default
  [
    `import fs from "fs/promises";`,
    `import { promises as fs } from "fs";`,
  ],
  // esm: import named
  [
    `import { readFile } from "fs/promises";`,
    `
      import { promises as _promises_no_conflict_alias} from "fs";
      const { readFile } = _promises_no_conflict_alias;
    `,
  ],
  // esm: import multiple named
  [
    `import { readFile, stat } from "fs/promises";`,
    `
      import { promises as _promises_no_conflict_alias } from "fs";
      const { readFile, stat } = _promises_no_conflict_alias;
    `,
  ],
  // esm: import default + named
  [
    `import fs, { readFile } from "fs/promises";`,
    `
      import fs, { promises as _promises_no_conflict_alias } from "fs";
      const { readFile } = _promises_no_conflict_alias;
    `
  ]
]);

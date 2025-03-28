import test, { before } from "node:test";
import path from "node:path";

import { execSync } from "node:child_process";

const rootDir = path.join(__dirname, "..");

before(() => {
  execSync("npm run build", {
    cwd: rootDir,
  });
});

test("test esm output", (t) => {
  const targetDir = path.join(rootDir, "fixtures", "esm");

  execSync("yarn", { cwd: targetDir });

  const output = execSync("npm run test", {
    cwd: targetDir,
    stdio: "pipe",
    env: {
      ...process.env,
      NODE_DISABLE_COLORS: "1",
      NO_COLOR: "1",
    },
  });

  t.assert.snapshot(output.toString(), {
    serializers: [(value) => value],
  });
});

test("test cjs output", (t) => {
  const targetDir = path.join(rootDir, "fixtures", "cjs");

  execSync("yarn", { cwd: targetDir });

  const output = execSync("npm run test", {
    cwd: targetDir,
    stdio: "pipe",
    env: {
      ...process.env,
      NODE_DISABLE_COLORS: "1",
      NO_COLOR: "1",
    },
  });

  t.assert.snapshot(output.toString(), {
    serializers: [(value) => value],
  });
});

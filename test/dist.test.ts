import test, { before } from "node:test";
import path from "node:path";

import { execSync } from "node:child_process";

const rootDir = path.join(__dirname, "..");

before(() => {
  execSync("npm run build", {
    cwd: rootDir,
  });
});

test("test esm output", () => {
  const targetDir = path.join(rootDir, "fixtures", "esm");

  execSync("yarn", { cwd: targetDir });

  execSync("npm run test", {
    cwd: targetDir,
    stdio: "inherit",
  });
});

test("test cjs output", () => {
  const targetDir = path.join(rootDir, "fixtures", "cjs");

  execSync("yarn", { cwd: targetDir });

  execSync("npm run test", {
    cwd: targetDir,
    stdio: "inherit",
  });
});

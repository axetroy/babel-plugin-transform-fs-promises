# babel-plugin-transform-fs-promises

[![Badge](https://img.shields.io/badge/link-996.icu-%23FF4D5B.svg?style=flat-square)](https://996.icu/#/en_US)
[![LICENSE](https://img.shields.io/badge/license-Anti%20996-blue.svg?style=flat-square)](https://github.com/996icu/996.ICU/blob/master/LICENSE)
![Node](https://img.shields.io/badge/node-%3E=14-blue.svg?style=flat-square)
[![npm version](https://badge.fury.io/js/babel-plugin-transform-fs-promises.svg)](https://badge.fury.io/js/babel-plugin-transform-fs-promises)

A Babel plugin to transform `fs/promises` imports and requires into their `fs` equivalents for compatibility with Node.js 14 and below.

Both `fs/promises` and `node:fs/promises` module specifiers are supported.

Compatible with `Babel@^7.0.0`.

## Installation

```bash
npm install babel-plugin-transform-fs-promises --save-dev
```

## Usage

### Via `.babelrc` / `babel.config.json`

```json
{
  "plugins": ["babel-plugin-transform-fs-promises"]
}
```

### Via `babel.config.js`

```js
module.exports = {
  plugins: ["babel-plugin-transform-fs-promises"],
};
```

### Via Babel API

```js
import { transformSync } from "@babel/core";
import babelPluginTransformFsPromises from "babel-plugin-transform-fs-promises";

const result = transformSync(code, {
  plugins: [babelPluginTransformFsPromises],
});
```

## Transformations

The plugin handles all common ways of importing `fs/promises` (and its `node:` prefixed form `node:fs/promises`).

### CJS — `require()`

| Input | Output |
|---|---|
| `require('fs/promises')` | `require('fs').promises` |
| `module.require('fs/promises')` | `module.require('fs').promises` |

**Example:**

```js
// Input
const fs = require("fs/promises");
const { readFile, stat } = require("node:fs/promises");

// Output
const fs = require("fs").promises;
const { readFile, stat } = require("fs").promises;
```

### ESM — Dynamic `import()`

| Input | Output |
|---|---|
| `import('fs/promises')` | `import('fs').then(_esModule => _esModule.promises)` |

**Example:**

```js
// Input
const fs = await import("fs/promises");

// Output
const fs = await import("fs").then(_esModule => _esModule.promises);
```

### ESM — Default import

| Input | Output |
|---|---|
| `import fs from 'fs/promises'` | `import { promises as fs } from 'fs'` |

**Example:**

```js
// Input
import fs from "fs/promises";

// Output
import { promises as fs } from "fs";
```

### ESM — Named imports

| Input | Output |
|---|---|
| `import { readFile } from 'fs/promises'` | `import { promises as _promises } from 'fs'; const { readFile } = _promises;` |

**Example:**

```js
// Input
import { readFile, stat } from "fs/promises";

// Output
import { promises as _promises } from "fs";
const { readFile, stat } = _promises;
```

### ESM — Default + named imports

| Input | Output |
|---|---|
| `import fs, { readFile } from 'fs/promises'` | `import fs, { promises as _promises } from 'fs'; const { readFile } = _promises;` |

**Example:**

```js
// Input
import fs, { readFile } from "fs/promises";

// Output
import fs, { promises as _promises } from "fs";
const { readFile } = _promises;
```

### ESM — Namespace import

| Input | Output |
|---|---|
| `import * as fs from 'fs/promises'` | `import { promises as fs } from 'fs'` |

**Example:**

```js
// Input
import * as fs from "fs/promises";

// Output
import { promises as fs } from "fs";
```

### ESM — Export all

| Input | Output |
|---|---|
| `export * from 'fs/promises'` | `import { promises as _promises } from 'fs'; export default _promises;` |

**Example:**

```js
// Input
export * from "fs/promises";

// Output
import { promises as _promises } from "fs";
export default _promises;
```

### ESM — Named re-exports

| Input | Output |
|---|---|
| `export { readFile } from 'fs/promises'` | `import { promises as _promises } from 'fs'; const { readFile: _readFile } = _promises; export { _readFile as readFile };` |

**Example:**

```js
// Input
export { readFile } from "fs/promises";

// Output
import { promises as _promises } from "fs";
const { readFile: _readFile } = _promises;
export { _readFile as readFile };
```

## Relative

- [transform-fs-promises-webpack-plugin](https://github.com/axetroy/transform-fs-promises-webpack-plugin)

## License

The [Anti 996 License](LICENSE)

# babel-plugin-transform-fs-promises

[![Badge](https://img.shields.io/badge/link-996.icu-%23FF4D5B.svg?style=flat-square)](https://996.icu/#/en_US)
[![LICENSE](https://img.shields.io/badge/license-Anti%20996-blue.svg?style=flat-square)](https://github.com/996icu/996.ICU/blob/master/LICENSE)
![Node](https://img.shields.io/badge/node-%3E=14-blue.svg?style=flat-square)
[![npm version](https://badge.fury.io/js/babel-plugin-transform-fs-promises.svg)](https://badge.fury.io/js/babel-plugin-transform-fs-promises)

A Babel plugin to transform `require('fs/promises')` to `require('fs').promises` for Node.js 11 and below.

## Installation

```bash
npm install babel-plugin-transform-fs-promises --save
```

## Usage

```js
// import via esm
import BabelPluginTransformFsPromises from "babel-plugin-transform-fs-promises";

// import via cjs
const BabelPluginTransformFsPromises = require("babel-plugin-transform-fs-promises");
```

```js
import { transformSync } from "@babel/core";
import BabelPluginTransformFsPromises from "babel-plugin-transform-fs-promises";

const result = transformSync(
  `
    import { readFile } from 'fs/promises';
    readFile('foo.txt');
  `,
  {
    plugins: [BabelPluginTransformFsPromises],
  }
);

console.log(result.code);

// Output:
// import { promises: promises_no_conflict_alias } from 'fs';
// const { readFile } = promises_no_conflict_alias;
// readFile('foo.txt');
```

## License

The [Anti 996 License](LICENSE)

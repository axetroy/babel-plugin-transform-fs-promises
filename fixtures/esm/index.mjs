import { transformSync } from "@babel/core";
import babelPluginTransformFsPromises from "babel-plugin-transform-fs-promises";

console.log(import.meta.filename);
console.log(babelPluginTransformFsPromises);

const input = `
const fs = require('fs/promises');
`;

const result = transformSync(input, {
  plugins: [babelPluginTransformFsPromises],
});

console.log(result.code);

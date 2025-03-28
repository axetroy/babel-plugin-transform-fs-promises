const { transformSync } = require("@babel/core");
const babelPluginTransformFsPromises = require("babel-plugin-transform-fs-promises");

console.log(__filename);
console.log(babelPluginTransformFsPromises);

const input = `
const fs = require('fs/promises');
`;

const result = transformSync(input, {
  plugins: [babelPluginTransformFsPromises],
});

console.log(result.code);

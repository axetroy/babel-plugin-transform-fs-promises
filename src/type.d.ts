import Babel, { PluginObj } from "@babel/core";

declare function babelPluginTransformFsPromises(babel: typeof Babel): PluginObj;

export { babelPluginTransformFsPromises };
export default babelPluginTransformFsPromises;

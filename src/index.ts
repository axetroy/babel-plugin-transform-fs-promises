import type Babel from "@babel/core";
import type { PluginObj } from "@babel/core";

function babelPluginTransformFsPromises(babel: typeof Babel) {
    const { types: t } = babel;

    const moduleNames = new Set(["fs/promises", "node:fs/promises"]);

    return {
        name: "transform-fs-promises",
        visitor: {
            CallExpression(path) {
                const { node } = path;

                // 1. 处理 require('fs/promises') → require('fs').promises
                if (
                    t.isIdentifier(node.callee, { name: "require" }) &&
                    node.arguments.length === 1 &&
                    t.isStringLiteral(node.arguments[0]) &&
                    moduleNames.has(node.arguments[0].value)
                ) {
                    path.replaceWith(
                        t.memberExpression(t.callExpression(t.identifier("require"), [t.stringLiteral("fs")]), t.identifier("promises")),
                    );
                }

                // 2. 处理动态导入 await import('fs/promises') → await import('fs').then(m => m.promises)
                if (
                    t.isImport(node.callee) &&
                    node.arguments.length === 1 &&
                    t.isStringLiteral(node.arguments[0]) &&
                    moduleNames.has(node.arguments[0].value)
                ) {
                    path.replaceWith(
                        t.callExpression(
                            t.memberExpression(t.callExpression(t.identifier("import"), [t.stringLiteral("fs")]), t.identifier("then")),
                            [
                                t.arrowFunctionExpression(
                                    [t.identifier("m")],
                                    t.memberExpression(t.identifier("m"), t.identifier("promises")),
                                ),
                            ],
                        ),
                    );
                }
            },

            ImportDeclaration(path) {
                const { node } = path;

                // 1. 处理 import fs from 'fs/promises' → import { promises as fs } from 'fs'
                if (moduleNames.has(node.source.value) && node.specifiers.length === 1 && t.isImportDefaultSpecifier(node.specifiers[0])) {
                    const localName = node.specifiers[0].local.name;
                    path.replaceWith(
                        t.importDeclaration([t.importSpecifier(t.identifier(localName), t.identifier("promises"))], t.stringLiteral("fs")),
                    );
                }

                // 2. 处理 import { readFile, stat } from 'fs/promises' → import { promises } from 'fs';\nconst { readFile, stat } = promises;
                if (moduleNames.has(node.source.value) && node.specifiers.some((spec) => t.isImportSpecifier(spec))) {
                    const namesSpecifiers = node.specifiers.filter((spec) => t.isImportSpecifier(spec));

                    const defaultSpec = node.specifiers.find((spec) => t.isImportDefaultSpecifier(spec));

                    const localPromises = t.identifier("_promises_no_conflict_alias");

                    path.replaceWithMultiple([
                        t.importDeclaration(
                            [defaultSpec, t.importSpecifier(localPromises, t.identifier("promises"))].filter(Boolean),
                            t.stringLiteral("fs"),
                        ),
                        t.variableDeclaration("const", [
                            t.variableDeclarator(
                                t.objectPattern(namesSpecifiers.map((spec) => t.objectProperty(spec.local, spec.imported, false, true))),
                                localPromises,
                            ),
                        ]),
                    ]);
                }
            },
        },
    } satisfies PluginObj<Babel.PluginPass>;
}

export { babelPluginTransformFsPromises };
export default babelPluginTransformFsPromises;

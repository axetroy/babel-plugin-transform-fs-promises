import type Babel from "@babel/core";
import type { PluginObj } from "@babel/core";

function babelPluginTransformFsPromises(babel: typeof Babel) {
    const { types: t } = babel;

    const moduleNames = new Set(["fs/promises", "node:fs/promises"]);

    const generateImportSourceStringLiteral = (source: string) => {
        const moduleName = source.replace(/\/promises$/, "").replace(/^node:/, "");
        return t.stringLiteral(moduleName);
    };

    return {
        name: "transform-fs-promises",
        visitor: {
            CallExpression(path) {
                const { node } = path;

                // 1. 处理 require('fs/promises') → require('fs').promises
                if (
                    // require('xxx')
                    (t.isIdentifier(node.callee, { name: "require" }) ||
                        // module.require('xxx')
                        (t.isMemberExpression(node.callee) &&
                            t.isIdentifier(node.callee.object, { name: "module" }) &&
                            t.isIdentifier(node.callee.property, { name: "require" }))) &&
                    node.arguments.length === 1 &&
                    t.isStringLiteral(node.arguments[0]) &&
                    moduleNames.has(node.arguments[0].value)
                ) {
                    path.replaceWith(
                        t.memberExpression(
                            t.callExpression(node.callee, [generateImportSourceStringLiteral(node.arguments[0].value)]),
                            t.identifier("promises"),
                        ),
                    );
                }

                // 2. 处理动态导入 await import('fs/promises') → await import('fs').then(m => m.promises)
                if (
                    (t.isImport(node.callee) || t.isIdentifier(node.callee, { name: "import" })) &&
                    node.arguments.length === 1 &&
                    t.isStringLiteral(node.arguments[0]) &&
                    moduleNames.has(node.arguments[0].value)
                ) {
                    const internalIdentifier = path.scope.generateUidIdentifier("esModule");

                    path.replaceWith(
                        t.callExpression(
                            t.memberExpression(
                                t.callExpression(t.identifier("import"), [generateImportSourceStringLiteral(node.arguments[0].value)]),
                                t.identifier("then"),
                            ),
                            [
                                t.arrowFunctionExpression(
                                    [internalIdentifier],
                                    t.memberExpression(internalIdentifier, t.identifier("promises")),
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
                        t.importDeclaration(
                            [t.importSpecifier(t.identifier(localName), t.identifier("promises"))],
                            generateImportSourceStringLiteral(node.source.value),
                        ),
                    );
                }

                // 2. 处理 import { readFile, stat } from 'fs/promises' → import { promises: _promises } from 'fs';\nconst { readFile, stat } = _promises;
                if (moduleNames.has(node.source.value) && node.specifiers.some((spec) => t.isImportSpecifier(spec))) {
                    const namesSpecifiers = node.specifiers.filter((spec) => t.isImportSpecifier(spec));

                    const defaultSpec = node.specifiers.find((spec) => t.isImportDefaultSpecifier(spec));

                    const localPromises = path.scope.generateUidIdentifier("promises");

                    path.replaceWithMultiple([
                        t.importDeclaration(
                            [defaultSpec, t.importSpecifier(localPromises, t.identifier("promises"))].filter(Boolean),
                            generateImportSourceStringLiteral(node.source.value),
                        ),
                        t.variableDeclaration("const", [
                            t.variableDeclarator(
                                t.objectPattern(
                                    namesSpecifiers.map((spec) => {
                                        const importedKey = t.isIdentifier(spec.imported)
                                            ? spec.imported
                                            : t.identifier(spec.imported.value);
                                        const isShorthand =
                                            t.isIdentifier(spec.imported) && spec.imported.name === spec.local.name;
                                        return t.objectProperty(importedKey, spec.local, false, isShorthand);
                                    }),
                                ),
                                localPromises,
                            ),
                        ]),
                    ]);
                }

                // 3. 处理 import * as fs from 'fs/promises' → import { promises as fs } from 'fs'
                if (
                    moduleNames.has(node.source.value) &&
                    node.specifiers.length === 1 &&
                    t.isImportNamespaceSpecifier(node.specifiers[0])
                ) {
                    path.replaceWith(
                        t.importDeclaration(
                            [t.importSpecifier(node.specifiers[0].local, t.identifier("promises"))],
                            generateImportSourceStringLiteral(node.source.value),
                        ),
                    );
                }
            },
            ExportAllDeclaration(path) {
                const { node } = path;

                // 1. 处理 export * from 'fs/promises' → export * from 'fs'
                if (moduleNames.has(node.source.value)) {
                    const localPromises = path.scope.generateUidIdentifier("promises");

                    path.replaceWithMultiple([
                        t.importDeclaration(
                            [t.importSpecifier(localPromises, t.identifier("promises"))],
                            generateImportSourceStringLiteral(node.source.value),
                        ),
                        t.exportDefaultDeclaration(localPromises),
                    ]);
                }
            },

            ExportNamedDeclaration(path) {
                const { node } = path;

                // 1. 处理 export { readFile } from 'fs/promises' → import { promises as _promises } from 'fs'\nexport { readFile } from _promises;
                if (moduleNames.has(node.source?.value) && node.specifiers.some((spec) => t.isExportSpecifier(spec))) {
                    const namesSpecifiers = node.specifiers.filter((spec) => t.isExportSpecifier(spec));

                    const defaultSpec = node.specifiers.find((spec) => t.isExportDefaultSpecifier(spec));

                    const localPromises = path.scope.generateUidIdentifier("promises");

                    const specUidIdentifierMap = new Map<Babel.types.ExportSpecifier, Babel.types.Identifier>();

                    path.replaceWithMultiple(
                        [
                            t.importDeclaration(
                                [
                                    defaultSpec ? t.importDefaultSpecifier(t.identifier(defaultSpec.exported.name)) : undefined,
                                    t.importSpecifier(localPromises, t.identifier("promises")),
                                ].filter(Boolean),
                                generateImportSourceStringLiteral(node.source.value),
                            ),
                            t.variableDeclaration("const", [
                                t.variableDeclarator(
                                    t.objectPattern(
                                        namesSpecifiers.map((spec) => {
                                            const UidIdentifier = path.scope.generateUidIdentifier(spec.local.name);

                                            specUidIdentifierMap.set(spec, UidIdentifier);

                                            return t.objectProperty(spec.local, UidIdentifier, false, false);
                                        }),
                                    ),
                                    localPromises,
                                ),
                            ]),
                            t.exportNamedDeclaration(
                                null,
                                namesSpecifiers.map((spec) => t.exportSpecifier(specUidIdentifierMap.get(spec), spec.exported)),
                            ),
                            defaultSpec ? defaultSpec : null,
                        ].filter(Boolean),
                    );
                }
            },
        },
    } satisfies PluginObj<Babel.PluginPass>;
}

export { babelPluginTransformFsPromises };
export default babelPluginTransformFsPromises;

const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    // Ignora el aviso TS151002 de ts-jest (module NodeNext + emitDecoratorMetadata
    // no combinan con `isolatedModules`, pero el runtime del proyecto no lo exige).
    ...tsJestTransformCfg,
    "^.+\\.tsx?$": [
      "ts-jest",
      { diagnostics: { ignoreCodes: [151002] } },
    ],
  },
  // Solo tests escritos a mano; excluye `dist/` (compilados) y el archivo
  // `tests/test.ts` que no contiene casos de prueba.
  testMatch: ["**/tests/**/*.{spec,test}.ts"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};
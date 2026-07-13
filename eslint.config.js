import js from "@eslint/js";
import astro from "eslint-plugin-astro";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [".astro/**", "dist/**", "node_modules/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs["flat/recommended"],
  {
    files: ["**/*.astro"],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
    // The Astro processor turns client scripts into virtual TypeScript files.
    // This rule currently misclassifies generic DOM method calls in those files.
    rules: {
      "@typescript-eslint/no-unused-expressions": "off",
    },
  },
];

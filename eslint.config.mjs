import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
});

const eslintConfig = [
  ...compat.config({
    ignorePatterns: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
    extends: [
      "next/core-web-vitals",
      "next/typescript",
      "prettier",
      "plugin:@tanstack/eslint-plugin-query/recommended",
      "plugin:better-tailwindcss/recommended-warn",
    ],
    settings: {
      "better-tailwindcss": {
        entryPoint: "app/globals.css",
        group: "newLine",
      },
    },
  }),
];

export default eslintConfig;

// eslint.config.mjs
import eslint from "@eslint/js";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import tailwindcssPlugin from "eslint-plugin-tailwindcss";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // 1. 全局忽略
  {
    ignores: [
      "backend/api-enhanced",
      "node_modules",
      "dist",
      ".next",
      "out",
      "renderer",
      "docs",
      "components/ui",
      "public/data",
      ".agents",
      ".claude",
      ".codex",
    ],
  },

  // 2. 基础 ESLint 与 TypeScript 推荐规则（极速语法与逻辑检查）
  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  // 3. React & React Hooks
  {
    ...reactPlugin.configs.flat.recommended,
    settings: { react: { version: "detect" } },
  },
  reactPlugin.configs.flat["jsx-runtime"],
  {
    plugins: { "react-hooks": reactHooksPlugin },
    rules: {
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/rules-of-hooks": "error",
    },
  },

  // 4. Tailwind CSS
  tailwindcssPlugin.configs.recommended,
  {
    settings: { tailwindcss: { cssConfigPath: "app/globals.css" } },
    ignores: ["components/ui/*.tsx"],
    rules: {
      "tailwindcss/no-custom-classname": "off",
    },
  },

  // 5. 项目自定义覆盖
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "react/prop-types": "off",
    },
  },
);

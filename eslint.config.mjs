// @ts-check

import eslint from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import tailwindcssPlugin from "eslint-plugin-tailwindcss";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // --- Global ignore ---
  {
    ignores: ["backend/api-enhanced", "node_modules", "dist", ".next", "out", "renderer"],
  },

  // --- Base: ESLint recommended ---
  eslint.configs.recommended,

  // --- TypeScript: type-aware + recommended ---
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["*.mjs", "*.ts"],
          defaultProject: "tsconfig.json",
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // --- React & React Hooks ---
  {
    ...reactPlugin.configs.flat.recommended,
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  reactPlugin.configs.flat["jsx-runtime"],
  {
    plugins: {
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/rules-of-hooks": "error",
    },
  },

  // --- Tailwind CSS ---
  tailwindcssPlugin.configs.recommended,
  {
    settings: {
      tailwindcss: {
        cssConfigPath: "app/globals.css",
      },
    },
  },

  // --- Prettier (跑在 ESLint --fix 中，使用 .prettierrc 控制) ---
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      "prettier/prettier": "error",
    },
  },

  // --- 项目特定规则覆盖与后处理 ---
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      // 避免 perfectionist 对 JSX props 的排序与 prettier-plugin-tailwindcss 冲突
      "perfectionist/sort-jsx-props": "off",
      "react/prop-types": "off", // TypeScript handles prop types
    },
  },

  eslintConfigPrettier,
);

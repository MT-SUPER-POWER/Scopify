// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import tailwindcssPlugin from "eslint-plugin-tailwindcss";
import importPlugin from "eslint-plugin-import";
import unusedImportsPlugin from "eslint-plugin-unused-imports";
import sonarjsPlugin from "eslint-plugin-sonarjs";
import perfectionistPlugin from "eslint-plugin-perfectionist";
import prettierPlugin from "eslint-plugin-prettier";

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

  // --- React ---
  {
    ...reactPlugin.configs.flat.recommended,
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  reactPlugin.configs.flat["jsx-runtime"],

  // --- React Hooks ---
  {
    plugins: {
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },

  // --- Tailwind CSS ---
  {
    plugins: {
      tailwindcss: tailwindcssPlugin,
    },
    rules: {
      "tailwindcss/classnames-order": "warn",
      "tailwindcss/enforces-negative-arbitrary-values": "warn",
      "tailwindcss/enforces-shorthand": "warn",
      "tailwindcss/no-contradicting-classname": "error",
    },
  },

  // --- Import ---
  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      "import/first": "error",
      "import/no-duplicates": "error",
      "import/newline-after-import": "error",
    },
  },

  // --- Unused Imports (替代 biome noUnusedVariables) ---
  {
    plugins: {
      "unused-imports": unusedImportsPlugin,
    },
    rules: {
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
    },
  },

  // --- SonarJS (代码质量) ---
  {
    ...sonarjsPlugin.configs.recommended,
    rules: {
      "sonarjs/todo-tag": "off",
    },
  },

  // --- Perfectionist (替代 biome organizeImports) ---
  {
    rules: {
      "perfectionist/sort-imports": [
        "error",
        {
          type: "natural",
          order: "asc",
          groups: [
            ["react", "react-dom"],
            ["^next", "^@?next"],
            "^@?\\w",
            "^@(/.*)$",
            "^\\.\\.?",
            "^.+\\u0000$",
          ],
          newlinesBetween: "always",
          internalPattern: "^@(/.*)$",
        },
      ],
      "perfectionist/sort-named-imports": [
        "error",
        {
          type: "natural",
          order: "asc",
        },
      ],
    },
  },

  // --- Biome 兼容规则映射 ---
  {
    rules: {
      // biome noNonNullAssertion → warn
      "@typescript-eslint/no-non-null-assertion": "warn",
      // biome noExplicitAny → off
      "@typescript-eslint/no-explicit-any": "off",
      // biome style: no unused variables → 由 unused-imports 覆盖
      "@typescript-eslint/no-unused-vars": "off", // 由 unused-imports 接管
    },
  },

  // --- Prettier (跑在 ESLint --fix 中) ---
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      "prettier/prettier": [
        "error",
        {
          tabWidth: 2,
          printWidth: 100,
          semi: true,
          singleQuote: false,
          trailingComma: "all",
        },
        {
          usePrettierrc: false,
        },
      ],
    },
  },

  // --- 项目特定覆盖 ---
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "react/prop-types": "off", // TypeScript handles prop types
    },
  },

  // --- 后处理 ---
  {
    rules: {
      "perfectionist/sort-jsx-props": "off", // 由 prettier-plugin-tailwindcss 处理 class 排序
    },
  },
);

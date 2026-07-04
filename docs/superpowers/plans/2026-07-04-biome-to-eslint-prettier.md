# Biome → ESLint + Prettier 迁移 实施计划

> **For agentic workers:** 该计划按顺序执行，每步可独立验证。

**Goal:** 将 Biome 拆散为 ESLint (Flat Config) + Prettier，保持 lint + format + import sort 能力，确保提交前自动格式化。

**Architecture:** ESLint Flat Config + Prettier + eslint-plugin-prettier 集成，通过 lint-staged 在 commit 时自动 fix。

**Tech Stack:** ESLint 9+, typescript-eslint, Prettier, bun

**Spec:** `docs/superpowers/specs/2026-07-04-biome-to-eslint-prettier.md`

## Global Constraints
- 所有规则需覆盖原 Biome 已有的 recommended + 自定义规则
- 提交前必须通过 lint-staged 自动 fix 格式
- 忽略 `backend/api-enhanced` 目录
- 去掉 jsx-a11y 无障碍规则

---

### Task 1: 安装依赖

- [ ] **Step 1: 安装所有 ESLint + Prettier 依赖**

```bash
cd D:\Github\Scopify
bun add -d eslint @eslint/js typescript-eslint eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-tailwindcss eslint-plugin-import eslint-plugin-unused-imports eslint-plugin-sonarjs eslint-plugin-perfectionist eslint-plugin-prettier eslint-config-prettier prettier prettier-plugin-tailwindcss
```

- [ ] **Step 2: 确认安装成功**

```bash
cd D:\Github\Scopify
bun ls | findstr eslint
bun ls | findstr prettier
```
Expected: 看到所有包名在输出中

---

### Task 2: 创建 eslint.config.mjs

- [ ] **Step 1: 创建 Flat Config 文件**

```bash
cd D:\Github\Scopify
New-Item -ItemType File -Path eslint.config.mjs -Force
```

- [ ] **Step 2: 写入 ESLint 配置**

```mjs
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
    ignores: [
      "backend/api-enhanced",
      "node_modules",
      "dist",
      ".next",
      "out",
      "renderer",
    ],
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
  ...tailwindcssPlugin.configs["flat/recommended"],

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

  // --- 后处理：关闭与 Prettier 冲突的规则 ---
  {
    rules: {
      "perfectionist/sort-jsx-props": "off", // 由 prettier-plugin-tailwindcss 处理 class 排序
    },
  },
);
```

- [ ] **Step 3: 验证配置文件无语法错误**

```bash
cd D:\Github\Scopify
bunx eslint --print-config eslint.config.mjs > $null
```
Expected: 无报错

---

### Task 3: 更新 .prettierrc

- [ ] **Step 1: 写入新的 Prettier 配置**

完全替换 `.prettierrc`：

```json
{
  "tabWidth": 2,
  "printWidth": 100,
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

---

### Task 4: 更新 package.json

- [ ] **Step 1: 修改 scripts**

将：
```json
"lint": "biome lint .",
"format": "biome format . --write",
"check": "biome check --write .",
```
改为：
```json
"lint": "eslint .",
"format": "prettier --write .",
"check": "eslint . --fix",
```

- [ ] **Step 2: 修改 lint-staged**

将：
```json
"lint-staged": {
  "*.{js,ts,cjs,mjs,d.cts,d.mts,jsx,tsx,json,jsonc,css}": [
    "biome format . --write",
    "biome check --write --no-errors-on-unmatched --files-ignore-unknown=true"
  ]
}
```
改为：
```json
"lint-staged": {
  "*.{js,ts,cjs,mjs,jsx,tsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{json,jsonc,css,md,yml}": [
    "prettier --write"
  ]
}
```

---

### Task 5: 移除 Biome

- [ ] **Step 1: 删除 biome.json**

```bash
cd D:\Github\Scopify
Remove-Item biome.json
```

- [ ] **Step 2: 移除 @biomejs/biome 依赖**

```bash
cd D:\Github\Scopify
bun remove @biomejs/biome
```

- [ ] **Step 3: 确认 biome 已完全移除**

```bash
cd D:\Github\Scopify
bun ls | findstr biome
bun ls | findstr biomejs
```
Expected: 无输出（已移除）

---

### Task 6: 全量验证

- [ ] **Step 1: 运行 ESLint 检查全部代码**

```bash
cd D:\Github\Scopify
bun run lint
```
Expected: 无 error（warn 可以接受），或输出清晰的问题列表

- [ ] **Step 2: 修复 lint 错误**（如有必要，逐步修复）

如果 ESLint 报错，按顺序处理：
1. `perfectionist/sort-imports` 错误 → `eslint --fix` 自动修复
2. `unused-imports` 错误 → `eslint --fix` 自动修复
3. `prettier/prettier` 格式错误 → `eslint --fix` 自动修复

```bash
cd D:\Github\Scopify
bun run check
```

- [ ] **Step 3: 再次运行 lint 确认无残留问题**

```bash
cd D:\Github\Scopify
bun run lint
```

- [ ] **Step 4: 运行 TypeScript 编译检查（确保 ESLint 修改没有破坏类型）**

```bash
cd D:\Github\Scopify
bunx tsc --noEmit
```
Expected: 无类型错误

- [ ] **Step 5: 运行 Prettier 全量格式化确保一致性**

```bash
cd D:\Github\Scopify
bun run format
```

---

### Task 7: 提交变更

- [ ] **Step 1: 提交 migrate 到 git**

```bash
cd D:\Github\Scopify
git add -A
git commit -m "refactor: migrate from biome to eslint + prettier

- 新增 eslint.config.mjs (Flat Config)
- 集成 typescript-eslint / react / tailwindcss / sonarjs / perfectionist
- 更新 .prettierrc 配置
- 更新 lint-staged 配置确保提交前自动格式化
- 移除 biome.json 和 @biomejs/biome

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

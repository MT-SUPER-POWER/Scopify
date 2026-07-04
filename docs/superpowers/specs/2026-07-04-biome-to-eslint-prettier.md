# Biome 迁移到 ESLint + Prettier

## 概述

将项目中的 Biome（`@biomejs/biome`）剥离，替换为 ESLint (Flat Config) + Prettier。
保留并增强 Biome 已有的 lint + format + import organize 能力，确保提交前自动格式化。

## 变更清单

### 移除

- `biome.json` —— 配置删除
- `@biomejs/biome` —— 依赖移除
- `package.json` 中 `lint` / `format` / `check` 脚本
- `lint-staged` 中的 biome 调用

### 新增依赖 (bun add -d)

```
eslint
@eslint/js
typescript-eslint
eslint-plugin-react
eslint-plugin-react-hooks
eslint-plugin-tailwindcss
eslint-plugin-import
eslint-plugin-unused-imports
eslint-plugin-sonarjs
eslint-plugin-perfectionist
eslint-plugin-prettier
eslint-config-prettier
prettier
prettier-plugin-tailwindcss
```

### 新增文件

- `eslint.config.mjs` —— Flat Config 入口

### 修改文件

- `.prettierrc` —— 扩充配置
- `package.json` —— 脚本和 lint-staged

---

## ESLint 配置设计 (`eslint.config.mjs`)

### 设计原则

- Flat Config (ESLint 9+)
- TypeScript 类型感知规则（type-aware linting）
- import 自动排序（perfectionist 替代 biome organizeImports）
- unused imports 自动清理
- Prettier 作为 ESLint 规则（`eslint-plugin-prettier`），`eslint --fix` 一次搞定
- 忽略 `backend/api-enhanced`（和原 biome 一致）

### 规则映射

| Biome 规则           | ESLint 等价                                  | 级别  |
| -------------------- | -------------------------------------------- | ----- |
| `noUnusedVariables`  | `@typescript-eslint/no-unused-vars`          | warn  |
| `noNonNullAssertion` | `@typescript-eslint/no-non-null-assertion`   | warn  |
| `noExplicitAny`      | `@typescript-eslint/no-explicit-any`         | off   |
| 内置 recommended     | `typescript-eslint` recommended-type-checked | error |
| organizeImports      | `perfectionist/sort-imports`                 | error |

**不映射的 a11y 规则**：用户明确要求去掉无障碍检查，全部忽略。

### perfetionist import 分组顺序

```
1. react / react-dom
2. next / next/*
3. 第三方包 (node_modules)
4. 内部 @/* 路径
5. 相对路径 (./ ../)
6. 样式文件 (.css .scss)
```

---

## Prettier 配置设计 (`.prettierrc`)

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

与 Biome 当前保持一致：

- `indentStyle: space` → `tabWidth: 2`
- `lineWidth: 100` → `printWidth: 100`
- `quoteStyle: double` → `singleQuote: false`

---

## 提交前工作流

### 当前

```
husky pre-commit → bunx lint-staged → biome format + biome check
```

### 变更后

```
husky pre-commit → bunx lint-staged → eslint --fix + prettier --write
```

### lint-staged 配置

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

### 脚本变更

| 当前                                 | 变更后                                            |
| ------------------------------------ | ------------------------------------------------- |
| `"lint": "biome lint ."`             | `"lint": "eslint ."`                              |
| `"format": "biome format . --write"` | `"format": "prettier --write ."`                  |
| `"check": "biome check --write ."`   | `"check": "eslint . --fix && prettier --write ."` |

---

## 执行步骤

1. `bun add -d` 安装全部依赖
2. 创建 `eslint.config.mjs` 文件
3. 更新 `.prettierrc` 配置
4. 更新 `package.json` scripts 和 lint-staged
5. 删除 `biome.json`
6. 删除 `@biomejs/biome` 依赖
7. `bun run check` 验证整个代码库通过
8. 提交变更

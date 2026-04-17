# Biome 检查流程

## 何时必须运行

- 新建任何 `.ts` / `.tsx` 文件后
- 修改现有文件后
- 重构（移动/重命名文件）后
- **交付代码给用户前**（最后一步，不可省略）

---

## 命令

```bash
# 自动修复格式问题（缩进、引号、分号等）
npx biome check --write .

# 检查剩余问题（确认无 error）
npx biome check .

# 只检查特定目录
npx biome check components/doc/
```

---

## 常见报错修复

### `lint/style/useImportType` — 类型 import 缺少 type 关键字
```ts
// ❌
import { DocItem } from '@/types/doc'

// ✅
import type { DocItem } from '@/types/doc'
```

### `lint/suspicious/noExplicitAny` — 禁止 any
```ts
// ❌
function parse(data: any) { ... }

// ✅ 用具体类型或 unknown
function parse(data: unknown) { ... }
```

### `lint/correctness/noUnusedVariables` — 未使用的变量
```ts
// ❌ 定义了没用
const unused = 'hello'

// ✅ 删掉或使用
```

### `lint/complexity/noUselessFragments` — 多余的 Fragment
```tsx
// ❌
return <><div>hello</div></>

// ✅
return <div>hello</div>
```

### 格式类报错（缩进、引号）
```bash
# 直接自动修复，不需要手动改
npx biome check --write .
```

---

## 交付标准

`npx biome check .` 输出中：
- ✅ 无 `error` 级别条目
- ✅ 格式问题已通过 `--write` 自动修复
- ⚠️ `warning` 评估后决定，通常也应修复

不允许用 `// biome-ignore` 跳过规则，除非注释中说明具体原因。

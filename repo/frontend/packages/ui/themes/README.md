# Theme profiles

这里存放每套主题真正的 CSS 变量值。变量分成两组：

- [`shadcn/`](./shadcn) 放 Shadcn 标准 Token，比如 `--background`、`--foreground`、`--primary`。
- [`scopify/`](./scopify) 只放 Scopify 扩展 Token，统一使用 `--scopify-*` 前缀。

`scopify/theme.css` 不保存主题值，只用 `@theme inline` 注册 Tailwind 类名。能对应到 Shadcn 的类名会直接读取 Shadcn Token，只有额外能力才读取 `--scopify-*`。

当前目录是这样：

```bash
./themes/shadcn/shadcn-default.css
./themes/shadcn/scopify-default.css

./themes/scopify/scopify-default.css
```

`data-theme="shadcn-default"` 只会得到官方 Shadcn 主题。`data-theme="scopify-default"` 会同时命中两个同名文件，因此 Shadcn 组件和 Scopify 扩展会一起切换。

新增普通 Shadcn 主题时，只需要创建 `shadcn/<name>.css`，再把它导入 `index.css`。新增完整的 Scopify 主题时，要创建两个同名文件：

```bash
./themes/shadcn/<name>.css
./themes/scopify/<name>.css
```

两个文件都使用 `data-theme="<name>"`。Scopify 不提供扩展 Token 的默认兜底，所以 `scopify/<name>.css` 必须覆盖 `theme.css` 注册的全部 `--scopify-*`。

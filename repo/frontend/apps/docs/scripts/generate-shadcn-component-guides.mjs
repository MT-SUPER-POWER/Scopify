import fs from "node:fs";
import path from "node:path";

import ts from "typescript";

const appRoot = path.resolve(import.meta.dirname, "..");
const contentRoot = path.join(appRoot, "content/docs/(ui-library)/shadcn");
const previewRoot = path.join(appRoot, "components/docs/previews");
const componentRoot = path.resolve(appRoot, "../../packages/ui/shadcn/components");

const patterns = {
  accordion: "单项展开并允许再次收起；多项同时展开；禁用不可用条目；放入 Card 构建结构化说明区",
  "alert-dialog": "确认删除或退出等高风险操作；明确区分确认与取消；在说明中交代操作后果",
  alert: "展示普通提示、成功状态或破坏性警告；标题保持简短；正文补充用户下一步",
  "aspect-ratio": "稳定专辑封面与视频占位尺寸；避免媒体加载引起布局跳动；通过 ratio 切换横竖构图",
  attachment: "展示单个文件的名称与大小；用 AttachmentGroup 组织多个附件；把下载和移除放入操作区",
  avatar: "组合图片与文字回退；叠加在线状态；使用 AvatarGroup 展示协作者并限制可见数量",
  badge: "标记状态、分类或计数；用 variant 区分语义强弱；保持内容短小且避免承担主要操作",
  breadcrumb: "表达稳定的页面层级；折叠过长的中间路径；当前页使用 BreadcrumbPage 而不是链接",
  bubble: "区分用户与助手消息；在 BubbleReactions 中放置反馈操作；用 BubbleGroup 聚合连续消息",
  "button-group": "合并同级操作；通过 Separator 分隔不同语义；切换 orientation 构建纵向工具条",
  button: "触发主要、次要和破坏性操作；使用 size 控制密度；加载时禁用重复提交并保留明确文本",
  calendar: "选择单日或日期范围；限制不可选日期；把选中值交给业务层管理",
  card: "组合标题、说明、正文与页脚；用 CardAction 放置头部操作；避免把无关信息塞入同一卡片",
  carousel: "浏览推荐歌单或媒体卡片；提供前后控制；内容变化时保留清晰的当前位置提示",
  chart: "通过 ChartConfig 统一序列颜色与名称；组合 Tooltip 和 Legend；让业务层负责数据转换",
  checkbox: "切换独立布尔选项；表达全选时的 indeterminate 状态；始终配套可点击标签",
  collapsible: "展开补充详情或高级设置；触发器提示当前状态；不要隐藏完成主任务所必需的信息",
  combobox: "搜索并选择大量选项；展示空结果提示；受控管理选值并允许键盘完成选择",
  command: "构建命令面板或快速跳转；按组组织命令；为常用操作展示快捷键",
  "context-menu": "在右键目标附近提供相关操作；支持复选与单选项；关键操作不要只藏在上下文菜单中",
  dialog: "承载聚焦编辑或创建流程；使用标题和说明建立语义；提交完成后由业务层控制关闭",
  direction: "在局部组件树切换 LTR 与 RTL；用于验证双向布局；不要替代文档根节点的语言声明",
  drawer: "在移动端承载轻量任务；从边缘展示上下文内容；保持关闭入口和拖动行为清晰",
  "dropdown-menu": "组织触发器相关操作；用分组与分隔线降低扫描成本；复选或单选项保持状态可见",
  empty: "解释为什么当前没有内容；给出一个清晰主操作；通过 EmptyMedia 提供图标或插图",
  field: "统一标签、控件、说明与错误；用 FieldGroup 排列相关字段；错误信息与 aria-invalid 保持一致",
  form: "连接 React Hook Form 的状态与校验；通过 FormField 注入字段上下文；提交与服务端错误留在业务层",
  "hover-card": "预览艺人或用户摘要；只承载补充信息；确保键盘聚焦也能访问内容",
  "input-group": "加入搜索图标、单位或快捷键；把可点击附加项做成按钮；避免前后缀挤压输入内容",
  "input-otp": "按位输入验证码；通过 Group 和 Separator 表达分段；受控处理粘贴、提交和错误状态",
  input: "接收文本、数字或邮箱；使用正确的 type 与 autocomplete；校验状态由 Field 统一表达",
  item: "排列媒体、标题、说明和尾部操作；用 ItemGroup 组织列表；交互式条目保持完整点击区域",
  kbd: "展示单键或组合快捷键；用 KbdGroup 组织组合键；文本描述同时说明快捷操作含义",
  label: "通过 htmlFor 关联原生控件；标签文本保持明确；不要只用 placeholder 代替标签",
  marker: "标记消息状态或上下文；组合图标和短文本；通过 variant 表达有限且稳定的语义",
  menubar: "构建桌面式应用菜单；组织嵌套命令和快捷键；禁用项仍应说明其存在但不可用",
  "message-scroller": "自动跟随新增消息；用户向上阅读时暂停自动滚动；提供明确的回到底部按钮",
  message: "组合头像、页眉、正文与页脚；用 MessageGroup 聚合对话；流式内容保持布局稳定",
  "native-select": "使用浏览器原生选择体验；适合简单且选项较少的表单；用 optgroup 组织分类",
  "navigation-menu": "构建站点级导航；下拉内容提供清晰分组；当前链接状态与键盘导航保持可见",
  pagination: "在数据页之间前后跳转；标记当前页；页数很多时使用省略项而不是渲染全部页码",
  popover: "在触发器附近放置轻量表单或设置；用 Anchor 控制定位；内容复杂时改用 Dialog 或 Sheet",
  progress: "展示可量化任务进度；未知时长使用 Spinner；同时提供可理解的文本状态",
  "radio-group": "从互斥选项中选择一个；为组提供可见标签；默认值和受控值保持单一来源",
  resizable: "拖动调整相邻面板；Handle 提供可见反馈；设置合理最小尺寸避免内容不可用",
  "scroll-area": "限制长列表或日志高度；按需展示横向滚动条；不要嵌套多个争抢滚动的区域",
  select: "从有限选项中选择一个值；使用 Group 和 Label 分类；错误状态同时设置 aria-invalid",
  separator: "分隔菜单、列表或内容区；装饰性分隔使用 decorative；通过 orientation 匹配布局方向",
  sheet: "从侧边展示设置或详情；通过 side 选择进入方向；复杂工作流优先使用独立页面",
  sidebar: "组合头部、分组菜单和页脚；通过 SidebarProvider 管理折叠状态；移动端使用内置响应式行为",
  skeleton: "为尚未加载的内容保留形状；匹配最终布局尺寸；避免对已知进度的任务使用骨架屏",
  slider: "选择单值或范围；设置合理步长与边界；旁边显示当前数值以便精确理解",
  sonner: "反馈保存、添加或失败结果；消息保持短暂且非阻塞；重要错误仍需在页面内保留",
  spinner: "表示未知时长的等待；与动作文本组合；避免页面同时出现多个无上下文的旋转指示器",
  switch: "切换立即生效的设置；标签描述开启后的含义；需要提交确认的选择改用 Checkbox",
  table: "组织具有明确列关系的数据；使用 Caption 补充表意；窄屏时规划滚动或替代布局",
  tabs: "切换同一上下文的并列视图；标签保持短小；不要用 Tabs 模拟前后步骤流程",
  textarea: "输入多行说明或评论；设置合适最小高度；显示长度限制和校验反馈",
  "toggle-group": "组织单选或多选切换项；用 type 明确选择模式；图标按钮提供可访问名称",
  toggle: "表达可按下的单一状态；pressed 由消费层管理；不要替代会立即改变系统设置的 Switch",
  tooltip: "解释不熟悉的图标或缩写；内容保持一句话；关键信息不能只在悬停时出现",
};

const adviceByGroup = {
  basic: [
    "优先使用组件公开的 variant、size 和语义 props，样式差异由主题 token 统一处理。",
    "只有原生 API 和主题 token 都无法满足需求时，才在 scopify 层复制并扩展。",
    "交互元素必须保留键盘焦点、禁用态和清晰的可访问名称。",
  ],
  conversation: [
    "消息数据、流式状态和反馈请求保留在消费层，组件只负责展示与交互结构。",
    "为动态新增内容维护稳定的焦点和滚动位置，避免打断正在阅读的用户。",
    "头像、时间和状态是辅助信息，正文应保持最高阅读优先级。",
  ],
  "data-display": [
    "组件只接收整理后的展示数据，获取、缓存和业务计算留在应用层。",
    "为加载、空数据和异常状态准备与最终内容尺寸接近的替代视图。",
    "复杂数据在窄屏下应提供滚动、折叠或简化视图。",
  ],
  feedback: [
    "反馈应紧邻触发它的操作，并使用一致的成功、警告和错误语义。",
    "不要只靠颜色表达状态；同时提供文本、图标或可访问说明。",
    "短时反馈使用通知，必须处理的信息应保留在页面内容中。",
  ],
  form: [
    "每个控件都要有可访问标签，并在错误时同步 aria-invalid 与错误文本。",
    "受控值、校验和提交逻辑由消费层管理，基础组件不耦合具体表单模型。",
    "使用单一状态来源，避免同时传入 value 与 defaultValue。",
  ],
  navigation: [
    "当前项、焦点项和禁用项必须在视觉与语义上都能区分。",
    "路由决策留在应用层，基础组件只接收链接、状态与回调。",
    "保证完整键盘路径，并避免将主要入口只放进隐藏菜单。",
  ],
  overlay: [
    "打开后应把焦点移动到浮层，关闭时恢复到触发器。",
    "标题与说明用于建立可访问语义；危险操作要明确描述后果。",
    "轻量补充用 Popover，聚焦任务用 Dialog，边缘工作区用 Sheet 或 Drawer。",
  ],
};

const accordionVariants = `
## 变体

### 单项展开

使用 \`type="single"\` 让同一时间只展开一个条目；增加 \`collapsible\` 后，当前条目可以再次收起。

\`\`\`tsx
<Accordion type="single" collapsible defaultValue="lyrics">
  <AccordionItem value="lyrics">
    <AccordionTrigger>歌词信息</AccordionTrigger>
    <AccordionContent>歌词支持逐字时间轴与桌面歌词。</AccordionContent>
  </AccordionItem>
</Accordion>
\`\`\`

### 多项展开

使用 \`type="multiple"\` 接收字符串数组，让用户同时对比多个区块。

\`\`\`tsx
<Accordion type="multiple" defaultValue={["lyrics", "album"]}>
  <AccordionItem value="lyrics">...</AccordionItem>
  <AccordionItem value="album">...</AccordionItem>
</Accordion>
\`\`\`

### 禁用条目

把 \`disabled\` 放在单个 \`AccordionItem\` 上，保留条目位置并明确表示当前不可用。

\`\`\`tsx
<AccordionItem value="copyright" disabled>
  <AccordionTrigger>版权信息</AccordionTrigger>
  <AccordionContent>当前地区暂不可用。</AccordionContent>
</AccordionItem>
\`\`\`
`;

function findFiles(root, extension) {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(root, entry.name);
    return entry.isDirectory()
      ? findFiles(entryPath, extension)
      : entryPath.endsWith(extension)
        ? [entryPath]
        : [];
  });
}

function findReturn(node) {
  if (ts.isReturnStatement(node) && node.expression) return node.expression;
  let result;
  ts.forEachChild(node, (child) => {
    if (!result) result = findReturn(child);
  });
  return result;
}

function collectPreviewCode() {
  const result = new Map();
  for (const file of findFiles(previewRoot, ".tsx")) {
    const sourceText = fs.readFileSync(file, "utf8");
    const sourceFile = ts.createSourceFile(
      file,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    sourceFile.forEachChild(function visit(node) {
      if (
        ts.isCaseClause(node) &&
        ts.isStringLiteral(node.expression) &&
        node.expression.text.startsWith("shadcn-")
      ) {
        const returned = findReturn(node);
        if (returned) {
          let code = returned.getText(sourceFile).trim();
          if (code.startsWith("(") && code.endsWith(")")) code = code.slice(1, -1).trim();
          result.set(node.expression.text.slice("shadcn-".length), { code, file });
        }
      }
      ts.forEachChild(node, visit);
    });
    for (const slug of ["message-scroller", "sidebar"]) {
      if (path.basename(file) === `shadcn-${slug}-preview.tsx`) {
        const returned = findReturn(sourceFile);
        if (returned) {
          let code = returned.getText(sourceFile).trim();
          if (code.startsWith("(") && code.endsWith(")")) code = code.slice(1, -1).trim();
          result.set(slug, { code, file });
        }
      }
    }
  }
  return result;
}

function collectExports(slug) {
  const source = fs.readFileSync(path.join(componentRoot, `${slug}.tsx`), "utf8");
  const exports = [...source.matchAll(/export\s*\{([\s\S]*?)\}/g)].flatMap((match) =>
    match[1]
      .split(",")
      .map((name) => name.replace(/\/\/.*$/gm, "").trim())
      .filter(Boolean),
  );
  return exports;
}

function formatImport(slug, exports) {
  const source = `@scopify/ui/shadcn/components/${slug}`;
  if (exports.length === 1) return `import { ${exports[0]} } from "${source}";`;
  return `import {\n${exports.map((name) => `  ${name},`).join("\n")}\n} from "${source}";`;
}

function formatComposition(exports) {
  const components = exports
    .map((name) => name.replace(/^type\s+/, ""))
    .filter((name) => /^[A-Z]/.test(name));
  if (components.length === 0) return "该模块以 hooks 和样式工具为主要公开接口。";
  if (components.length === 1) return components[0];
  return `${components[0]}\n${components
    .slice(1)
    .map((name) => `├── ${name}`)
    .join("\n")}`;
}

const previewCode = collectPreviewCode();
const componentFiles = findFiles(contentRoot, ".mdx").filter(
  (file) => path.basename(file) !== "index.mdx",
);

for (const file of componentFiles) {
  const current = fs.readFileSync(file, "utf8");
  const frontmatter = current.match(/^---\r?\n[\s\S]*?\r?\n---/)?.[0];
  const title = current.match(/^title:\s*(.+)$/m)?.[1]?.trim();
  const description = current.match(/^description:\s*(.+)$/m)?.[1]?.trim();
  const slug = current.match(/name="shadcn-([^"]+)"/)?.[1];
  if (!frontmatter || !title || !description) throw new Error(`Invalid component page: ${file}`);
  if (!slug) continue;
  if (slug === "button") continue;
  if (!patterns[slug]) throw new Error(`Missing patterns for ${slug}`);
  const group = path.relative(contentRoot, file).split(path.sep)[0];
  const exports = collectExports(slug);
  const preview = previewCode.get(slug);
  if (!preview) throw new Error(`Missing preview code for ${slug}`);
  const patternList = patterns[slug]
    .split("；")
    .map((item) => `- ${item}。`)
    .join("\n");
  const adviceList = adviceByGroup[group].map((item) => `- ${item}`).join("\n");
  const exportList = exports.map((name) => `\`${name.replace(/^type\s+/, "")}\``).join("、");
  const officialUrl = `https://ui.shadcn.com/docs/components/radix/${slug}`;
  const code = preview.code;
  const body = `${frontmatter}

<ShadcnComponentExample name="shadcn-${slug}" />

${description}上方示例直接渲染 \`@scopify/ui\` 中的真实组件，可以操作并观察其状态变化。

## 安装

该组件已经通过 shadcn CLI 安装在共享 UI 包。需要与上游重新同步时，在仓库根目录运行：

\`\`\`bash
cd repo/frontend/packages/ui
bunx shadcn@latest add ${slug}
\`\`\`

CLI 文件属于 \`shadcn/\` vendor 层；产品特有扩展应放在 \`scopify/\`，不要直接改写原生实现。

## 导入

\`\`\`tsx
${formatImport(slug, exports)}
\`\`\`

## 用法

下面是上方交互预览的核心结构。业务状态、路由、请求和 i18n 仍由消费层提供。

<ShadcnCodeExample code={String.raw\`${code}\`} />

## 组件结构

\`\`\`text
${formatComposition(exports)}
\`\`\`

## 常见用法

${patternList}

${slug === "accordion" ? accordionVariants : ""}
## 使用建议

${adviceList}

## API 参考

当前模块公开 ${exportList}。实际 props 继承自对应的 Radix primitive 或原生 HTML 元素，并叠加 shadcn 的样式与 slot 约定。

完整的交互模式、可访问性说明和底层 props 请查看 [shadcn/ui ${title} 文档](${officialUrl})；实现差异以本仓库当前 CLI 源码为准。
`;
  fs.writeFileSync(file, body.replace(/\n{3,}/g, "\n\n"), "utf8");
}

console.log(`Generated ${componentFiles.length} shadcn component guides.`);

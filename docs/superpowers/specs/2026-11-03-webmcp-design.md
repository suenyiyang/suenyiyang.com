# 博客 WebMCP 支持方案

状态：已实现（P1–P3 + P4 配置位；origin trial token 待线上注册）
日期：2026-11-03

## 1. 判断

WebMCP 让页面把「工具」注册给浏览器内的 AI agent：agent 不再靠抓 HTML + 模拟点击，
而是直接调用你声明的函数。对本博客这类纯静态、内容型站点，收益是：

- agent 能一次调用拿到结构化正文（markdown），而不是受 HTML/组件噪声污染；
- agent 能驱动站内 UI（筛选标签、跳转），而不是猜 DOM 选择器；
- 站点多一个「可被 agent 使用」的入口，与 RSS / sitemap 同级。

成本很低：本仓库是 `prerender: true` + `ssr: false` 的 SSG，工具天然跑在客户端，
不需要新增 Worker / API。核心实现约 150–200 行 + 一份内容索引。

结论：**做，但只做只读工具**，并把「内容索引」和「WebMCP 适配层」解耦——
索引后续可复用于 `llms.txt`、远程 MCP server、站内搜索。

非目标：

- 不做任何写入类工具（发评论、订阅、改配置），避免授权与滥用面；
- 不追求跨浏览器可用（WebMCP 目前是 Chrome origin trial）。

## 2. 架构

```
pages/**/*.mdx + thoughts/*.md
        │
        ▼  (Vite plugin, build time)
virtual:content-index        ← 纯文本 ContentRecord[]，无 MDX/React
        │
        ▼  (dynamic import，仅在工具被调用时拉取)
src/webmcp/tools/*.ts        ← 纯函数：search / list / get
        │
        ▼
src/webmcp/model-context.ts  ← 能力检测 + polyfill + 注册/注销
        │
        ▼
document.modelContext        ← 原生(Chrome 149+) 或 @mcp-b/webmcp-polyfill
```

关键点：

1. **索引与渲染解耦。** 不直接复用 `content-collections/generated`（含 MDX 编译产物，
   90KB+ 且会在多页被静态引入）。新增 `virtual:content-index`，只含
   `{kind,id,title,date,description,tags,url,content}` 的纯字符串，工具在 `execute`
   里 `await import()`，Vite 单独切 chunk，**普通访客零额外字节**。
2. **能力检测集中在一处。** WebMCP 的入口已经变过（`navigator.modelContext` →
   `document.modelContext`，`provideContext()` 已被移除），所有访问都走
   `getModelContext()`，将来再变只改一个函数。
3. **注册跟着组件生命周期走。** 全局工具在 `root.tsx` 挂一次；路由级工具用
   `useWebMcpTools()` + `AbortController`，路由切换自动注销，避免重名注册报错。
4. **失败静默。** 任何 `registerTool` 异常只 `console.warn`，绝不打断 hydration。

## 3. 工具清单

命名约定：全局工具 `site_*` / `content_*`，路由级工具 `page_*`（避免重名冲突）。

| 工具 | 入参 | 行为 | annotations |
|---|---|---|---|
| `get_site_info` | — | 作者、站点简介、社交链接、RSS | `readOnlyHint: true` |
| `search_content` | `query`, `kind?`(post/thought/page/all), `limit?` | 标题/摘要/标签/正文加权检索，返回 url + 摘要 | `readOnlyHint: true` |
| `list_posts` | `tag?`, `year?`, `limit?` | 按时间倒序列出文章 | `readOnlyHint: true` |
| `get_post` | `path` | 返回文章元信息 + **完整 markdown 正文** | `readOnlyHint: true` |
| `list_thoughts` | `since?`, `limit?` | 想法列表（短文本，含全文） | `readOnlyHint: true` |
| `get_thought` | `id` | 单条想法 | `readOnlyHint: true` |
| `open_page` | `path` | 站内跳转（`/posts`、`/about`…） | `readOnlyHint: false` |
| `page_get_context` | — | 当前路由的 path/title/目录 headings/字数 | `readOnlyHint: true` |
| `page_filter_posts_by_tag` | `tag` | 只在 `/posts` 注册，驱动 React 状态筛选 | `readOnlyHint: false` |

设计约束：

- **返回对象而非长字符串**，字段短、可截断（单次结果 ≤ 8KB，超出标注 `truncated: true`）。
- 每个结果都带 `url`（绝对地址），agent 需要引用/展示时可直达。
- 检索评分：标题 5 / 标签 3 / 摘要 2 / 正文 1；多词 AND；中文按子串匹配（不引入分词库）。
- 错误用返回值表达（`{ error: "post_not_found", hint: ... }`）而不是抛异常，
  避免 agent 侧拿到无信息的 rejection。

## 4. 核心代码

### 4.1 能力检测 + 注册

```ts
// src/webmcp/model-context.ts
export interface WebMcpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
    consequentialHint?: boolean;
  };
  execute: (input: any, ctx: { signal: AbortSignal }) => Promise<unknown>;
}

type ModelContext = {
  registerTool: (tool: WebMcpTool, opts?: { signal?: AbortSignal }) => Promise<void>;
  getTools: () => Promise<unknown[]>;
};

/** 唯一入口：兼容 document.modelContext 与旧版 navigator.modelContext。 */
function getModelContext(): ModelContext | undefined {
  if (typeof document === "undefined") return undefined;
  return (document as any).modelContext ?? (navigator as any).modelContext;
}

let polyfill: Promise<void> | null = null;

async function ensureModelContext(): Promise<ModelContext | undefined> {
  const native = getModelContext();
  if (native) return native;
  // 非 Chrome 149+：空闲时懒加载 polyfill，不阻塞首屏。
  polyfill ??= import("@mcp-b/webmcp-polyfill").then(({ installWebMCP }) => {
    installWebMCP();
  });
  await polyfill;
  return getModelContext();
}

export async function registerTools(tools: WebMcpTool[], signal?: AbortSignal) {
  const ctx = await ensureModelContext();
  if (!ctx || signal?.aborted) return;
  for (const tool of tools) {
    try {
      await ctx.registerTool(tool, { signal });
    } catch (error) {
      if (!signal?.aborted) console.warn("[webmcp] register failed:", tool.name, error);
    }
  }
}
```

polyfill 触发时机：`requestIdleCallback`（3s 超时兜底）后再加载，首屏不受影响。

### 4.2 React Hook

```tsx
// src/webmcp/use-webmcp-tools.ts
export function useWebMcpTools(tools: WebMcpTool[]) {
  useEffect(() => {
    const controller = new AbortController();
    registerTools(tools, controller.signal);
    return () => controller.abort();   // 路由切走 / 卸载即注销
  }, [tools]);
}
```

`tools` 必须用 `useMemo` 稳定引用；root 里传模块级常量数组。

### 4.3 路由级状态联动

`PostList` 目前把 `activeTag` 放在组件内。要让 `page_filter_posts_by_tag` 驱动它：

- 抽出 `src/stores/posts.ts`（仓库已有 jotai）：`activeTagAtom`、`setActiveTagAtom`；
- `PostList` 读取 atom，按钮写 atom；
- `/posts` 路由组件注册 `page_filter_posts_by_tag`，`execute` 里调用 setter。

这样「agent 操作 UI」和「人点标签」走同一条状态链，不会出现双份真相。

## 5. 内容索引

```ts
// config/webmcp-index.ts —— Vite plugin，产出 virtual:content-index
export interface ContentRecord {
  kind: "post" | "thought" | "page";
  id: string;          // 文章用 path，想法用 thought.id
  title: string;
  date?: string;
  description?: string;
  tags?: string[];
  url: string;         // 绝对地址
  content: string;     // 原始 markdown（已剔除 import/JSX 行）
}
```

- posts/pages：复用 `config/seo-files.ts` 的 `walkMdx` + `gray-matter` 读取；
- thoughts：复用 `config/thoughts.ts` 的 `readThoughts()`（已过滤 draft、已排序）；
- 对正文做轻量清洗：去掉 `import`/`export` 行、`<Component ...>` 自闭合块，
  保留代码块与图片语法（agent 需要图注和代码）；
- 体积预算：当前 8 篇文章 + 想法约 100–150KB 原始 / 30–40KB gzip，
  仅在被调用时下载，可接受。若后续增长，再按 kind 拆多个 chunk。

索引同时是 `llms.txt` 生成器的输入（见 §9）。

## 6. 声明式 API

本仓库目前没有「值得被 agent 提交」的表单。声明式 API 只在真的存在表单时才有价值，
因此：

- 现阶段不用声明式，避免为了用 API 而造一个假表单；
- 若将来加站内搜索框：给搜索 `form` 加 `toolname="search_posts"`、
  `tooldescription`、`toolautosubmit`，在 `submit` 里判断
  `event.agentInvoked` 后 `event.preventDefault()` + `event.respondWith(result)`；
- 评论表单是 Waline 第三方渲染，不要用 MutationObserver 硬塞属性——不可控；
- 可选渐进增强：给 `form:tool-form-active` / `input:tool-submit-active` 补一套
  符合本站配色的 outline，让 agent 预填时用户看得见。

## 7. 兼容与降级

| 场景 | 行为 |
|---|---|
| Chrome 149+（origin trial 已注册） | 原生 `document.modelContext`，polyfill 不加载 |
| 本地开发 | `chrome://flags/#enable-webmcp-testing` 开启后测试 |
| 其他浏览器 / 无 API | 空闲时加载 polyfill，agent（扩展、浏览器内 AI）可用 |
| 无 agent、普通访客 | 零影响：不发请求、不加载索引、不加载 polyfill |
| SSR / 预渲染阶段 | `typeof document === "undefined"` 直接返回，不产生 hydration 差异 |

Origin trial 接入：

1. 在 Chrome origin trial 页面为 `https://suenyiyang.com` 注册，拿到 token；
2. 在 `root.tsx` `<head>` 注入
   `<meta http-equiv="origin-trial" content={__INJECTED_ORIGIN_TRIAL__}>`；
3. token 通过环境变量注入（`config/env.ts` 加一个导出），本地不注入；
4. 注意 token 有有效期（约半年），到期需更换——写进 README 的维护清单。

## 8. 验证与测试

1. **纯函数单测**（沿用 `tsx --test`，`tests/webmcp.test.ts`）
   - `searchContent` 命中标题/标签/正文；空结果；limit 生效；
   - `getPost` 未知 path 返回结构化错误；
   - 工具 schema 自检：name 唯一且 `^[a-z][a-z0-9_]*$`、description ≥ 20 字符、
     `required` 字段都在 `properties` 里、`annotations.readOnlyHint` 对只读工具为 true。
2. **Playwright 桩测试**（不依赖浏览器 flag）
   - `addInitScript` 注入假的 `document.modelContext` 记录器；
   - 首页断言已注册工具名集合；执行一次 `search_content` 断言返回结构；
   - 从 `/posts` 导航到文章页，断言 `page_*` 工具被注销（记录 abort 调用）。
3. **真机冒烟**（手动，写进 PR 说明）
   ```js
   (await document.modelContext.getTools()).map(t => t.name);
   const t = (await document.modelContext.getTools()).find(t => t.name === "search_content");
   await document.modelContext.executeTool(t, { query: "agent" });
   ```
4. **回归**：`pnpm lint`、`pnpm build`、`pnpm test:e2e`（现有用例覆盖 hydration 标记）。

## 9. 曝光与观测

- **埋点**：`execute` 包装器里统一 `gtag("event", "webmcp_tool_call", { tool, ok, ms })`。
  先看有没有人用：连续 2–3 个月零调用，就说明现阶段投入不值得继续加工具。
- **给非浏览器 agent 的替代入口**（与 WebMCP 互补，不重叠）：
  - 由同一份索引生成 `/llms.txt`：站点简介 + 文章列表 + 关键链接；
  - 已有 `/rss.xml`、`/sitemap.xml` 保持不变；
  - 若确有需求，再在 Cloudflare Pages Functions 上加 `/mcp`（SSE/HTTP 远程 MCP），
    直接 import 同一批纯函数 tool handler，零重复逻辑。
- README 增加一节「AI/agent 入口」，说明 WebMCP 支持范围与降级路径。

## 10. 安全

- 全部只读，`consequentialHint` 一律 false；不暴露 Waline API、不暴露任何 token。
- 正文是站主自撰 → `untrustedContentHint: false`。若将来工具返回评论/第三方
  摘要，必须置 true（提示 agent 需要隔离处理，防间接提示注入）。
- 输出截断 + 明确 `truncated` 标记，防止 agent 上下文被单次结果打爆。
- 转发 `AbortSignal`：用户取消时中断 `fetch`/setTimeout，避免幽灵执行。
- 不在工具里做跨域请求，全部读本地索引，天然规避 SSRF / 数据外泄。

## 11. 分阶段落地

| 阶段 | 内容 | 估时 |
|---|---|---|
| P0 | 本地 flag 冒烟：临时脚本注册一个 `ping` 工具，确认 `getTools()` 可见 | 0.5h |
| P1 | `model-context.ts` + `useWebMcpTools` + 索引 plugin + 3 个只读工具（`get_site_info`/`search_content`/`get_post`） | 3–4h |
| P2 | 其余只读工具、`page_get_context`、`/posts` 标签联动（jotai 重构） | 2–3h |
| P3 | 单测 + Playwright 桩测试 + GA 埋点 | 2h |
| P4 | origin trial token + 线上验证 + README/docs 更新 | 1h |
| P5（可选） | `/llms.txt` 生成、`/mcp` 远程端点 | 视需求 |

P1+P2 建议一个 PR；P3 同 PR；P4 单独 PR（涉及环境变量与线上 token）。

## 12. 风险

1. **规范仍在变。** 半年内已从 `navigator.modelContext` + `provideContext()` 迁到
   `document.modelContext` + `registerTool()`。缓解：单一适配层 + 固定类型包版本
   （`webmcp-types`），升级时只改 `model-context.ts`。
2. **覆盖率被高估。** WebMCP 只在支持它的浏览器/agent 里生效；它不等于「全网 agent
   都能读我的博客」。真正的通用入口仍是 `llms.txt` / RSS / 可抓取的静态 HTML。
3. **Origin trial 有时效。** token 过期后工具静默失效（页面不报错），需要日历提醒更换。
4. **重复注册。** 路由切换或 StrictMode 双调用会撞名。缓解：`AbortController`
   清理 + 命名空间约定 + 注册失败只 warn。
5. **索引体积膨胀。** 文章变多后单 chunk 变大。缓解：按 kind 拆分、或在 P5 改成
   按需切片（每篇一个 chunk，`search` 只查元数据）。

## 13. 落地记录

实现文件：

- `src/webmcp/types.ts` — 本地结构化类型，不依赖 `webmcp-types` 的全局增强。
- `src/webmcp/content.ts` — 纯函数（检索/列表/取正文），Node 可直接测。
- `src/webmcp/definitions.ts` — 9 个全局工具 + 1 个 `/posts` 路由工具，依赖注入。
- `src/webmcp/model-context.ts` — 能力检测、polyfill 懒加载、注册去重、GA 埋点。
- `src/webmcp/use-webmcp-tools.ts` — 生命周期注册（native 立即，polyfill 走 idle）。
- `src/webmcp/register.tsx` — 全局工具装配 + `useNavigate` 桥。
- `config/content-index.ts` + `virtual:content-index` — 构建期纯文本索引。
- `src/stores/posts.ts` — 标签筛选 atom（工具与 UI 共用）。

验证结果：

| 项 | 结果 |
|---|---|
| `pnpm lint` / `tsc -b` / `pnpm build` | 通过 |
| `pnpm webmcp:test` | 14 个用例通过 |
| Playwright `webmcp.spec.ts`（桩 API） | 7/7 通过（chromium/firefox/webkit） |
| Playwright `webmcp-polyfill.spec.ts`（真实 polyfill） | 通过；Playwright Chromium 143 无原生 API，确认走的是 polyfill 分支 |
| Paseo 浏览器实测（真实 webview） | 10 个工具注册；`get_post` 返回 2428 字符正文；`search_content` 命中 Paseo 一文；`open_page` 完成 SPA 跳转 |
| agent-browser 实测（Chrome 156 headless，polyfill 路径） | 10 个工具注册；`get_post` 2082 字符、代码块保留、MDX import 已剔除；`search_content`/`list_posts`/`get_current_page` 正常；`open_page` SPA 跳转后路由工具自动注销；索引 chunk 仅在调用工具时才请求；无 page error |

产物体积：索引单独 chunk 87KB（gzip 后约 30KB），不在任何路由的静态依赖里；
polyfill 单独 chunk 32KB，仅在无原生 API 时按需加载。

已知偏差：

1. **`page_filter_posts_by_tag` 目前是休眠状态**：`pages/posts/*` 都没有 `tags`
   frontmatter，`list_tags` 返回空数组，工具会返回 `unknown_tag`。给文章补上
   `tags:` 后，现有筛选 UI 与该工具会同时生效。
2. **origin trial token 未注入**：本机 Chrome 156 stable 用 `--enable-features/--enable-blink-features=WebMCP*` 均无法唤起原生 API，说明它只认已注册的 origin trial token（或 Dev/Canary）。`ORIGIN_TRIAL` 环境变量与 `<meta>` 注入已就位，
   但 token 需要在 Chrome origin trial 页面为 `https://suenyiyang.com` 注册后填入。
   在此之前，原生 API 只在本机 flag 下可用，线上访客走 polyfill 分支。
3. **视觉回归有 4 条既有失败**：`e2e/snapshots/visual.spec.ts-snapshots` 拍摄于
   2026-10-18，而 `posts/my-setup-for-using-agents` 是 2026-10-24 新增的，首页多了
   一条，属基线过期，与本次改动无关。

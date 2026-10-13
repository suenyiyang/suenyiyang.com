# Thoughts 内容组织与 frontmatter 规范

Thoughts 是短观点、疑问与后续回应的长期档案。首页是时间流；单个问题以想法线阅读；精选可用 Then & Now 对照。**旧观点留在当时，变化作为新记录发布**，不要改写旧文来抹掉想法演变。

## 文件组织

```text
thoughts/
  2024/
    2024-03-12-positioning-question.md
  2026/
    2026-06-18-positioning-response.md
    2026-07-01-positioning-revision.md
```

- 一条记录一个 `.md` 文件，目录按原始发布时间年份整理。
- 文件名推荐 `YYYY-MM-DD-简短英文描述.md`，便于在编辑器里找；目录和文件名不参与 URL。
- `thoughts/` 下只放内容文件。规范、模板和测试样例放在外面，防止意外发布。
- 正文使用标准 Markdown：段落、标题、列表、链接、代码、图片等沿用博客的 Markdown 渲染流程。不要在 Thoughts 正文写 JSX、组件、import 或 export。
- 当前仓库的正式目录为空，**不把 Demo 的虚构内容发布成作者真实观点**。

## 完整 frontmatter

```yaml
---
id: positioning-response-2026
date: "2026-06-18T21:30:00+08:00"
title: 写了一段时间，才看见自己的定位
thread: writing-positioning
kind: thought
tags: [写作, 长期主义]
draft: false
featured: true
relations:
  - type: response
    target: positioning-question-2024
source:
  platform: x
  url: https://x.com/your_handle/status/1234567890123456789
  archivedAt: "2026-06-19T10:00:00+08:00"
---

这里写正文。示例中的 X 链接只是格式示范，应替换为自己的真实原帖，
没有原帖时删除整个 source 字段。
```

| 字段 | 必填 / 默认值 | 规范 |
| --- | --- | --- |
| `id` | 必填 | 全站唯一，英文小写字母、数字及单个连字符；发布后不改，不能重复 |
| `date` | 必填 | **加引号**的 ISO 8601 时间，包含时区，如 `"2024-03-12T22:10:00+08:00"`；记下原观点的时间，而非导入时间 |
| `title` | 必填 | 1–120 字，单条记录的标题，时间流显示它 |
| `thread` | 可选 | 想法线稳定 slug，格式同 `id`；独立记录省略时自动使用自己的 `id` |
| `threadTitle` | 可选 | 只在想法线第一条记录设置，如「写作需要先想清楚定位吗？」；缺省使用第一条记录的 `title` |
| `kind` | `thought` | `question` 或 `thought`；第一条的类型决定单条想法线是「尚无回答」还是「独立想法」 |
| `tags` | `[]` | 字符串列表；用于首页筛选，可用中文 |
| `draft` | `false` | `true` 时不发布、不生成页面、不打包正文 |
| `featured` | `false` | 同一想法线任意已发布记录设为 `true`，即可进入精选对照；无需为每一条重复设置 |
| `relations` | `[]` | 指向旧记录的关联列表，每个条目只有 `type` 与 `target` |
| `source` | 可选 | 自己的 X 原帖来源；只接受 `https://x.com/用户/status/数字ID` 或同格式 twitter.com 链接 |
| `source.archivedAt` | 可选 | 从 X 收录到博客的时间，与原文时间分开；同样是带时区且加引号的 ISO 字符串 |

字段名区分大小写。未知字段会导致构建失败，避免把 `relation`、`published` 等误拼字段静默忽略。不要用纯日期，也不要使用 YAML 无引号日期（可能被解析成 Date 对象）。

## 想法线与关联规则

- 每条想法线必须恰好有一条**没有 relations 的第一条记录**。
- 后续记录沿用第一条的 `thread`，并明确关联一个或多个同线旧记录。
- `target` 是旧记录的 `id`，不是文件路径，也不是 thread slug。
- 关联必须指向**严格更早**的记录；这样不会出现循环引用。
- 同一新记录不能对同一 target 重复关联。需要同时补充并修正时，选择主要关系并在正文解释。
- 可对不同旧记录建立多个关联，可以分叉，不要求每条只回应紧邻的上一条。
- 当前版本不支持跨想法线的语义关联；普通相关内容可在正文放链接。想把两个问题合并到一条线时，需要有意识地整理 thread，而非制造悬空关联。
- 无回答和独立随想都是合法状态，不需要为了凑时间轴补写答案。
- 「已有后续」只代表存在关联记录，**不等于问题已经彻底解决**。
- 旧记录的「后来有了回应」由新记录的 relations 自动反推，不需要修改旧文件。

| `type` | 展示名称 | 适用 |
| --- | --- | --- |
| `response` | 回应 | 对当时的疑问给出现在的回答 |
| `expansion` | 补充 | 增加背景、边界或新的角度 |
| `revision` | 修正 | 改变原判断，说明是什么经历或证据导致变化 |
| `practice` | 个人验证 | 个人实践支持/不支持了原假设；不能当作普遍有效的证明 |

## 示例一：记录当时的问题

文件 `thoughts/2024/2024-03-12-positioning-question.md`：

```markdown
---
id: positioning-question-2024
date: "2024-03-12T22:10:00+08:00"
title: 不知道定位时，是不是不该开始写？
thread: writing-positioning
threadTitle: 写作需要先想清楚定位吗？
kind: question
tags: [写作]
---

我现在困惑的是……当时的背景是……
```

## 示例二：两年后回应

文件 `thoughts/2026/2026-06-18-positioning-response.md`：

```markdown
---
id: positioning-response-2026
date: "2026-06-18T21:30:00+08:00"
title: 写了一段时间，才看见自己的定位
thread: writing-positioning
tags: [写作]
featured: true
relations:
  - type: response
    target: positioning-question-2024
---

回应两年前的问题。后来我做了什么，以及目前如何理解它……
```

## 示例三：进一步修正

文件 `thoughts/2026/2026-07-01-positioning-revision.md`：

```markdown
---
id: positioning-revision-2026
date: "2026-07-01T20:00:00+08:00"
title: 仍然需要一个可变化的粗定位
thread: writing-positioning
tags: [写作]
relations:
  - type: revision
    target: positioning-response-2026
  - type: expansion
    target: positioning-question-2024
---

我改变了哪一部分判断，哪些还保留，什么促成了这次变化……
```

以上是写法示例，不是作者真实陈述。复制后需要替换正文与日期，不要照搬发布。

## URL 与浏览

- 时间流：`/thoughts`
- 精选：`/thoughts?view=featured`
- 完整想法线：`/thoughts/writing-positioning`
- 单条固定链接：`/thoughts/writing-positioning#positioning-response-2026`
- 对照：`/thoughts/writing-positioning?view=compare#positioning-response-2026`

发布后不要修改 `id` 和 `thread`，否则会破坏外部固定链接。后续记录用时间轴阅读，前后关联可以直接跳到节点；浏览器返回恢复时间流位置。没有动态后端，全部页面在构建时静态生成。

## 草稿、校验与发布流程

1. 新建 Markdown，先设 `draft: true`；只校验格式，不对外发布。
2. 写好正文和关联，检查发布时间及 target。
3. 运行 `pnpm thoughts:check`，检查 schema、重复 ID、缺失 target、跨线关联、时间顺序、重复 target、缺失/重复第一条记录等。
4. 准备发布时改为 `draft: false` 或删除 draft 字段；已发布记录不能引用草稿，也不能属于尚未发布的第一条记录。
5. 运行 `pnpm build`，确认首页与想法线的静态 HTML；发布仍走仓库已有的 PR/部署流程。

草稿也会参与格式与图结构校验，避免等发布时才发现断链。修改旧文的错别字可以原位修改；观点变化必须新建记录。删除被引用的记录会导致校验失败。验证脚本亦可运行：`pnpm thoughts:test`。

## X 与正文归档

博客保存原生正文；`source` 只是可选原帖链接。可以先写博客再发 X，也可以把自己的 X 原文收录回来。`date` 用原帖时间，`archivedAt` 用收录时间。

这版只提供来源链接，**没有自动同步、自动发帖或真实嵌入**。不因为来源失效而删除本地正文，也不加载第三方嵌入脚本。未来如需嵌入，建议读者主动点击后再加载，原生正文始终保留。

## 本地交互测试样例

虚构内容只放在 `e2e/fixtures/thoughts/`。要本地预览：

```sh
THOUGHTS_DIR=e2e/fixtures/thoughts pnpm dev
```

新增一条想法线（新的 thread）后，重启开发服务器以重新计算静态路由；同线正文更新会自动刷新。正式构建每次都会重新扫描所有已发布内容。

**不要在正式部署环境配置 THOUGHTS_DIR 为测试目录。** 默认构建只读取正式 `thoughts/`。这里的环境覆盖用于自动化测试和本地预览。

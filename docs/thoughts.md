# Thoughts

Thoughts 是一个单页。构建时读取 `thoughts/` 目录下所有 Markdown，按时间从新到旧平铺，不生成每篇独立页面。

## 文件

```text
thoughts/
  2026/
    2026-07-12-a-small-note.md
  another-note.md
```

目录可以按年份整理，也可以平放。文件名不参与 URL。`draft: true` 的文件不发布。

## Frontmatter

```yaml
---
id: a-small-note
date: "2026-07-12T21:30:00+08:00"
title: 一个还没想完的问题
draft: false
---
```

| 字段 | 规则 |
| --- | --- |
| `id` | 必填、全站唯一。只使用小写字母、数字和单个连字符。发布后不要修改，因为它就是 `#a-small-note` 固定链接。 |
| `date` | 必填。带时区并加引号的 ISO 时间，决定排序。 |
| `title` | 必填，1–120 字。页面把它渲染为该篇的一级标题。 |
| `draft` | 可选，默认 `false`。 |

未知字段会使构建失败。正文使用普通 Markdown，不写 JSX 或组件。

## 标题与目录

- 每篇 frontmatter 的 `title` 是该篇唯一的页面一级标题。
- Markdown 里的 `#` 渲染为二级标题，`##` 渲染为三级标题，以此类推。
- 页面目录只列出每篇的一级标题，不列出正文内部标题。
- 每篇容器和标题链接都使用 `#id`，可以直接分享或跳转。

## 展开与收起

正文超过约 28rem 时默认收起，并提供「展开 / 收起」。通过 `#id` 打开页面时，目标那一篇会自动展开并滚到标题处。

## 检查

```sh
pnpm thoughts:check
pnpm thoughts:test
```

测试样例只放在 `e2e/fixtures/thoughts/`。本地预览运行：

```sh
THOUGHTS_DIR=e2e/fixtures/thoughts pnpm dev
```

不要在正式部署环境把 `THOUGHTS_DIR` 指向测试目录。

import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { readThoughts } from "../config/thoughts";

test("reads nested Markdown, sorts newest first, and omits drafts", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "thoughts-"));
  try {
    mkdirSync(path.join(dir, "2024"));
    writeFileSync(path.join(dir, "2024/older.md"), `---
id: older
date: "2024-01-01T00:00:00+08:00"
title: Older
---
Older body.
`);
    writeFileSync(path.join(dir, "newer.md"), `---
id: newer
date: "2026-01-01T00:00:00+08:00"
title: Newer
---
Newer body.
`);
    writeFileSync(path.join(dir, "draft.md"), `---
id: hidden
date: "2027-01-01T00:00:00+08:00"
title: Hidden
draft: true
---
SECRET_DRAFT
`);
    assert.deepEqual(readThoughts(dir).map((note) => note.id), ["newer", "older"]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("rejects duplicate ids, unknown fields, and empty bodies", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "thoughts-invalid-"));
  try {
    const write = (name: string, body: string) => writeFileSync(path.join(dir, name), body);
    write("a.md", `---
id: same
date: "2026-01-01T00:00:00+08:00"
title: A
---
Body
`);
    write("b.md", `---
id: same
date: "2026-01-02T00:00:00+08:00"
title: B
---
Body
`);
    assert.throws(() => readThoughts(dir), /Duplicate thought id/);

    rmSync(path.join(dir, "b.md"));
    write("bad.md", `---
id: bad
date: "2026-01-01T00:00:00+08:00"
title: Bad
thread: old-field
---
Body
`);
    assert.throws(() => readThoughts(dir), /Unrecognized key/);

    rmSync(path.join(dir, "bad.md"));
    write("empty.md", `---
id: empty
date: "2026-01-01T00:00:00+08:00"
title: Empty
---
`);
    assert.throws(() => readThoughts(dir), /empty thought body/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

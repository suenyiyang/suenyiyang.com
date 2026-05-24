# Interactive Playground (MVP) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/playground` route — a 2.5D R3F courtyard the visitor walks around with WASD, with a billboard avatar of Yiyang backed by Chrome's Prompt API (Gemini Nano) and a newspaper stand that surfaces the post index.

**Architecture:** A single React Router v7 MDX route loads a client-only `<Playground>` wrapper. Inside, a lazy-loaded `<Scene>` renders the R3F canvas (orthographic camera, programmatic ground/fence/props, billboard avatar). Movement updates a jotai atom; trigger-zone hooks watch player↔prop distance and surface a DOM overlay. DOM overlay modals (chat, posts) sit above the canvas. The chat panel calls a `useGeminiNano` hook that wraps `window.LanguageModel`, registers a `findPost` tool, and gracefully degrades when the API isn't present.

**Tech Stack:** React 19 + React Router v7 SSG + Vite + Tailwind 4 + jotai (existing). New: `three` + `@react-three/fiber` + `@react-three/drei`. Tests: Playwright (existing). No unit-test framework is introduced — verification is dev-server + e2e.

**Spec:** `docs/superpowers/specs/2026-05-24-interactive-playground-design.md`

---

## File Structure

| File | Responsibility |
|---|---|
| `pages/playground.mdx` | Thin MDX route shell, mounts `<Playground />` |
| `src/components/playground/Playground.tsx` | Top-level wrapper, SSG guard, lazy `<Scene>`, mounts overlays |
| `src/components/playground/Scene.tsx` | R3F Canvas, camera, lighting, scene constants, ContactShadows |
| `src/components/playground/Ground.tsx` | 10×10 plane + procedural tile texture |
| `src/components/playground/Fence.tsx` | Programmatic ring of fence posts (InstancedMesh) |
| `src/components/playground/Tree.tsx` | Background-filler tree (cone + cylinder) |
| `src/components/playground/Player.tsx` | Capsule mesh, reads `playerPosAtom`, wires `useKeyboardMovement` |
| `src/components/playground/YiyangAvatar.tsx` | `<Billboard>` plane with `avatar.jpeg` texture |
| `src/components/playground/NewspaperStand.tsx` | Base box + sign plane with procedural label |
| `src/components/playground/TriggerHint.tsx` | DOM overlay capsule reading `nearbyTriggerAtom` |
| `src/components/playground/ChatPanel.tsx` | Gemini Nano chat modal |
| `src/components/playground/PostsModal.tsx` | Newspaper modal, reuses existing `PostList` |
| `src/components/playground/MobileNotice.tsx` | "Best on desktop" overlay for narrow viewports |
| `src/components/playground/useKeyboardMovement.ts` | Hook: WASD/arrow input, bounds-clamped movement |
| `src/components/playground/useTriggerZone.ts` | Hook: distance check; closest-wins trigger |
| `src/components/playground/useGeminiNano.ts` | Hook: availability, lazy session, streaming, tool factory |
| `src/components/playground/posts-context.ts` | Build-time post metadata + `SYSTEM_PROMPT` string |
| `src/components/playground/index.ts` | Barrel re-export of `Playground` |
| `src/stores/playground.ts` | Five jotai atoms (player pos, nearby trigger, active modal, chat messages, gemini state) |
| `src/types/prompt-api.d.ts` | Ambient global types for `window.LanguageModel` |
| `pages/index.mdx` | EDIT — append playground link between Hero and RecentPosts |
| `pages/about.mdx` | EDIT — append single-line link to playground |
| `package.json` | EDIT — add three / @react-three/fiber / @react-three/drei |
| `e2e/fixtures/index.ts` | EDIT — register `PlaygroundPage` fixture |
| `e2e/fixtures/pages/playground-page.ts` | NEW — Page Object Model for playground |
| `e2e/tests/playground.spec.ts` | NEW — e2e tests (page loads, canvas visible, modals open, banner shows) |

---

## Task 1: Install 3D dependencies and add ambient types

**Files:**
- Modify: `package.json`
- Create: `src/types/prompt-api.d.ts`

- [ ] **Step 1: Install three.js + R3F + drei**

```bash
pnpm add three @react-three/fiber @react-three/drei
pnpm add -D @types/three
```

- [ ] **Step 2: Verify lint and build still pass**

Run:
```bash
pnpm lint
pnpm build
```
Expected: both PASS. The new packages should be in `dependencies` (three, R3F, drei) and `@types/three` in `devDependencies`. `pnpm-lock.yaml` updated.

- [ ] **Step 3: Create ambient type declarations for Chrome Prompt API**

Create `src/types/prompt-api.d.ts`:

```ts
export {};

declare global {
  type LanguageModelAvailability =
    | "unavailable"
    | "downloadable"
    | "downloading"
    | "available";

  interface LanguageModelMessage {
    role: "system" | "user" | "assistant";
    content: string;
  }

  interface LanguageModelTool {
    name: string;
    description: string;
    inputSchema: object;
    execute: (input: unknown) => Promise<unknown>;
  }

  interface LanguageModelExpectedIO {
    type: "text";
    languages?: string[];
  }

  interface LanguageModelCreateOptions {
    initialPrompts?: LanguageModelMessage[];
    tools?: LanguageModelTool[];
    expectedInputs?: LanguageModelExpectedIO[];
    expectedOutputs?: LanguageModelExpectedIO[];
    monitor?: (target: EventTarget) => void;
    signal?: AbortSignal;
  }

  interface LanguageModelSession {
    prompt(input: string, options?: { signal?: AbortSignal }): Promise<string>;
    promptStreaming(
      input: string,
      options?: { signal?: AbortSignal }
    ): AsyncIterable<string>;
    destroy(): void;
  }

  interface Window {
    LanguageModel?: {
      availability(): Promise<LanguageModelAvailability>;
      create(options?: LanguageModelCreateOptions): Promise<LanguageModelSession>;
    };
  }
}
```

- [ ] **Step 4: Verify TypeScript picks up the new types**

Run:
```bash
pnpm lint
```
Expected: PASS. The `declare global` should be picked up by `tsconfig.json`'s default `**/*.d.ts` glob (verify it's included).

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml src/types/prompt-api.d.ts
git commit -m "feat: add three/R3F/drei deps + Prompt API ambient types"
```

---

## Task 2: posts-context module (build-time post metadata for system prompt)

**Files:**
- Create: `src/components/playground/posts-context.ts`
- Test: `e2e/tests/playground.spec.ts` (smoke check inline, no separate test file yet)

- [ ] **Step 1: Create the module**

Create `src/components/playground/posts-context.ts`:

```ts
import { allPosts } from "content-collections/generated";

export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  lang: "zh" | "en";
  url: string;
}

const MAX_POSTS_IN_PROMPT = 20;

function toMeta(post: (typeof allPosts)[number]): PostMeta {
  const url = post._meta.path;
  const slug = url.replace(/^\/posts\//, "").replace(/\/$/, "");
  return {
    slug,
    title: post.title ?? slug,
    description: post.description ?? "",
    tags: (post.tags ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    lang: post.lang ?? "zh",
    url,
  };
}

export const postsForPrompt: PostMeta[] = allPosts
  .filter((p) => p._meta.path.startsWith("/posts/") && p._meta.path !== "/posts/")
  .map(toMeta)
  .sort((a, b) => b.url.localeCompare(a.url))
  .slice(0, MAX_POSTS_IN_PROMPT);

export const SYSTEM_PROMPT = `你是 Yiyang Suen —— 一名常驻中国的前端开发者，关注 AI 工具、前端、设计与 UX。访客在博客的 playground 页面遇到了你的 3D 形象。

你的回答应该：
- 简短、口语化（控制在 2–4 句）
- 默认用中文；如果用户用英文提问就用英文回
- 不编造文章。只能从下面的列表里推荐已有的文章
- 当用户的问题明显指向某篇文章时，调用 findPost 工具传 slug，UI 会自动显示文章卡片

下面是博客上的全部文章（JSON）：
${JSON.stringify(postsForPrompt, null, 2)}
`;
```

- [ ] **Step 2: Verify the module compiles and resolves content-collections**

Run:
```bash
pnpm lint
pnpm build
```
Expected: both PASS. The build must produce non-empty `postsForPrompt` (4 posts as of writing).

- [ ] **Step 3: Sanity-check the output by adding a temporary log**

Temporarily add to `src/components/playground/posts-context.ts`:
```ts
console.log("[posts-context]", postsForPrompt.map((p) => p.slug));
```

Run `pnpm build` and check console for: `[posts-context] [ 'understand-your-agents-better', 'review-2025', 'refactor-blog-with-rr7-ssg', 'ai-agent-concepts' ]` (or whatever ordering by url-desc gives — verify all 4 slugs are present and slugs are correct).

Then **remove the console.log line**.

- [ ] **Step 4: Commit**

```bash
git add src/components/playground/posts-context.ts
git commit -m "feat(playground): build-time post metadata + system prompt"
```

---

## Task 3: Jotai store with all five atoms

**Files:**
- Create: `src/stores/playground.ts`

- [ ] **Step 1: Create the store**

Create `src/stores/playground.ts`:

```ts
import { atom } from "jotai";

export type Vec3 = [number, number, number];

export interface NearbyTrigger {
  propId: string;
  label: string;
  onActivate: () => void;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  streaming?: boolean;
  error?: boolean;
  postCard?: {
    title: string;
    description: string;
    url: string;
  };
}

export type GeminiState =
  | "checking"
  | "unavailable"
  | "downloadable"
  | "downloading"
  | "available"
  | "error";

export type ActiveModal = "chat" | "posts" | null;

export const PLAYER_SPAWN: Vec3 = [0, 0.45, 3.5];

export const playerPosAtom = atom<Vec3>(PLAYER_SPAWN);
export const nearbyTriggerAtom = atom<NearbyTrigger | null>(null);
export const activeModalAtom = atom<ActiveModal>(null);
export const chatMessagesAtom = atom<ChatMessage[]>([]);
export const geminiStateAtom = atom<GeminiState>("checking");
export const geminiDownloadProgressAtom = atom<number>(0);

export function resetPlaygroundAtoms(set: <T>(a: ReturnType<typeof atom<T>>, value: T) => void) {
  set(playerPosAtom, PLAYER_SPAWN);
  set(nearbyTriggerAtom, null);
  set(activeModalAtom, null);
  set(chatMessagesAtom, []);
  set(geminiStateAtom, "checking");
  set(geminiDownloadProgressAtom, 0);
}
```

- [ ] **Step 2: Verify it compiles**

Run:
```bash
pnpm lint
```
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/stores/playground.ts
git commit -m "feat(playground): jotai store for player, trigger, modal, chat, gemini state"
```

---

## Task 4: useKeyboardMovement hook with bounds clamping

**Files:**
- Create: `src/components/playground/useKeyboardMovement.ts`

This hook will be unit-tested via Playwright in Task 18 by driving real keyboard events on the live page. No standalone test harness.

- [ ] **Step 1: Create the hook**

Create `src/components/playground/useKeyboardMovement.ts`:

```ts
import { useFrame } from "@react-three/fiber";
import { useAtom, useAtomValue } from "jotai";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { activeModalAtom, playerPosAtom, type Vec3 } from "~/stores/playground";

export const SPEED = 2.5;
export const BOUNDS_MIN_X = -4.5;
export const BOUNDS_MAX_X = 4.5;
export const BOUNDS_MIN_Z = -4.5;
export const BOUNDS_MAX_Z = 4.5;

const MOVE_KEYS = new Set([
  "w", "a", "s", "d",
  "W", "A", "S", "D",
  "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
]);

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function useKeyboardMovement() {
  const [, setPos] = useAtom(playerPosAtom);
  const activeModal = useAtomValue(activeModalAtom);
  const heldKeys = useRef<Set<string>>(new Set());
  const modalRef = useRef(activeModal);

  useEffect(() => {
    modalRef.current = activeModal;
    if (activeModal !== null) heldKeys.current.clear();
  }, [activeModal]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (!MOVE_KEYS.has(e.key)) return;
      if (modalRef.current !== null) return;
      heldKeys.current.add(e.key);
    };
    const up = (e: KeyboardEvent) => {
      heldKeys.current.delete(e.key);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useFrame((_, delta) => {
    if (modalRef.current !== null) return;
    if (heldKeys.current.size === 0) return;

    const dir = new THREE.Vector3();
    const k = heldKeys.current;
    if (k.has("w") || k.has("W") || k.has("ArrowUp")) dir.z -= 1;
    if (k.has("s") || k.has("S") || k.has("ArrowDown")) dir.z += 1;
    if (k.has("a") || k.has("A") || k.has("ArrowLeft")) dir.x -= 1;
    if (k.has("d") || k.has("D") || k.has("ArrowRight")) dir.x += 1;
    if (dir.lengthSq() === 0) return;

    dir.normalize().multiplyScalar(SPEED * delta);
    setPos((prev): Vec3 => [
      clamp(prev[0] + dir.x, BOUNDS_MIN_X, BOUNDS_MAX_X),
      prev[1],
      clamp(prev[2] + dir.z, BOUNDS_MIN_Z, BOUNDS_MAX_Z),
    ]);
  });
}
```

- [ ] **Step 2: Verify compile**

Run:
```bash
pnpm lint
```
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/playground/useKeyboardMovement.ts
git commit -m "feat(playground): keyboard movement hook with bounds clamping"
```

---

## Task 5: useTriggerZone hook (closest-wins distance check)

**Files:**
- Create: `src/components/playground/useTriggerZone.ts`

- [ ] **Step 1: Create the hook**

Create `src/components/playground/useTriggerZone.ts`:

```ts
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import { nearbyTriggerAtom, playerPosAtom, type Vec3 } from "~/stores/playground";

export interface TriggerZone {
  propId: string;
  position: Vec3;
  radius: number;
  label: string;
  onActivate: () => void;
}

/**
 * Distance is computed on the XZ plane only (Y is ignored — ground-plane game).
 */
function xzDistance(a: Vec3, b: Vec3): number {
  const dx = a[0] - b[0];
  const dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Tracks the closest zone the player is currently inside.
 * When multiple registered zones are in range, the nearest wins.
 *
 * Pass a stable array of zones (memoize at the call site).
 */
export function useTriggerZones(zones: TriggerZone[]) {
  const playerPos = useAtomValue(playerPosAtom);
  const setNearby = useSetAtom(nearbyTriggerAtom);

  useEffect(() => {
    let best: TriggerZone | null = null;
    let bestDist = Infinity;
    for (const z of zones) {
      const d = xzDistance(playerPos, z.position);
      if (d < z.radius && d < bestDist) {
        best = z;
        bestDist = d;
      }
    }
    setNearby(best
      ? { propId: best.propId, label: best.label, onActivate: best.onActivate }
      : null);
  }, [playerPos, zones, setNearby]);
}

/**
 * Listens for E / Enter and invokes the currently-active trigger's onActivate.
 * Must be mounted somewhere in the Playground tree (Scene is a good place).
 */
export function useTriggerActivation() {
  const nearby = useAtomValue(nearbyTriggerAtom);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "e" && e.key !== "E" && e.key !== "Enter") return;
      if (!nearby) return;
      e.preventDefault();
      nearby.onActivate();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [nearby]);
}
```

- [ ] **Step 2: Verify compile**

Run:
```bash
pnpm lint
```
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/playground/useTriggerZone.ts
git commit -m "feat(playground): trigger-zone hook with closest-wins detection"
```

---

## Task 6: useGeminiNano hook (state machine + lazy session + tool factory)

**Files:**
- Create: `src/components/playground/useGeminiNano.ts`

- [ ] **Step 1: Create the hook**

Create `src/components/playground/useGeminiNano.ts`:

```ts
import { useSetAtom } from "jotai";
import { useCallback, useEffect, useRef } from "react";
import {
  geminiDownloadProgressAtom,
  geminiStateAtom,
  type GeminiState,
} from "~/stores/playground";
import { postsForPrompt, SYSTEM_PROMPT, type PostMeta } from "./posts-context";

interface UseGeminiNanoOpts {
  onFindPost: (post: PostMeta) => void;
  onAssistantChunk: (chunk: string) => void;
  onAssistantStart: () => void;
  onAssistantEnd: () => void;
  onError: (message: string) => void;
}

function makeFindPostTool(
  onFindPost: (post: PostMeta) => void
): LanguageModelTool {
  return {
    name: "findPost",
    description:
      "当用户的问题明显指向博客上的某篇具体文章时调用此工具。slug 必须从 system prompt 给出的列表里选；不要发明 slug。",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "文章的 slug（不含 /posts/ 前缀和末尾斜线）" },
        reason: { type: "string", description: "一句话说明为什么推荐这篇" },
      },
      required: ["slug"],
    },
    async execute(rawInput: unknown) {
      const input = rawInput as { slug?: string };
      const slug = input?.slug;
      if (!slug) return { found: false, error: "missing slug" };
      const post = postsForPrompt.find((p) => p.slug === slug);
      if (!post) {
        return { found: false, error: `没有名为 "${slug}" 的文章` };
      }
      onFindPost(post);
      return {
        found: true,
        title: post.title,
        url: post.url,
        description: post.description,
      };
    },
  };
}

export function useGeminiNano(opts: UseGeminiNanoOpts) {
  const setState = useSetAtom(geminiStateAtom);
  const setProgress = useSetAtom(geminiDownloadProgressAtom);
  const sessionRef = useRef<LanguageModelSession | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (typeof window === "undefined" || !window.LanguageModel) {
        if (!cancelled) setState("unavailable");
        return;
      }
      try {
        const a = await window.LanguageModel.availability();
        if (!cancelled) setState(a as GeminiState);
      } catch {
        if (!cancelled) setState("error");
      }
    }
    check();
    return () => {
      cancelled = true;
    };
  }, [setState]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      sessionRef.current?.destroy();
      sessionRef.current = null;
    };
  }, []);

  const ensureSession = useCallback(async () => {
    if (sessionRef.current) return sessionRef.current;
    if (!window.LanguageModel) throw new Error("LanguageModel unavailable");
    setState("downloading");
    const session = await window.LanguageModel.create({
      initialPrompts: [{ role: "system", content: SYSTEM_PROMPT }],
      tools: [makeFindPostTool((p) => optsRef.current.onFindPost(p))],
      expectedInputs: [{ type: "text", languages: ["zh", "en"] }],
      expectedOutputs: [{ type: "text", languages: ["zh", "en"] }],
      monitor(target) {
        target.addEventListener("downloadprogress", ((e: Event) => {
          const ev = e as Event & { loaded?: number };
          if (typeof ev.loaded === "number") setProgress(ev.loaded);
        }) as EventListener);
      },
    });
    sessionRef.current = session;
    setState("available");
    return session;
  }, [setState, setProgress]);

  const send = useCallback(
    async (userText: string) => {
      try {
        const session = await ensureSession();
        abortRef.current?.abort();
        abortRef.current = new AbortController();
        optsRef.current.onAssistantStart();
        const stream = session.promptStreaming(userText, {
          signal: abortRef.current.signal,
        });
        for await (const chunk of stream) {
          optsRef.current.onAssistantChunk(chunk);
        }
        optsRef.current.onAssistantEnd();
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        optsRef.current.onError(
          err instanceof Error ? err.message : "unknown error"
        );
        setState("error");
      }
    },
    [ensureSession, setState]
  );

  return { send };
}
```

- [ ] **Step 2: Verify compile**

Run:
```bash
pnpm lint
```
Expected: PASS. The hook uses the ambient `LanguageModel*` types from Task 1.

- [ ] **Step 3: Commit**

```bash
git add src/components/playground/useGeminiNano.ts
git commit -m "feat(playground): Gemini Nano hook with lazy session + findPost tool"
```

---

## Task 7: Ground component with procedural tile texture

**Files:**
- Create: `src/components/playground/Ground.tsx`

- [ ] **Step 1: Create the ground**

Create `src/components/playground/Ground.tsx`:

```tsx
import { useMemo } from "react";
import * as THREE from "three";

function makeTileTexture(): THREE.CanvasTexture {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;

  ctx.fillStyle = "#dac7a8";
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = "#d0bca0";
  const cell = size / 8;
  const r = 6;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const px = x * cell + 4;
      const py = y * cell + 4;
      const w = cell - 8;
      const h = cell - 8;
      ctx.beginPath();
      ctx.moveTo(px + r, py);
      ctx.arcTo(px + w, py, px + w, py + h, r);
      ctx.arcTo(px + w, py + h, px, py + h, r);
      ctx.arcTo(px, py + h, px, py, r);
      ctx.arcTo(px, py, px + w, py, r);
      ctx.closePath();
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.anisotropy = 4;
  return tex;
}

export function Ground() {
  const texture = useMemo(() => makeTileTexture(), []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[10, 10]} />
      <meshStandardMaterial map={texture} color="#dac7a8" roughness={0.85} metalness={0} />
    </mesh>
  );
}
```

- [ ] **Step 2: Verify compile**

Run:
```bash
pnpm lint
```
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/playground/Ground.tsx
git commit -m "feat(playground): ground plane with procedural tile texture"
```

---

## Task 8: Fence component (programmatic InstancedMesh ring)

**Files:**
- Create: `src/components/playground/Fence.tsx`

- [ ] **Step 1: Create the fence**

Create `src/components/playground/Fence.tsx`:

```tsx
import { useMemo, useRef } from "react";
import * as THREE from "three";

interface PostTransform {
  position: [number, number, number];
  rotationY: number;
}

const PERIMETER = 4.7;
const SPACING = 0.5;
const OPENING_HALF = 1.0;

function buildPosts(): PostTransform[] {
  const posts: PostTransform[] = [];
  const start = -PERIMETER + SPACING / 2;
  const stepCount = Math.round((PERIMETER * 2) / SPACING);

  for (let i = 0; i < stepCount; i++) {
    const t = start + i * SPACING;
    posts.push({ position: [t, 0.3, -PERIMETER], rotationY: 0 });
    if (!(t > -OPENING_HALF && t < OPENING_HALF)) {
      posts.push({ position: [t, 0.3, PERIMETER], rotationY: 0 });
    }
    posts.push({ position: [-PERIMETER, 0.3, t], rotationY: Math.PI / 2 });
    posts.push({ position: [PERIMETER, 0.3, t], rotationY: Math.PI / 2 });
  }
  return posts;
}

export function Fence() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const posts = useMemo(() => buildPosts(), []);

  useMemo(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    posts.forEach((p, i) => {
      dummy.position.set(...p.position);
      dummy.rotation.set(0, p.rotationY, 0);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [posts]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, posts.length]}>
      <boxGeometry args={[0.1, 0.6, 0.4]} />
      <meshPhysicalMaterial
        color="#f6f1e8"
        roughness={0.4}
        clearcoat={1}
        clearcoatRoughness={0.2}
      />
    </instancedMesh>
  );
}
```

- [ ] **Step 2: Verify compile**

Run:
```bash
pnpm lint
```
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/playground/Fence.tsx
git commit -m "feat(playground): fence ring as InstancedMesh"
```

---

## Task 9: Tree component (cone foliage + cylinder trunk)

**Files:**
- Create: `src/components/playground/Tree.tsx`

- [ ] **Step 1: Create the tree**

Create `src/components/playground/Tree.tsx`:

```tsx
import { type Vec3 } from "~/stores/playground";

export function Tree({ position }: { position: Vec3 }) {
  const [x, , z] = position;
  return (
    <group>
      <mesh position={[x, 0.3, z]}>
        <cylinderGeometry args={[0.12, 0.15, 0.6, 8]} />
        <meshStandardMaterial color="#6b4f2a" roughness={0.85} />
      </mesh>
      <mesh position={[x, 1.5, z]}>
        <coneGeometry args={[0.9, 1.8, 8]} />
        <meshStandardMaterial color="#7ea96a" roughness={0.7} />
      </mesh>
    </group>
  );
}
```

- [ ] **Step 2: Verify compile**

Run:
```bash
pnpm lint
```
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/playground/Tree.tsx
git commit -m "feat(playground): tree filler prop"
```

---

## Task 10: NewspaperStand component with procedural sign label

**Files:**
- Create: `src/components/playground/NewspaperStand.tsx`

- [ ] **Step 1: Create the stand**

Create `src/components/playground/NewspaperStand.tsx`:

```tsx
import { useMemo } from "react";
import * as THREE from "three";
import { type Vec3 } from "~/stores/playground";

function makeSignTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 384;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fbf6ee";
  ctx.fillRect(0, 0, 512, 384);
  ctx.strokeStyle = "#2a1a1a";
  ctx.lineWidth = 6;
  ctx.strokeRect(12, 12, 488, 360);
  ctx.fillStyle = "#2a1a1a";
  ctx.font = "italic 700 96px Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("POSTS", 256, 192);
  return new THREE.CanvasTexture(c);
}

export interface NewspaperStandProps {
  basePosition: Vec3;
  onClick: () => void;
}

export function NewspaperStand({ basePosition, onClick }: NewspaperStandProps) {
  const [x, , z] = basePosition;
  const signTexture = useMemo(() => makeSignTexture(), []);

  return (
    <group onClick={onClick}>
      <mesh position={[x, 0.4, z]}>
        <boxGeometry args={[0.6, 0.8, 0.5]} />
        <meshPhysicalMaterial color="#a87838" clearcoat={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[x, 1.3, z]} rotation={[0, Math.PI / 4, 0]}>
        <planeGeometry args={[0.8, 0.6]} />
        <meshStandardMaterial map={signTexture} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
```

- [ ] **Step 2: Verify compile**

Run:
```bash
pnpm lint
```
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/playground/NewspaperStand.tsx
git commit -m "feat(playground): newspaper stand prop with procedural sign"
```

---

## Task 11: YiyangAvatar billboard sprite

**Files:**
- Create: `src/components/playground/YiyangAvatar.tsx`

- [ ] **Step 1: Create the avatar**

Create `src/components/playground/YiyangAvatar.tsx`:

```tsx
import { Billboard } from "@react-three/drei";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { siteConfig } from "~/config";
import { type Vec3 } from "~/stores/playground";

export interface YiyangAvatarProps {
  position: Vec3;
  onClick: () => void;
}

export function YiyangAvatar({ position, onClick }: YiyangAvatarProps) {
  const texture = useLoader(THREE.TextureLoader, siteConfig.about.avatar);
  return (
    <Billboard position={position} onClick={onClick}>
      <mesh>
        <planeGeometry args={[1.0, 1.5]} />
        <meshBasicMaterial
          map={texture}
          transparent
          alphaTest={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
    </Billboard>
  );
}
```

- [ ] **Step 2: Verify compile**

Run:
```bash
pnpm lint
```
Expected: PASS. The component sources the avatar URL from `siteConfig` (existing `src/config/index.tsx`).

- [ ] **Step 3: Commit**

```bash
git add src/components/playground/YiyangAvatar.tsx
git commit -m "feat(playground): Yiyang billboard sprite using avatar URL"
```

---

## Task 12: Player capsule that consumes movement + atom

**Files:**
- Create: `src/components/playground/Player.tsx`

- [ ] **Step 1: Create the player**

Create `src/components/playground/Player.tsx`:

```tsx
import { useAtomValue } from "jotai";
import { playerPosAtom } from "~/stores/playground";
import { useKeyboardMovement } from "./useKeyboardMovement";

export function Player() {
  useKeyboardMovement();
  const pos = useAtomValue(playerPosAtom);
  return (
    <mesh position={pos}>
      <capsuleGeometry args={[0.25, 0.4, 4, 8]} />
      <meshPhysicalMaterial color="#b8d8c8" roughness={0.3} clearcoat={1} />
    </mesh>
  );
}
```

- [ ] **Step 2: Verify compile**

Run:
```bash
pnpm lint
```
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/playground/Player.tsx
git commit -m "feat(playground): player capsule + keyboard movement wiring"
```

---

## Task 13: Scene assembly (Canvas + camera + lighting + props + trigger zones)

**Files:**
- Create: `src/components/playground/Scene.tsx`

- [ ] **Step 1: Create the scene**

Create `src/components/playground/Scene.tsx`:

```tsx
import { ContactShadows, OrthographicCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useSetAtom } from "jotai";
import { useMemo } from "react";
import { activeModalAtom } from "~/stores/playground";
import { Fence } from "./Fence";
import { Ground } from "./Ground";
import { NewspaperStand } from "./NewspaperStand";
import { Player } from "./Player";
import { Tree } from "./Tree";
import { useTriggerActivation, useTriggerZones, type TriggerZone } from "./useTriggerZone";
import { YiyangAvatar } from "./YiyangAvatar";

const YIYANG_POS: [number, number, number] = [-1.8, 0.75, 0];
const NEWSPAPER_POS: [number, number, number] = [2.2, 0, 1.2];
const TREE_POS: [number, number, number] = [-3.2, 0, -3];

function SceneContents() {
  const setActiveModal = useSetAtom(activeModalAtom);

  const zones = useMemo<TriggerZone[]>(
    () => [
      {
        propId: "yiyang",
        position: YIYANG_POS,
        radius: 1.3,
        label: "[E] 与 Yiyang 聊聊",
        onActivate: () => setActiveModal("chat"),
      },
      {
        propId: "newspaper",
        position: NEWSPAPER_POS,
        radius: 1.3,
        label: "[E] 翻阅最近文章",
        onActivate: () => setActiveModal("posts"),
      },
    ],
    [setActiveModal]
  );

  useTriggerZones(zones);
  useTriggerActivation();

  return (
    <>
      <OrthographicCamera
        makeDefault
        position={[10, 10, 10]}
        zoom={60}
        near={0.1}
        far={100}
        onUpdate={(self) => self.lookAt(0, 0, 0)}
      />
      <ambientLight color="#a8c4d4" intensity={0.4} />
      <directionalLight color="#ffe8c8" intensity={1.1} position={[5, 8, 5]} />
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.35}
        scale={11}
        blur={2.5}
        far={4}
      />
      <Ground />
      <Fence />
      <Tree position={TREE_POS} />
      <YiyangAvatar
        position={YIYANG_POS}
        onClick={() => setActiveModal("chat")}
      />
      <NewspaperStand
        basePosition={NEWSPAPER_POS}
        onClick={() => setActiveModal("posts")}
      />
      <Player />
    </>
  );
}

export default function Scene() {
  return (
    <Canvas dpr={[1, 2]} gl={{ antialias: true }}>
      <SceneContents />
    </Canvas>
  );
}
```

- [ ] **Step 2: Verify compile**

Run:
```bash
pnpm lint
```
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/playground/Scene.tsx
git commit -m "feat(playground): scene assembly with camera, lighting, props, triggers"
```

---

## Task 14: TriggerHint overlay (DOM capsule)

**Files:**
- Create: `src/components/playground/TriggerHint.tsx`

- [ ] **Step 1: Create the overlay**

Create `src/components/playground/TriggerHint.tsx`:

```tsx
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { nearbyTriggerAtom } from "~/stores/playground";

function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduce(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduce;
}

export function TriggerHint() {
  const nearby = useAtomValue(nearbyTriggerAtom);
  const reduce = usePrefersReducedMotion();
  return (
    <div
      aria-hidden={!nearby}
      className={`pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 ${
        reduce ? "" : "transition-opacity duration-150"
      }`}
      style={{ opacity: nearby ? 1 : 0 }}
    >
      <div className="font-mono text-meta border border-[var(--reading-rule)] bg-[var(--reading-paper)] text-[var(--reading-text-primary)] px-4 py-2 rounded-full shadow-sm">
        {nearby?.label}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify compile**

Run:
```bash
pnpm lint
```
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/playground/TriggerHint.tsx
git commit -m "feat(playground): trigger hint overlay capsule"
```

---

## Task 15: PostsModal (newspaper stand result)

**Files:**
- Create: `src/components/playground/PostsModal.tsx`

- [ ] **Step 1: Create the modal**

Create `src/components/playground/PostsModal.tsx`:

```tsx
import { useSetAtom } from "jotai";
import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { PostList } from "~/components/PostList";
import { activeModalAtom } from "~/stores/playground";

export function PostsModal() {
  const setActiveModal = useSetAtom(activeModalAtom);
  const close = () => setActiveModal(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    previousFocus.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => {
      previousFocus.current?.focus();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="posts-modal-title"
      className="absolute inset-0 z-20 flex items-center justify-center"
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={close}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative w-[min(600px,90vw)] max-h-[min(560px,85vh)] overflow-auto rounded-lg bg-[var(--reading-paper)] text-[var(--reading-text-primary)] shadow-xl outline-none"
      >
        <div className="flex items-center justify-between border-b border-[var(--reading-rule)] px-5 py-3">
          <h2 id="posts-modal-title" className="font-mono text-eyebrow font-bold tracking-[0.18em] uppercase">
            Recent posts
          </h2>
          <Link to="/posts" className="font-mono text-meta text-text-secondary hover:text-text-primary">
            View all &rarr;
          </Link>
        </div>
        <div className="p-5">
          <PostList variant="default" />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify compile**

Run:
```bash
pnpm lint
```
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/playground/PostsModal.tsx
git commit -m "feat(playground): posts modal reusing existing PostList"
```

---

## Task 16: ChatPanel (Gemini Nano UI)

**Files:**
- Create: `src/components/playground/ChatPanel.tsx`

- [ ] **Step 1: Create the panel**

Create `src/components/playground/ChatPanel.tsx`:

```tsx
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { nanoid } from "nanoid";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { siteConfig } from "~/config";
import {
  activeModalAtom,
  chatMessagesAtom,
  geminiStateAtom,
  type ChatMessage,
} from "~/stores/playground";
import { useGeminiNano } from "./useGeminiNano";

function StateDot({ state }: { state: string }) {
  const color =
    state === "available" ? "#5ca06e" :
    state === "downloading" ? "#d4a838" :
    state === "checking" ? "#a8a8a8" :
    "#c85858";
  return (
    <span aria-label={`gemini ${state}`} className="inline-block w-2 h-2 rounded-full" style={{ background: color }} />
  );
}

function Message({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[80%] rounded-xl px-3 py-2 text-body whitespace-pre-wrap ${
          isUser
            ? "bg-[#b8d8c8] text-[#1a3a2a]"
            : "bg-[var(--reading-paper)] text-[var(--reading-text-primary)] border border-[var(--reading-rule)]"
        }`}
      >
        {msg.text}
        {msg.streaming && <span className="ml-0.5 animate-pulse">▍</span>}
        {msg.postCard && (
          <Link
            to={msg.postCard.url}
            className="mt-2 block rounded border border-[var(--reading-rule)] p-3 hover:bg-black/5"
          >
            <div className="font-display italic">{msg.postCard.title}</div>
            {msg.postCard.description && (
              <div className="text-secondary text-text-secondary mt-1">{msg.postCard.description}</div>
            )}
            <div className="font-mono text-meta text-text-secondary mt-2">去阅读 →</div>
          </Link>
        )}
      </div>
    </div>
  );
}

export function ChatPanel() {
  const setActiveModal = useSetAtom(activeModalAtom);
  const [messages, setMessages] = useAtom(chatMessagesAtom);
  const state = useAtomValue(geminiStateAtom);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  const close = () => setActiveModal(null);

  useEffect(() => {
    previousFocus.current = document.activeElement as HTMLElement | null;
    textareaRef.current?.focus();
    return () => {
      previousFocus.current?.focus();
    };
  }, []);

  const { send } = useGeminiNano({
    onAssistantStart: () =>
      setMessages((prev) => [
        ...prev,
        { id: nanoid(), role: "assistant", text: "", streaming: true },
      ]),
    onAssistantChunk: (chunk) =>
      setMessages((prev) =>
        prev.map((m, i) =>
          i === prev.length - 1 ? { ...m, text: m.text + chunk } : m
        )
      ),
    onAssistantEnd: () =>
      setMessages((prev) =>
        prev.map((m, i) => (i === prev.length - 1 ? { ...m, streaming: false } : m))
      ),
    onError: (err) =>
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.role === "assistant") {
          next[next.length - 1] = {
            ...last,
            text: `抱歉，刚才出了点问题：${err}`,
            streaming: false,
            error: true,
          };
        }
        return next;
      }),
    onFindPost: (post) =>
      setMessages((prev) =>
        prev.map((m, i) =>
          i === prev.length - 1
            ? {
                ...m,
                postCard: {
                  title: post.title,
                  description: post.description,
                  url: post.url,
                },
              }
            : m
        )
      ),
  });

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSend = state === "available" || state === "downloadable";

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !canSend) return;
    setMessages((prev) => [...prev, { id: nanoid(), role: "user", text }]);
    setDraft("");
    void send(text);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="chat-panel-title"
      className="absolute inset-0 z-20 flex items-center justify-center"
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={close}
      />
      <div className="relative flex flex-col w-[min(600px,90vw)] h-[min(560px,85vh)] rounded-lg bg-[var(--reading-paper)] text-[var(--reading-text-primary)] shadow-xl overflow-hidden">
        <header className="flex items-center gap-3 border-b border-[var(--reading-rule)] px-4 py-3">
          <img
            src={siteConfig.about.avatar}
            alt=""
            className="w-8 h-8 rounded-full"
          />
          <div id="chat-panel-title" className="font-display italic">
            Yiyang <span className="font-mono text-meta text-text-secondary">(β)</span>
          </div>
          <StateDot state={state} />
        </header>
        <div ref={scrollRef} className="flex-1 overflow-auto p-4">
          {state === "unavailable" && (
            <div className="font-mono text-meta text-text-secondary mb-3">
              此功能需 Chrome 138+ 并开启 Prompt API。场景仍可探索，但暂时无法对话。
            </div>
          )}
          {state === "downloading" && (
            <div className="font-mono text-meta text-text-secondary mb-3">
              首次加载模型中（~22 GB），请稍候…
            </div>
          )}
          {messages.length === 0 && state === "available" && (
            <div className="font-mono text-meta text-text-secondary">
              问我什么都行 —— 或让我推荐一篇文章。
            </div>
          )}
          {messages.map((m) => (
            <Message key={m.id} msg={m} />
          ))}
        </div>
        <form onSubmit={onSubmit} className="border-t border-[var(--reading-rule)] p-3 flex gap-2">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit(e);
              }
            }}
            disabled={!canSend}
            rows={1}
            placeholder={canSend ? "聊聊…" : "暂不可用"}
            className="flex-1 resize-none rounded border border-[var(--reading-rule)] bg-transparent px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-[#b8d8c8]"
          />
          <button
            type="submit"
            disabled={!canSend || !draft.trim()}
            className="rounded bg-[#1a3a2a] text-[#fbf6ee] px-4 py-2 font-mono text-meta disabled:opacity-40"
          >
            发送
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Install nanoid (one tiny shared dep for stable message ids)**

Run:
```bash
pnpm add nanoid
```

- [ ] **Step 3: Verify compile**

Run:
```bash
pnpm lint
```
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml src/components/playground/ChatPanel.tsx
git commit -m "feat(playground): chat panel UI with Gemini Nano integration"
```

---

## Task 17: MobileNotice + barrel + Playground wrapper (SSG-safe, lazy Scene)

**Files:**
- Create: `src/components/playground/MobileNotice.tsx`
- Create: `src/components/playground/Playground.tsx`
- Create: `src/components/playground/index.ts`

- [ ] **Step 1: Create MobileNotice**

Create `src/components/playground/MobileNotice.tsx`:

```tsx
import { Link } from "react-router";

export function MobileNotice() {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center md:hidden">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" aria-hidden />
      <div className="relative max-w-[280px] rounded-lg bg-[var(--reading-paper)] text-[var(--reading-text-primary)] p-5 text-center shadow-xl">
        <div className="font-display italic text-h3 mb-2">小院子</div>
        <p className="text-secondary text-text-secondary mb-4">
          本页面建议使用桌面浏览器访问。
        </p>
        <Link to="/" className="font-mono text-meta underline">
          回首页 →
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create the Playground wrapper**

Create `src/components/playground/Playground.tsx`:

```tsx
import { useAtomValue } from "jotai";
import { lazy, Suspense, useEffect, useState } from "react";
import { activeModalAtom } from "~/stores/playground";
import { ChatPanel } from "./ChatPanel";
import { MobileNotice } from "./MobileNotice";
import { PostsModal } from "./PostsModal";
import { TriggerHint } from "./TriggerHint";

const Scene = lazy(() => import("./Scene"));

function SceneSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#e8dfd0]">
      <div className="font-mono text-meta text-text-secondary">Loading…</div>
    </div>
  );
}

export function Playground() {
  const [mounted, setMounted] = useState(false);
  const activeModal = useAtomValue(activeModalAtom);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative w-full h-[min(80vh,720px)] rounded-lg overflow-hidden border border-[var(--reading-rule)] bg-[#dac7a8]">
      {mounted ? (
        <Suspense fallback={<SceneSkeleton />}>
          <Scene />
        </Suspense>
      ) : (
        <SceneSkeleton />
      )}

      <TriggerHint />
      <MobileNotice />

      {activeModal === "chat" && <ChatPanel />}
      {activeModal === "posts" && <PostsModal />}
    </div>
  );
}
```

- [ ] **Step 3: Create barrel export**

Create `src/components/playground/index.ts`:

```ts
export { Playground } from "./Playground";
```

- [ ] **Step 4: Verify compile**

Run:
```bash
pnpm lint
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/playground/MobileNotice.tsx src/components/playground/Playground.tsx src/components/playground/index.ts
git commit -m "feat(playground): top-level wrapper with SSG guard, lazy Scene, modal mounts"
```

---

## Task 18: Wire up the MDX route + Home/About entry links

**Files:**
- Create: `pages/playground.mdx`
- Modify: `pages/index.mdx`
- Modify: `pages/about.mdx`

- [ ] **Step 1: Create the route**

Create `pages/playground.mdx`:

```mdx
---
title: Playground
comment: false
---

import { Playground } from "~/components/playground";

<Playground />
```

- [ ] **Step 2: Append link to the About page**

Read current `pages/about.mdx`. Replace its body with this content (preserve the frontmatter):

```mdx
---
comment: false
---

<AboutPage>

Hi! I'm Yiyang Suen, a frontend developer based in China. I'm passionate about building beautiful, performant web experiences and exploring the latest in AI tools and technologies.

Currently, I'm working at ByteDance, where I focus on building user interfaces and developer tools. In my free time, I love photography, exploring new places, and experimenting with AI-powered workflows.

This blog is where I share my thoughts on frontend development, AI exploration, and the intersection of technology and creativity.

也可以到 [小院子](/playground) 找我聊聊。

</AboutPage>
```

- [ ] **Step 3: Append link line to the Home page**

Read current `pages/index.mdx`. Replace its body with this content (preserve the frontmatter):

```mdx
---
comment: false
---

<Hero
  tags="Frontend · AI · Design · UX"
  headline="Exploring the intersection of code, intelligence & craft."
  description="Personal notes on building interfaces, experimenting with AI agents, and obsessing over pixels."
/>

<p className="font-mono text-meta text-text-secondary mt-2">
  或者去 <a href="/playground" className="underline">小院子</a> 走走 →
</p>

<RecentPosts />
```

- [ ] **Step 4: Run the dev server and visit `/playground`**

Run:
```bash
pnpm dev
```

In a browser, visit `http://localhost:5173/playground`. You should see:
- A 2.5D courtyard with a tan ground, fence, tree, Yiyang sprite, newspaper stand, and a mint capsule player
- WASD or arrow keys move the capsule (bounded inside the ground)
- Walking near the avatar shows `[E] 与 Yiyang 聊聊` capsule
- Pressing `E` opens the chat panel (state may be `unavailable` depending on browser)
- Walking near the newspaper shows `[E] 翻阅最近文章`
- Pressing `E` opens the posts modal listing the 4 posts
- `Escape` closes any open modal

Also visit `/` and `/about` and verify the playground link is present.

- [ ] **Step 5: Verify lint and build**

Run:
```bash
pnpm lint
pnpm build
```
Expected: both PASS.

- [ ] **Step 6: Commit**

```bash
git add pages/playground.mdx pages/index.mdx pages/about.mdx
git commit -m "feat(playground): /playground route + Home/About entry links"
```

---

## Task 19: E2E tests + Page Object Model

**Files:**
- Create: `e2e/fixtures/pages/playground-page.ts`
- Modify: `e2e/fixtures/index.ts`
- Modify: `e2e/fixtures/test-base.ts`
- Create: `e2e/tests/playground.spec.ts`

- [ ] **Step 1: Create the Page Object Model**

Create `e2e/fixtures/pages/playground-page.ts`:

```ts
import { Locator, Page } from "@playwright/test";
import { BasePage } from "./base-page";

export class PlaygroundPage extends BasePage {
  readonly canvas: Locator;
  readonly triggerHint: Locator;
  readonly postsModal: Locator;
  readonly chatPanel: Locator;
  readonly mobileNotice: Locator;

  constructor(page: Page) {
    super(page);
    this.canvas = page.locator("main canvas");
    this.triggerHint = page.locator('main [class*="rounded-full"]').first();
    this.postsModal = page.locator('[role="dialog"][aria-labelledby="posts-modal-title"]');
    this.chatPanel = page.locator('[role="dialog"][aria-labelledby="chat-panel-title"]');
    this.mobileNotice = page.locator('main >> text="本页面建议使用桌面浏览器访问。"');
  }

  async goto(): Promise<void> {
    await super.goto("/playground");
    await this.page.waitForLoadState("networkidle");
  }

  async holdKey(key: string, ms: number) {
    await this.page.keyboard.down(key);
    await this.page.waitForTimeout(ms);
    await this.page.keyboard.up(key);
  }

  /** Hold multiple keys simultaneously for ms milliseconds (diagonal walks). */
  async holdKeys(keys: string[], ms: number) {
    for (const k of keys) await this.page.keyboard.down(k);
    await this.page.waitForTimeout(ms);
    for (const k of keys) await this.page.keyboard.up(k);
  }

  async pressActivate() {
    await this.page.keyboard.press("KeyE");
  }

  async pressEscape() {
    await this.page.keyboard.press("Escape");
  }
}
```

- [ ] **Step 2: Register the fixture**

Replace `e2e/fixtures/index.ts` with:

```ts
export { test, expect } from "./test-base";
export { HomePage } from "./pages/home-page";
export { PostsPage } from "./pages/posts-page";
export { PostDetailPage } from "./pages/post-detail-page";
export { LinksPage } from "./pages/links-page";
export { BasePage } from "./pages/base-page";
export { PlaygroundPage } from "./pages/playground-page";
```

Modify `e2e/fixtures/test-base.ts` — add the import and fixture entry:

```ts
import { test as base } from "@playwright/test";
import { HomePage } from "./pages/home-page";
import { PostsPage } from "./pages/posts-page";
import { PostDetailPage } from "./pages/post-detail-page";
import { LinksPage } from "./pages/links-page";
import { PlaygroundPage } from "./pages/playground-page";

type Fixtures = {
  homePage: HomePage;
  postsPage: PostsPage;
  postDetailPage: PostDetailPage;
  linksPage: LinksPage;
  playgroundPage: PlaygroundPage;
};

export const test = base.extend<Fixtures>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  postsPage: async ({ page }, use) => {
    await use(new PostsPage(page));
  },
  postDetailPage: async ({ page }, use) => {
    await use(new PostDetailPage(page));
  },
  linksPage: async ({ page }, use) => {
    await use(new LinksPage(page));
  },
  playgroundPage: async ({ page }, use) => {
    await use(new PlaygroundPage(page));
  },
});

export { expect } from "@playwright/test";
```

- [ ] **Step 3: Write the e2e tests**

Create `e2e/tests/playground.spec.ts`:

```ts
import { test, expect } from "../fixtures";

test.describe("Playground", () => {
  test("page loads with canvas on desktop", async ({ playgroundPage }) => {
    await playgroundPage.goto();
    await expect(playgroundPage.canvas).toBeVisible();
  });

  test("walking toward Yiyang shows chat hint and Escape closes panel", async ({
    playgroundPage,
  }) => {
    // Yiyang at [-1.8, 0.75, 0]; player spawn at [0, 0.45, 3.5].
    // Diagonal NW walk (W + A) approaches: dx ≈ -1.8, dz ≈ -3.5,
    // distance ≈ 3.94; at 2.5 units/s, ~1.6s to enter the 1.3 radius.
    await playgroundPage.goto();
    await playgroundPage.canvas.click();
    await playgroundPage.holdKeys(["KeyW", "KeyA"], 1800);
    await expect(playgroundPage.triggerHint).toBeVisible();
    await expect(playgroundPage.triggerHint).toContainText("Yiyang");
    await playgroundPage.pressActivate();
    await expect(playgroundPage.chatPanel).toBeVisible();
    await playgroundPage.pressEscape();
    await expect(playgroundPage.chatPanel).not.toBeVisible();
  });

  test("walking toward newspaper opens posts modal listing posts", async ({
    playgroundPage,
  }) => {
    // Newspaper at [2.2, 0, 1.2]; player spawn at [0, 0.45, 3.5].
    // Diagonal NE walk (W + D): dx ≈ 2.2, dz ≈ -2.3, distance ≈ 3.2;
    // ~1.3s to enter the 1.3 radius.
    await playgroundPage.goto();
    await playgroundPage.canvas.click();
    await playgroundPage.holdKeys(["KeyW", "KeyD"], 1500);
    await expect(playgroundPage.triggerHint).toBeVisible();
    await expect(playgroundPage.triggerHint).toContainText("文章");
    await playgroundPage.pressActivate();
    await expect(playgroundPage.postsModal).toBeVisible();
    await expect(
      playgroundPage.postsModal.locator("a[href^='/posts/']")
    ).not.toHaveCount(0);
  });

  test("chat panel shows unavailable banner in non-Chrome browsers", async ({
    playgroundPage,
    browserName,
  }) => {
    test.skip(
      browserName === "chromium",
      "Chromium may ship Prompt API; this test only asserts the fallback path"
    );
    await playgroundPage.goto();
    await playgroundPage.canvas.click();
    await playgroundPage.holdKeys(["KeyW", "KeyA"], 1800);
    await playgroundPage.pressActivate();
    await expect(playgroundPage.chatPanel).toBeVisible();
    await expect(playgroundPage.chatPanel).toContainText("Chrome 138+");
  });

  test("home page links to playground", async ({ homePage }) => {
    await homePage.goto();
    await expect(
      homePage.page.locator('a[href="/playground"]')
    ).toBeVisible();
  });

  test("mobile shows the desktop-recommended notice", async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
    });
    const page = await context.newPage();
    await page.goto("/playground");
    await expect(page.locator('text="本页面建议使用桌面浏览器访问。"')).toBeVisible();
    await context.close();
  });
});
```

- [ ] **Step 4: Run the tests**

Run:
```bash
pnpm test:e2e --project=chromium
```
Expected: all 6 tests in the Playground describe PASS in chromium. Some assertions (chat hint text, posts modal posts count) depend on the dev server being warm — Playwright's `webServer` config in `playwright.config.ts` handles startup.

If the canvas takes longer than expected to mount, increase `goto`'s wait or add `await page.waitForSelector("main canvas")`. Adjust hold-key durations if the player overshoots/undershoots (movement is `SPEED=2.5 units/sec`, distances are ~2 units from spawn).

- [ ] **Step 5: Commit**

```bash
git add e2e/fixtures/index.ts e2e/fixtures/test-base.ts e2e/fixtures/pages/playground-page.ts e2e/tests/playground.spec.ts
git commit -m "test(playground): e2e coverage for load, triggers, modals, mobile notice"
```

---

## Task 20: Build verification + bundle split sanity

**Files:** none (verification only)

- [ ] **Step 1: Clean build and inspect output**

Run:
```bash
rm -rf build
pnpm build
```
Expected: build succeeds with no errors.

- [ ] **Step 2: Confirm a dedicated playground chunk exists and is the only place `three` lives**

Run:
```bash
ls build/client/assets | grep -i playground
```
Expected output: at least one file matching `playground-*.js` (and possibly a `.css` sibling).

Then:
```bash
for f in build/client/assets/*.js; do
  if grep -l "THREE\.WebGLRenderer\|@react-three/fiber" "$f" > /dev/null 2>&1; then
    echo "$f"
  fi
done
```
Expected: the matches should be limited to the `playground-*.js` chunk (and possibly chunks it imports). If any non-playground entry chunk shows up, dynamic-import boundary is wrong — go back to `Playground.tsx` and confirm `Scene` is `React.lazy`-imported.

- [ ] **Step 3: Spot-check route is statically prerendered**

Run:
```bash
ls build/client/playground
```
Expected: an `index.html` exists. Open it:

```bash
grep -l "Loading" build/client/playground/index.html
```
Expected: the file contains the `Loading…` skeleton placeholder (proves SSG ran, since the Suspense fallback is what rendered server-side).

- [ ] **Step 4: Smoke-test the production build**

Run:
```bash
pnpm serve &
sleep 2
curl -sf http://localhost:3000/playground > /dev/null && echo OK || echo FAIL
kill %1
```
Expected: `OK`.

- [ ] **Step 5: Commit (no source changes — empty if no fixes were needed)**

If Step 2 forced you to adjust the lazy boundary, commit the fix:

```bash
git add src/components/playground/Playground.tsx
git commit -m "fix(playground): ensure three.js is isolated to the playground chunk"
```

Otherwise this task is verification-only and produces no commit.

---

## Done

After Task 20, the MVP is shippable:
- `/playground` is a self-contained route that lazy-loads R3F and three.js
- The rest of the site bundle is untouched
- WASD movement, trigger zones, both modals, Gemini Nano integration with graceful fallback all work
- E2E coverage in chromium plus a webkit fallback assertion
- Discoverable from Home and About via subdued inline links

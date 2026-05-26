# Interactive Courtyard (MVP) — Design Spec

**Date:** 2026-05-24
**Status:** Draft, pending user review
**Scope:** A new `/courtyard` route — a 2.5D 3D courtyard the visitor walks around in, with two interactive props: a chibi avatar of the blog author (Yiyang) backed by Chrome's built-in Gemini Nano, and a newspaper stand that surfaces the article index.

---

## 1. Goals

1. **Validate the interaction loop end-to-end.** Prove that a fixed-camera isometric courtyard + WASD movement + trigger-zone interactions + Chrome's Prompt API (Gemini Nano) hangs together in real browsers, with real assets, on real devices. Visual polish is explicitly deferred.
2. **Single self-contained route.** Nothing about the courtyard may regress the rest of the site. The route lazy-loads its 3D dependencies; the rest of the site's bundle does not grow.
3. **Graceful degradation.** A visitor on a browser without the Prompt API can still walk around and read the newspaper stand. The chat panel disables itself with a clear explanation; nothing else breaks.
4. **Foundations the next iteration can build on.** The component boundaries, jotai store, content-collections integration, and tool-call contract must hold up when we later swap the billboard sprite for a real chibi model, add more interactive props, and harden the asset pipeline.

## 2. Non-goals (MVP)

- **No real 3D chibi character.** Yiyang is a billboard sprite of his existing `avatar.jpeg`. No rigging, no animation, no Pop Mart vinyl model.
- **No commercial asset kit, no AI-generated meshes.** Everything in the scene is built from R3F primitives + drei helpers. No GLTF/GLB imports.
- **No physics engine.** Movement is `position += direction * speed * dt`, with axis-aligned bounds clamping.
- **No mobile touch movement.** Mobile shows a "best experienced on desktop Chrome" notice over the scene. The scene still renders so the visitor can see what they're missing, but the joystick / D-pad UI is out of scope.
- **No server-side AI fallback.** If `LanguageModel` is unavailable, the chat panel is disabled. We do not relay to Claude / OpenAI / etc.
- **No persistence.** No conversation history saved across page reloads. No visitor identity.
- **No audio.** No music, no SFX.
- **No nav-menu entry.** Discoverable via a single hidden link from the About page and (separately) the Home page Hero. Surfaced more prominently only after iteration.
- **No analytics events for the courtyard in MVP.** GA pageviews suffice; custom event taxonomy comes later.

## 3. Tech stack additions

| Package | Purpose | Approx. gz size |
|---|---|---|
| `three` | WebGL renderer | ~150 KB |
| `@react-three/fiber` | React reconciler for three.js | ~30 KB |
| `@react-three/drei` | Cameras, ContactShadows, Billboard, KeyboardControls helpers | ~50 KB (tree-shaken to what we use) |

These three packages add to the **`/courtyard` route bundle only**. The rest of the site does not import them. React Router v7 SSG must split this route — see §13 below.

No new TypeScript devDeps. `three` ships its own types.

The Chrome Prompt API (`LanguageModel`) is a runtime-only browser global; no npm package needed. The TypeScript ambient declarations live in `src/types/prompt-api.d.ts` (new file — see §11).

## 4. File layout

```
pages/
  courtyard.mdx                               NEW · thin MDX route, renders <Courtyard />

src/components/courtyard/
  Courtyard.tsx                               NEW · top-level wrapper; pageshell, Suspense fallback, banner, mounts <Scene>
  Scene.tsx                                    NEW · R3F <Canvas>, lighting, camera, ContactShadows
  Ground.tsx                                   NEW · 10×10 plane + procedural tile texture
  Fence.tsx                                    NEW · ring of programmatic posts around the ground
  Tree.tsx                                     NEW · cone + cylinder background filler
  Player.tsx                                   NEW · capsule mesh; consumes useKeyboardMovement
  YiyangAvatar.tsx                             NEW · drei <Billboard> with avatar.jpeg as texture
  NewspaperStand.tsx                           NEW · box base + plane signboard
  TriggerHint.tsx                              NEW · DOM overlay; "[E] 与 Yiyang 聊聊"
  ChatPanel.tsx                                NEW · Gemini Nano chat modal
  PostsModal.tsx                               NEW · newspaper-triggered modal listing posts
  MobileNotice.tsx                             NEW · "best on desktop" notice for narrow viewports
  useKeyboardMovement.ts                       NEW · hook: WASD/arrow + bounds + position state
  useTriggerZone.ts                            NEW · hook: distance check between player and prop
  useGeminiNano.ts                             NEW · hook: availability, create session, prompt, tools
  posts-context.ts                             NEW · build-time export of post metadata for system prompt
  index.ts                                     NEW · barrel re-export for cleaner imports

src/stores/courtyard.ts                       NEW · jotai atoms (see §10)
src/types/prompt-api.d.ts                      NEW · ambient types for window LanguageModel
```

The directory `src/components/courtyard/` is **the only place** that imports `three`, `@react-three/fiber`, `@react-three/drei`. Other components must not pull from it. This boundary keeps tree-shaking honest.

`pages/courtyard.mdx` content is intentionally tiny:

```mdx
---
comment: false
title: Courtyard
---

import { Courtyard } from "~/components/courtyard";

<Courtyard />
```

## 5. Scene composition

### 5.1 Coordinate system

- Y is up. Ground sits on `y = 0`. Player capsule rests at `y = 0.5` (capsule half-height).
- Scene is square, centered at origin. Walkable bounds: `x ∈ [-4.5, 4.5]`, `z ∈ [-4.5, 4.5]`. Hard-coded constants exported from `Scene.tsx`.

### 5.2 Camera

```ts
<OrthographicCamera
  makeDefault
  position={[10, 10, 10]}
  zoom={60}
  near={0.1}
  far={100}
  onUpdate={(self) => self.lookAt(0, 0, 0)}
/>
```

- Orthographic — no perspective foreshortening. Gives the clean isometric frame.
- **Camera is fixed.** No `OrbitControls`. No pan, no zoom, no rotate. Mouse drag does nothing on the canvas.
- Camera does **not** follow the player. Player can walk to any corner of the 10×10 bounds while the camera stays put. This is fine because the playable area fits inside the viewport at the chosen zoom.

### 5.3 Lighting

```ts
<ambientLight color="#a8c4d4" intensity={0.4} />
<directionalLight
  color="#ffe8c8"
  intensity={1.1}
  position={[5, 8, 5]}
/>
<ContactShadows
  position={[0, 0.01, 0]}
  opacity={0.35}
  scale={11}
  blur={2.5}
  far={4}
/>
```

Warm key light + cool fill — the "afternoon courtyard" feel. We deliberately do **not** enable real shadow mapping (`castShadow` / `receiveShadow`). `<ContactShadows>` gives every prop a clean grounded silhouette without per-mesh shadow tuning, costs less, and looks softer.

### 5.4 Ground

`PlaneGeometry(10, 10)` rotated `-π/2` on X, centered at origin.

Material:
- `MeshStandardMaterial`
- `color: '#dac7a8'` (warm bone)
- `roughness: 0.85`
- `metalness: 0`
- Map: procedurally generated `CanvasTexture` drawn at mount via a tiny helper that fills a `<canvas>` with `8×8` rounded-square tiles in a slightly darker tone (`#d0bca0`) on the base color. Tiles aren't pixel-perfect — the look we want is "subtly tiled paving" not "obvious grid". The texture wraps and repeats `4×4` across the plane.

### 5.5 Fence

A ring of programmatic posts around the inner edge of the ground:

- `BoxGeometry(0.1, 0.6, 0.4)` (W × H × D)
- Position: along the perimeter of `x ∈ [-4.7, 4.7]`, `z ∈ [-4.7, 4.7]` at `y = 0.3`, spaced every `0.5` along the perimeter
- Rotation: posts on the north/south edges face Z; posts on east/west face X (just swap which dimension is the long axis)
- Material: `MeshPhysicalMaterial`, `color: '#f6f1e8'`, `roughness: 0.4`, `clearcoat: 1`, `clearcoatRoughness: 0.2` — picks up the vinyl gloss
- A single InstancedMesh draws all posts; one batched draw call

Two segments of the south edge are removed (an opening) to imply an "entrance" — purely decorative; the player can't actually leave bounds.

### 5.6 Props

| Prop | Position `[x, y, z]` | Geometry | Material |
|---|---|---|---|
All positions below are the **center** of each mesh. Y values are chosen so each mesh rests on the ground (`y = 0`) without intersecting it.

| Prop | Position `[x, y, z]` | Geometry | Material |
|---|---|---|---|
| Tree foliage | `[-3.2, 1.5, -3]` | `ConeGeometry(0.9, 1.8, 8)` | `MeshStandardMaterial` `#7ea96a`, roughness 0.7 |
| Tree trunk | `[-3.2, 0.3, -3]` | `CylinderGeometry(0.12, 0.15, 0.6, 8)` | `MeshStandardMaterial` `#6b4f2a` |
| Yiyang avatar | `[-1.8, 0.75, 0]` | `<Billboard>` wrapping `PlaneGeometry(1.0, 1.5)` | `MeshBasicMaterial` with `map = avatar.jpeg`, `transparent: true`, `alphaTest: 0.1`, `side: THREE.DoubleSide` |
| Newspaper base | `[2.2, 0.4, 1.2]` | `BoxGeometry(0.6, 0.8, 0.5)` | `MeshPhysicalMaterial` `#a87838`, clearcoat 0.5 |
| Newspaper sign | `[2.2, 1.3, 1.2]` | `PlaneGeometry(0.8, 0.6)`, billboarded toward camera | White `MeshStandardMaterial` with a CanvasTexture drawing "POSTS" in serif italic, mimicking a newspaper rack header |
| Player capsule | spawn `[0, 0.45, 3.5]` | `CapsuleGeometry(0.25, 0.4, 4, 8)` (total height 0.9) | `MeshPhysicalMaterial` `#b8d8c8` (mint), roughness 0.3, clearcoat 1 |

The exact positions are tuned so the camera frames all props comfortably with the player at spawn.

### 5.7 Loading state

The Canvas is wrapped in `<Suspense fallback={<SceneSkeleton />}>`. `SceneSkeleton` is a CSS-only beige rectangle the size of the canvas with a centered spinner. Since the scene has no async asset loads in MVP (everything is procedural; avatar.jpeg is small and preloaded via `?url` import), the suspense fallback is brief — but it ensures the page never shows raw white before R3F mounts.

## 6. Movement and interaction

### 6.1 Keyboard input

`useKeyboardMovement` listens on `window` for `keydown` / `keyup`. Tracked keys: `W` `A` `S` `D` `ArrowUp` `ArrowDown` `ArrowLeft` `ArrowRight`. The set of held keys lives in a `Set<string>` ref (not state — we don't want to re-render on every keystroke).

Constants (exported from `Scene.tsx`):

```ts
export const SPEED = 2.5;             // units / second
export const BOUNDS_MIN_X = -4.5;
export const BOUNDS_MAX_X =  4.5;
export const BOUNDS_MIN_Z = -4.5;
export const BOUNDS_MAX_Z =  4.5;
```

Each frame (`useFrame`):

```ts
const dir = new THREE.Vector3();
if (heldKeys.has('w') || heldKeys.has('ArrowUp'))    dir.z -= 1;
if (heldKeys.has('s') || heldKeys.has('ArrowDown'))  dir.z += 1;
if (heldKeys.has('a') || heldKeys.has('ArrowLeft'))  dir.x -= 1;
if (heldKeys.has('d') || heldKeys.has('ArrowRight')) dir.x += 1;
if (dir.lengthSq() > 0) {
  dir.normalize().multiplyScalar(SPEED * delta);
  next.x = clamp(player.x + dir.x, BOUNDS_MIN_X, BOUNDS_MAX_X);
  next.z = clamp(player.z + dir.z, BOUNDS_MIN_Z, BOUNDS_MAX_Z);
  setPlayerPos(next);
}
```
- **No camera-aligned rotation.** `W` = "up the screen" = `-z` world space. Because the camera is at a 45° angle, the visual diagonal effect is intentional — it matches how isometric games like Stardew Valley and Animal Crossing handle WASD: keys map to world axes, not screen axes. (This is documented in the §12 known limitations because some visitors will find it counterintuitive.)
- Player position is stored in a jotai atom (see §10) so trigger detection and overlay UI can read it cheaply.

When the chat panel or posts modal is open, `useKeyboardMovement` no-ops. The hook reads `activeModalAtom` and bails early if a modal is mounted. Pressing `Escape` closes the open modal.

### 6.2 Trigger zones

`useTriggerZone({ propPos, radius, label, onActivate })` is the per-prop hook. It:

1. Subscribes to `playerPosAtom`.
2. Computes `distance = playerPos.distanceTo(propPos)`.
3. If `distance < radius`, writes `{ propId, label, onActivate }` into `nearbyTriggerAtom`. If multiple props are in range simultaneously, the closest wins.
4. If no prop is in range, clears `nearbyTriggerAtom`.

`TriggerHint` reads `nearbyTriggerAtom` and renders a DOM overlay near the bottom-center of the canvas: a capsule with `[E] {label}`. The capsule fades in over 120ms when a label appears.

Activation keys: `e`, `E`, `Enter`, and **mouse click on the prop**. All three invoke the same `onActivate`. Click is wired by attaching `onClick` to the prop mesh (R3F passes a synthetic event); raycasting is automatic.

Radii: Yiyang `1.3`, Newspaper `1.3`, Tree `0` (not interactive — no hook registered).

### 6.3 Trigger contracts

| Prop | `label` | `onActivate` |
|---|---|---|
| Yiyang | `[E] 与 Yiyang 聊聊` | `setActiveModal('chat')` |
| Newspaper | `[E] 翻阅最近文章` | `setActiveModal('posts')` |

## 7. UI overlays (chat, posts, hint, banner)

All overlay UIs are **DOM siblings of the Canvas**, not R3F children. They're absolutely positioned over the canvas inside the `Courtyard` wrapper.

Shared rules:
- Background: `rgba(0, 0, 0, 0.4)` backdrop, `backdrop-filter: blur(4px)`.
- Modal: `min(600px, 90vw)`, max-height `min(560px, 85vh)`, scroll inside.
- Surface tokens: reuse `--reading-paper`, `--reading-text-primary`, `--reading-rule`, etc. from `src/index.css` — the same tokens the blog post body uses. Visual consistency across the site for free.
- Close: clicking the backdrop OR pressing `Escape` closes any open modal.

### 7.1 `ChatPanel`

- Header: avatar.jpeg (32px circle) + "Yiyang (β)" + Gemini Nano availability dot (green = ready, amber = downloading, red = unavailable).
- Body: scrollable message list.
  - User messages: right-aligned, mint accent background.
  - Assistant messages: left-aligned, paper background, body type.
  - When the assistant invokes the `findPost` tool, the message renders an inline **post card** (title in display font, description in secondary, "去阅读 →" link). The card is a real `<Link to={post.url}>` — clicking it leaves `/courtyard` and lands on the article.
- Streaming: assistant messages tick in token-by-token via `promptStreaming()`. A trailing `▍` cursor pulses while streaming.
- Footer: textarea (auto-grow up to 4 lines) + send button. `Enter` to send, `Shift+Enter` for newline.
- States:
  - `unavailable`: input disabled, placeholder reads "需要 Chrome 138+ 并开启 Prompt API flag。场景仍可探索。"
  - `downloadable` / `downloading`: input disabled, banner inside the panel shows "首次加载模型（~22 GB），下载进度 NN%。"
  - `available`: input enabled, ready to send.

### 7.2 `PostsModal`

- Header: "Recent posts"
- Body: same `PostList` component the site already uses (`variant="default"`, no filter). Reusing keeps the visual identity exact.
- Footer: link "View all →" to `/posts`.

### 7.3 `TriggerHint`

- Position: fixed at bottom-center of the canvas area, `bottom: 2rem`.
- Capsule shape: `border-radius: 999px`, `padding: 0.5rem 1rem`, white background with 1px reading-rule border, `--text-meta` mono.
- The bracketed key glyph `[E]` is `--text-eyebrow` with letter-spacing 0.1em, color `text-primary`.

### 7.4 `MobileNotice`

- Renders **inside** the canvas area when viewport width `< 768px` (matches blog mobile breakpoint).
- Centered card over the canvas: "本页面建议使用桌面浏览器访问。" + a small "回首页" link.
- The scene still renders behind, slightly darkened, so the visitor can see what's there.
- WASD and trigger zones are inert on mobile — they're keyboard-driven and would do nothing useful anyway.

## 8. Gemini Nano integration

### 8.1 Detection and lifecycle

`useGeminiNano` hook owns the entire lifecycle.

```
state = 'checking' | 'unavailable' | 'downloadable' | 'downloading' | 'available' | 'error'
```

On mount:

```ts
if (!('LanguageModel' in window)) {
  state = 'unavailable';
  return;
}
const availability = await LanguageModel.availability();
state = availability;  // 'unavailable' | 'downloadable' | 'downloading' | 'available'
```

**Session creation is lazy on first send.** Opening the chat panel does not create a session — the user types their first message, and the `send()` function builds the session if needed:

```ts
async function ensureSession() {
  if (session) return session;
  session = await LanguageModel.create({
    initialPrompts: [{ role: 'system', content: SYSTEM_PROMPT }],
    tools: [makeFindPostTool(onFindPost)],   // see §8.3 — closure-bound, not module-level
    expectedInputs:  [{ type: 'text', languages: ['zh', 'en'] }],
    expectedOutputs: [{ type: 'text', languages: ['zh', 'en'] }],
    monitor: (m) => m.addEventListener('downloadprogress', (e) => setProgress(e.loaded)),
  });
  return session;
}
```

The session is reused across subsequent messages until the courtyard unmounts. On unmount, `session.destroy()` (and the abort controller for any in-flight stream is fired).

**State / input enablement matrix:**

| `state` | Chat input enabled? | What happens on send |
|---|---|---|
| `checking` | no | — |
| `unavailable` | no | — |
| `available` | yes | Create session if needed, send |
| `downloadable` | yes | Create session (kicks off download), state → `downloading`, show progress, message queued and sent on completion |
| `downloading` | no | Wait for completion; state mirrors download progress |
| `error` | no | Show "出了点问题，刷新试试" |

### 8.2 System prompt

Built at module load time in `posts-context.ts`:

```ts
import { allPosts } from "content-collections/generated";

const postsForPrompt = allPosts
  .filter(p => p._meta.path !== '/posts/')  // exclude the index, if any
  .map(p => ({
    slug: p._meta.path.replace(/^\/posts\//, '').replace(/\/$/, ''),
    title: p.title,
    description: p.description ?? '',
    tags: (p.tags ?? '').split(',').map(s => s.trim()).filter(Boolean),
    lang: p.lang ?? 'zh',
    url: p._meta.path,
  }));

export const SYSTEM_PROMPT = `你是 Yiyang Suen —— 一名常驻中国的前端开发者，关注 AI 工具、前端、设计与 UX。访客在博客的 courtyard 页面遇到了你的 3D 形象。

你的回答应该：
- 简短、口语化（控制在 2–4 句）
- 默认用中文；如果用户用英文提问就用英文回
- 不编造文章。只能从下面的列表里推荐已有的文章
- 当用户的问题明显指向某篇文章时，调用 findPost 工具传 slug，UI 会自动显示文章卡片

下面是博客上的全部文章（JSON）：
${JSON.stringify(postsForPrompt, null, 2)}
`;
```

The system prompt is regenerated at every build (`content-collections` runs first; the generated module re-imports). No runtime fetch.

### 8.3 Tool registration

The tool is built by a factory inside the hook so it can close over the `onFindPost` callback the consuming component passes in. It is **not** a module-level constant.

```ts
function makeFindPostTool(onFindPost: (post: PostMeta) => void) {
  return {
    name: 'findPost',
    description:
      '当用户的问题明显指向博客上的某篇具体文章时调用此工具。slug 必须从 system prompt 给出的列表里选；不要发明 slug。',
    inputSchema: {
      type: 'object',
      properties: {
        slug: {
          type: 'string',
          description: '文章的 slug（不含 /posts/ 前缀和末尾斜线）',
        },
        reason: {
          type: 'string',
          description: '一句话说明为什么推荐这篇',
        },
      },
      required: ['slug'],
    },
    async execute({ slug }: { slug: string; reason?: string }) {
      const post = postsForPrompt.find(p => p.slug === slug);
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
```

UI rendering of the post card happens via the callback:

```ts
const { send, state } = useGeminiNano({
  onFindPost: (post) => appendPostCardToCurrentMessage(post),
});
```

When the model returns the tool's result and then continues narrating, the user sees: model's lead-in text → inline post card → model's wrap-up text. All within the same assistant message bubble.

### 8.4 Sending a message

```ts
async function send(userText: string) {
  appendMessage({ role: 'user', text: userText });
  appendMessage({ role: 'assistant', text: '', streaming: true });
  try {
    const stream = session.promptStreaming(userText);
    for await (const chunk of stream) {
      updateLastAssistant(chunk);  // append delta
    }
    finalizeLastAssistant();
  } catch (err) {
    replaceLastAssistant({ text: '抱歉，刚才出了点问题。再试一次？', error: true });
  }
}
```

### 8.5 Token / context budget

Gemini Nano has a small context window. The metadata payload for 4 posts is comfortably under 1 KB — safe.

If the corpus grows past ~20 posts and the system prompt approaches the limit, the contract for V2 is to switch from "embed all metadata" to "lazy `findPost` lookup" (the tool already returns post details; the system prompt would just list slugs + titles, and the tool fetches description on demand). The MVP does not implement this — it just guards against the case by truncating to the most recent 20 posts in `posts-context.ts` if `allPosts.length > 20`.

### 8.6 Conversation rules

- No persistence across reloads. Refresh = new session.
- No system-prompt editing UI. The system prompt is build-time only.
- No streaming cancel button in MVP (V2 candidate).

## 9. Navigation and discoverability

The courtyard is not in the main nav. Two entry points, both added at the **page level** (not by modifying the shared `Hero` component):

1. **About page (`pages/about.mdx`)** — append a single sentence at the end of the existing bio: *"也可以到 [小院子](/courtyard) 找我聊聊。"* Single inline MDX link, inherits AboutPage prose styles.
2. **Home page (`pages/index.mdx`)** — after `<Hero ... />` and before `<RecentPosts />`, insert a small centered link line: *"或者去[小院子](/courtyard)走走 →"*. Wrap in a `<p>` with `--text-meta` mono, color text-secondary, top margin to clear the Hero. **Do not modify `Hero.tsx`** — keep the component's contract intact.

Both links are deliberately subdued — the courtyard is a discoverable easter egg, not a featured product surface.

The `/courtyard` route itself is real, indexable, and listed in the sitemap (no special exclusion). If someone shares the URL it just works.

## 10. State management (jotai)

Atoms live in `src/stores/courtyard.ts`:

| Atom | Type | Default | Purpose |
|---|---|---|---|
| `playerPosAtom` | `[number, number, number]` | `[0, 0.45, 3.5]` | Player capsule position; updated every frame by `useKeyboardMovement` |
| `nearbyTriggerAtom` | `{ propId, label, onActivate } \| null` | `null` | The currently-active trigger zone; read by `TriggerHint` |
| `activeModalAtom` | `'chat' \| 'posts' \| null` | `null` | Which modal is open; read by `Courtyard` to render the right overlay; read by `useKeyboardMovement` to disable input |
| `chatMessagesAtom` | `Message[]` | `[]` | Chat history for the current session |
| `geminiStateAtom` | `'checking' \| 'unavailable' \| 'downloadable' \| 'downloading' \| 'available' \| 'error'` | `'checking'` | Mirrors `useGeminiNano` state for the banner + ChatPanel to read |

All atoms are reset on `Courtyard` unmount.

## 11. Browser support

| Feature | Browser support |
|---|---|
| R3F scene + keyboard movement + UI overlays | All modern browsers (Chrome, Firefox, Safari, Edge — desktop and tablet) |
| Gemini Nano chat | Chrome 138+ with Prompt API enabled; gracefully degrades elsewhere |
| Mobile (<768px) | `MobileNotice` displayed; scene renders behind but is inert |

`src/types/prompt-api.d.ts` declares the ambient global:

```ts
declare global {
  interface Window {
    LanguageModel?: {
      availability(): Promise<'unavailable' | 'downloadable' | 'downloading' | 'available'>;
      create(options: {
        initialPrompts?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
        tools?: Array<{
          name: string;
          description: string;
          inputSchema: object;
          execute: (input: unknown) => Promise<unknown>;
        }>;
        expectedInputs?: Array<{ type: 'text'; languages?: string[] }>;
        expectedOutputs?: Array<{ type: 'text'; languages?: string[] }>;
        monitor?: (m: EventTarget) => void;
      }): Promise<LanguageModelSession>;
    };
  }
  interface LanguageModelSession {
    prompt(input: string): Promise<string>;
    promptStreaming(input: string): AsyncIterable<string>;
    destroy(): void;
  }
}
export {};
```

If Chrome's eventual shipping API differs from this ambient declaration, only this file and `useGeminiNano.ts` need to change.

## 12. Known MVP limitations (call out in user-facing copy)

- WASD moves the player in world-axes, not screen-axes — visually that means up-arrow walks toward upper-right, not directly up. Documented in the trigger hint ("方向键 / WASD 走动"). Not "fixed" in MVP because rotating world-axis movement to screen-axis movement adds a layer of math that's wasted if we later add a follow-camera anyway.
- Yiyang's avatar is a flat sprite. He doesn't have a body, doesn't animate, and looks awkward from any angle other than head-on (which is always the case here because of the Billboard helper).
- The 22 GB Gemini Nano model download is a hard one-time cost on first use. We surface a progress bar but cannot make it faster.

## 13. Performance and build impact

- `pages/courtyard.mdx` and everything under `src/components/courtyard/` must end up in a **separate chunk** in the build output. React Router v7's route-based code splitting handles this automatically since `courtyard.mdx` is its own route — verify in `pnpm build` output that `courtyard-*.js` is its own asset and that `three` does not appear in any other chunk.
- The MDX route uses `React.lazy` implicitly via React Router's loader; the heavy `<Courtyard>` import inside the MDX file is what triggers the split.
- **SSG / prerender:** The site is statically prerendered with no client SSR. The `Courtyard` component must guard against running in node — at the top of `Courtyard.tsx` return a placeholder skeleton if `typeof window === 'undefined'`, and load the heavy `<Scene>` (which imports R3F + three) via `React.lazy(() => import('./Scene'))` so the Canvas only mounts in the browser. The prerendered HTML therefore contains the skeleton; hydration replaces it with the live scene.
- Avatar texture: 32 KB (`avatar.jpeg`), already on CDN. Loaded once via `useLoader(TextureLoader, '...')`.
- Procedural ground tile texture: ~5 KB equivalent, generated on the client.
- Target frame time: ≤ 16ms on a 2020-era MacBook Air on Chrome. Single InstancedMesh fence + ContactShadows is well within budget.
- Bundle target: courtyard route ≤ 280 KB gzipped (three 150 + R3F 30 + drei 50 + our code ~30 + textures ~20).

## 14. Accessibility

- Keyboard-first by design — WASD/arrows for movement, E/Enter for activation, Escape to close modals.
- Trigger hints visible on screen show key bindings.
- Mobile notice provides a path back (link to home) instead of trapping the visitor in a non-functional scene.
- `prefers-reduced-motion: reduce`:
  - ContactShadows still render (static)
  - The trigger-hint fade is reduced to instant on/off
  - Streaming chat output renders the final text immediately on stream completion rather than token-by-token animation (a 200ms delay to mimic acknowledgment but no per-token render)
- Chat panel has appropriate `role="dialog"` and `aria-modal="true"` attributes; focus moves to the textarea on open and returns to the canvas on close.
- The 3D canvas itself has `role="application"` and an `aria-label` describing the scene.

## 15. Files affected

```
pages/courtyard.mdx                                  NEW
src/components/courtyard/Courtyard.tsx              NEW
src/components/courtyard/Scene.tsx                   NEW
src/components/courtyard/Ground.tsx                  NEW
src/components/courtyard/Fence.tsx                   NEW
src/components/courtyard/Tree.tsx                    NEW
src/components/courtyard/Player.tsx                  NEW
src/components/courtyard/YiyangAvatar.tsx            NEW
src/components/courtyard/NewspaperStand.tsx          NEW
src/components/courtyard/TriggerHint.tsx             NEW
src/components/courtyard/ChatPanel.tsx               NEW
src/components/courtyard/PostsModal.tsx              NEW
src/components/courtyard/MobileNotice.tsx            NEW
src/components/courtyard/useKeyboardMovement.ts      NEW
src/components/courtyard/useTriggerZone.ts           NEW
src/components/courtyard/useGeminiNano.ts            NEW
src/components/courtyard/posts-context.ts            NEW
src/components/courtyard/index.ts                    NEW
src/stores/courtyard.ts                              NEW
src/types/prompt-api.d.ts                             NEW
pages/index.mdx                                       EDIT — append courtyard link line between Hero and RecentPosts
pages/about.mdx                                       EDIT — append single-line link to courtyard
package.json                                          EDIT — add three / @react-three/fiber / @react-three/drei
```

## 16. Out of scope (V2 candidates)

- Real chibi 3D model for Yiyang (Meshy/Tripo3D generation from avatar.jpeg)
- More interactive props (mailbox, photo wall, mini gallery, café counter)
- Multiple NPCs (different topics: design / AI / frontend specialists)
- Asset kit ingestion path (Synty / Kenney) for vinyl-style props
- Mobile touch movement (virtual joystick / D-pad / tap-to-move)
- Sound design (ambient + UI SFX)
- Camera follow + screen-space WASD remapping
- Persistent chat memory across reloads (localStorage)
- Cloud LLM fallback for non-Chrome browsers
- Day/night cycle, weather, seasonal dressing
- Visitor avatars (let the visitor pick a sprite too)
- Achievements / explore-all-props badge

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
      // No expectedInputs/expectedOutputs language hints: Chrome 138's Prompt API
      // only accepts [en, es, ja] for that field and rejects calls that pass
      // anything else. The Chinese system prompt + the model's multilingual
      // weights handle CN/EN responses without explicit hinting.
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

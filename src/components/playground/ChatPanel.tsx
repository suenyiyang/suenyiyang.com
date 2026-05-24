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
            src={siteConfig.about?.avatar}
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

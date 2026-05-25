import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { nanoid } from "nanoid";
import { memo, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { siteConfig } from "~/config";
import {
  activeModalAtom,
  chatMessagesAtom,
  geminiDownloadProgressAtom,
  geminiStateAtom,
  modelConsentAtom,
  type ChatMessage,
} from "~/stores/playground";
import { useGeminiNano } from "./useGeminiNano";

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

function StatusBadge({ state }: { state: string }) {
  const { color, label } = (() => {
    switch (state) {
      case "available":
        return { color: "#5ca06e", label: "ready" };
      case "downloading":
        return { color: "#d4a838", label: "downloading" };
      case "downloadable":
        return { color: "#a87838", label: "needs setup" };
      case "checking":
        return { color: "#a8a8a8", label: "checking" };
      default:
        return { color: "#c85858", label: "offline" };
    }
  })();
  return (
    <span className="flex items-center gap-1.5 font-mono text-eyebrow tracking-[0.14em] uppercase text-[var(--reading-text-secondary)]">
      <span
        aria-hidden
        className="inline-block w-1.5 h-1.5 rounded-full"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}

function ThinkingDots({ reduce }: { reduce: boolean }) {
  if (reduce) {
    return (
      <span
        aria-label="Yiyang is thinking"
        className="text-[var(--reading-text-muted)]"
      >
        …
      </span>
    );
  }
  return (
    <span
      aria-label="Yiyang is thinking"
      className="inline-flex items-center gap-1 py-1 align-middle"
    >
      <span className="block w-1.5 h-1.5 rounded-full bg-[var(--reading-text-muted)] animate-bounce [animation-delay:-0.3s]" />
      <span className="block w-1.5 h-1.5 rounded-full bg-[var(--reading-text-muted)] animate-bounce [animation-delay:-0.15s]" />
      <span className="block w-1.5 h-1.5 rounded-full bg-[var(--reading-text-muted)] animate-bounce" />
    </span>
  );
}

const Message = memo(function Message({
  msg,
  reduce,
}: {
  msg: ChatMessage;
  reduce: boolean;
}) {
  const isUser = msg.role === "user";
  const isThinking = msg.streaming && !msg.text;
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-body leading-[1.55] whitespace-pre-wrap ${
          isUser
            ? "bg-[#1a3a2a] text-[#f3eedb]"
            : "bg-[#f4efe3] text-[var(--reading-text-primary)]"
        }`}
      >
        {isThinking ? <ThinkingDots reduce={reduce} /> : msg.text}
        {msg.streaming && !isThinking && !reduce && (
          <span className="ml-0.5 animate-pulse">▍</span>
        )}
        {msg.postCard && (
          <Link
            to={msg.postCard.url}
            className="mt-3 block rounded-lg border border-[var(--reading-rule)] bg-[var(--reading-paper)] p-3 hover:border-[#1a3a2a]/40 transition-colors"
          >
            <div className="font-display italic text-h4 text-[var(--reading-text-primary)] leading-snug">
              {msg.postCard.title}
            </div>
            {msg.postCard.description && (
              <div className="text-secondary text-[var(--reading-text-secondary)] mt-1 line-clamp-2">
                {msg.postCard.description}
              </div>
            )}
            <div className="font-mono text-meta text-[var(--reading-text-muted)] mt-2">
              去阅读 →
            </div>
          </Link>
        )}
      </div>
    </div>
  );
});

function InfoPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[var(--reading-rule)] bg-[#f4efe3] p-4 mb-3">
      {children}
    </div>
  );
}

function UnavailablePanel() {
  return (
    <InfoPanel>
      <div className="font-display italic text-h3 text-[var(--reading-text-primary)] mb-2">
        浏览器暂不支持
      </div>
      <p className="text-secondary text-[var(--reading-text-secondary)] leading-[1.6] mb-3">
        小院子里的 Yiyang 由 Chrome 内置的 Gemini Nano（Prompt API）在本地驱动，
        当前浏览器还没有这项能力，所以暂时无法对话。
      </p>
      <ul className="font-mono text-meta text-[var(--reading-text-secondary)] list-disc pl-5 space-y-1">
        <li>使用桌面端 Chrome 138+</li>
        <li>
          访问 <code className="text-[var(--reading-text-primary)]">chrome://flags</code>，开启
          <code className="mx-1 text-[var(--reading-text-primary)]">#prompt-api-for-gemini-nano</code>
          与 <code className="mx-1 text-[var(--reading-text-primary)]">#optimization-guide-on-device-model</code>
        </li>
        <li>重启浏览器后再访问本页面</li>
      </ul>
      <p className="font-mono text-meta text-[var(--reading-text-muted)] mt-3">
        场景仍可探索，按 <kbd className="font-mono px-1 py-0.5 rounded border border-[var(--reading-rule)] bg-[var(--reading-paper)] text-[var(--reading-text-primary)]">Esc</kbd> 关闭本对话即可继续逛 →
      </p>
    </InfoPanel>
  );
}

function ConsentPanel({
  onGrant,
  onDecline,
}: {
  onGrant: () => void;
  onDecline: () => void;
}) {
  return (
    <InfoPanel>
      <div className="font-display italic text-h3 text-[var(--reading-text-primary)] mb-2">
        需要下载本地模型
      </div>
      <p className="text-secondary text-[var(--reading-text-secondary)] leading-[1.6] mb-2">
        Yiyang 在你的浏览器里本地运行，不会把对话发送到任何服务器。
        需要下载约 <strong className="text-[var(--reading-text-primary)]">22 GB</strong> 的
        Gemini Nano 权重，下载完成后再次访问就不用重新下载。
      </p>
      <p className="font-mono text-meta text-[var(--reading-text-muted)] mb-4">
        在 Wi-Fi 环境或非按流量计费的网络下进行更合适。
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onGrant}
          className="rounded-md bg-[#1a3a2a] text-[#f3eedb] px-4 py-2 font-mono text-meta tracking-wide hover:bg-[#244e38] transition-colors"
        >
          同意并开始下载
        </button>
        <button
          type="button"
          onClick={onDecline}
          className="rounded-md border border-[var(--reading-rule)] text-[var(--reading-text-secondary)] px-4 py-2 font-mono text-meta tracking-wide hover:border-[var(--reading-text-muted)] hover:text-[var(--reading-text-primary)] transition-colors"
        >
          暂不下载
        </button>
      </div>
    </InfoPanel>
  );
}

function DeclinedPanel({ onReconsider }: { onReconsider: () => void }) {
  return (
    <InfoPanel>
      <div className="font-display italic text-h3 text-[var(--reading-text-primary)] mb-2">
        已暂停对话
      </div>
      <p className="text-secondary text-[var(--reading-text-secondary)] leading-[1.6] mb-3">
        你选择了不下载本地模型，所以输入框被禁用了。改主意了可以随时重新启用。
      </p>
      <button
        type="button"
        onClick={onReconsider}
        className="rounded-md bg-[#1a3a2a] text-[#f3eedb] px-4 py-2 font-mono text-meta tracking-wide hover:bg-[#244e38] transition-colors"
      >
        重新启用对话
      </button>
    </InfoPanel>
  );
}

function DownloadingPanel({ progress }: { progress: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(progress * 100)));
  return (
    <InfoPanel>
      <div className="flex items-baseline justify-between mb-2">
        <span className="font-mono text-eyebrow tracking-[0.14em] uppercase text-[var(--reading-text-secondary)]">
          下载 Gemini Nano
        </span>
        <span className="font-mono text-meta text-[var(--reading-text-primary)] tabular-nums">
          {pct}%
        </span>
      </div>
      <div className="h-1 w-full bg-[var(--reading-rule)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#1a3a2a] transition-[width] duration-200"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="font-mono text-meta text-[var(--reading-text-muted)] mt-3">
        首次下载耗时取决于网速 (~22 GB)，可以让标签页保持开启。
      </p>
    </InfoPanel>
  );
}

export function ChatPanel() {
  const setActiveModal = useSetAtom(activeModalAtom);
  const [messages, setMessages] = useAtom(chatMessagesAtom);
  const state = useAtomValue(geminiStateAtom);
  const progress = useAtomValue(geminiDownloadProgressAtom);
  const [consent, setConsent] = useAtom(modelConsentAtom);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const reduce = usePrefersReducedMotion();
  const bufferedTextRef = useRef("");

  const close = () => setActiveModal(null);

  useEffect(() => {
    previousFocus.current = document.activeElement as HTMLElement | null;
    textareaRef.current?.focus();
    return () => {
      previousFocus.current?.focus();
    };
  }, []);

  const { send, startDownload } = useGeminiNano({
    // The placeholder assistant bubble is inserted by `onSubmit` so the
    // thinking dots show up immediately on send — there's no need to add
    // another one when the stream actually opens.
    onAssistantStart: () => {
      bufferedTextRef.current = "";
    },
    onAssistantChunk: (chunk) => {
      bufferedTextRef.current += chunk;
      if (!reduce) {
        setMessages((prev) =>
          prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, text: m.text + chunk } : m
          )
        );
      }
    },
    onAssistantEnd: () =>
      setMessages((prev) =>
        prev.map((m, i) =>
          i === prev.length - 1
            ? { ...m, text: reduce ? bufferedTextRef.current : m.text, streaming: false }
            : m
        )
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

  // Consent only gates the ~22 GB *download*. Once the model is available
  // locally there's nothing to consent to, so we just let the visitor chat
  // even if they previously declined or never answered. When the model is
  // missing we always re-prompt (treat "granted" the same as "pending") so
  // visitors are never surprised by a silent download kicking off.
  const needsConsent = state === "downloadable";
  const canSend = state === "available";

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !canSend) return;
    setMessages((prev) => [
      ...prev,
      { id: nanoid(), role: "user", text },
      { id: nanoid(), role: "assistant", text: "", streaming: true },
    ]);
    setDraft("");
    void send(text);
  };

  const grantConsent = () => {
    setConsent("granted");
    void startDownload();
  };

  const placeholder =
    state === "unavailable"
      ? "当前浏览器不支持"
      : state === "checking"
        ? "正在检查环境…"
        : state === "downloading"
          ? "模型下载中…"
          : needsConsent && consent === "declined"
            ? "已暂停对话"
            : needsConsent
              ? "请先同意下载模型"
              : canSend
                ? "聊聊…按 Enter 发送"
                : "暂不可用";

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
      <div className="relative flex flex-col w-[min(620px,92vw)] h-[min(620px,88vh)] rounded-xl bg-[var(--reading-paper)] text-[var(--reading-text-primary)] shadow-[0_20px_60px_-15px_rgba(20,15,8,0.45)] border border-[var(--reading-rule)] overflow-hidden">
        <header className="flex items-center gap-3 border-b border-[var(--reading-rule)] px-5 py-4">
          <img
            src={siteConfig.about?.avatar}
            alt=""
            className="w-10 h-10 rounded-full border border-[var(--reading-rule)] object-cover"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <h2
                id="chat-panel-title"
                className="font-display italic text-h3 leading-none text-[var(--reading-text-primary)]"
              >
                Yiyang
              </h2>
              <span className="font-mono text-meta text-[var(--reading-text-muted)]">(β)</span>
            </div>
            <div className="mt-1 flex items-center gap-3">
              <StatusBadge state={state} />
              <span aria-hidden className="text-[var(--reading-text-muted)]">·</span>
              <span className="font-mono text-eyebrow tracking-[0.14em] uppercase text-[var(--reading-text-muted)]">
                local · gemini nano
              </span>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close chat"
            onClick={close}
            className="font-mono text-meta text-[var(--reading-text-muted)] hover:text-[var(--reading-text-primary)] transition-colors px-2 py-1 rounded -mr-1"
          >
            ✕
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-auto px-5 py-4">
          {state === "unavailable" && <UnavailablePanel />}
          {needsConsent && consent === "declined" && (
            <DeclinedPanel onReconsider={grantConsent} />
          )}
          {needsConsent && consent !== "declined" && (
            <ConsentPanel
              onGrant={grantConsent}
              onDecline={() => setConsent("declined")}
            />
          )}
          {state === "downloading" && <DownloadingPanel progress={progress} />}
          {messages.length === 0 && canSend && (
            <div className="text-secondary text-[var(--reading-text-secondary)] leading-[1.6]">
              <p className="font-display italic text-h4 text-[var(--reading-text-primary)] mb-1">
                Hi 👋
              </p>
              <p>问我什么都行 —— 或让我从最近的文章里推荐一篇。</p>
            </div>
          )}
          {messages.map((m) => (
            <Message key={m.id} msg={m} reduce={reduce} />
          ))}
        </div>

        <form
          onSubmit={onSubmit}
          className="border-t border-[var(--reading-rule)] px-5 py-4 flex gap-2 items-end bg-[var(--reading-paper)]"
        >
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
            placeholder={placeholder}
            className="flex-1 resize-none rounded-md border border-[var(--reading-rule)] bg-[#f4efe3] text-[var(--reading-text-primary)] placeholder:text-[var(--reading-text-muted)] px-3 py-2 text-body leading-[1.5] focus:outline-none focus:border-[#1a3a2a] focus:bg-[var(--reading-paper)] transition-colors disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!canSend || !draft.trim()}
            className="rounded-md bg-[#1a3a2a] text-[#f3eedb] px-4 py-2 font-mono text-meta tracking-wide hover:bg-[#244e38] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            发送
          </button>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Dumbbell, TrendingUp, Utensils, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, relativeTime } from "@/lib/utils";

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

interface ToolEvent {
  name: string;
  status: "executing" | "done";
}

const SUGGESTED_PROMPTS = [
  { icon: TrendingUp, text: "How's my progress this week?", label: "Check in" },
  { icon: Dumbbell, text: "What workout do I have today?", label: "Workout" },
  { icon: Utensils, text: "I just finished lunch. What do I still need to hit macros?", label: "Macros" },
  { icon: RefreshCcw, text: "Update my weights based on last workout", label: "Program" },
];

const TOOL_LABELS: Record<string, string> = {
  get_todays_log: "Checking today's log...",
  get_weekly_summary: "Getting weekly summary...",
  get_current_program: "Loading program...",
  get_weight_history: "Fetching weight history...",
  get_user_profile: "Loading profile...",
  log_daily_entry: "Logging entry...",
  log_workout: "Logging workout...",
  update_program: "Updating program...",
  update_targets: "Updating targets...",
  get_progress_summary: "Getting progress summary...",
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [activeTools, setActiveTools] = useState<ToolEvent[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const streamingMessageRef = useRef("");

  // Load message history
  useEffect(() => {
    fetch("/api/chat").then((r) => r.json()).then(({ messages: history }) => {
      if (history?.length) setMessages(history);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeTools]);

  async function sendMessage(text?: string) {
    const content = (text || input).trim();
    if (!content || streaming) return;

    setInput("");
    streamingMessageRef.current = "";

    const userMsg: Message = { role: "user", content };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setStreaming(true);
    setActiveTools([]);

    // Add placeholder assistant message
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: allMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const rawData = line.slice(6);
          try {
            const data = JSON.parse(rawData);

            if (data.text) {
              streamingMessageRef.current += data.text;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: streamingMessageRef.current,
                };
                return updated;
              });
            } else if (data.event === "tool_start") {
              setActiveTools((prev) => [...prev.filter((t) => t.name !== data.data.name), { name: data.data.name, status: "executing" }]);
            } else if (data.event === "tool_done") {
              setActiveTools((prev) => prev.map((t) => t.name === data.data.name ? { ...t, status: "done" } : t));
              setTimeout(() => setActiveTools((prev) => prev.filter((t) => t.name !== data.data.name)), 1500);
            } else if (data.event === "done") {
              break;
            }
          } catch {
            // Parse error for partial chunks — safe to ignore
          }
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: "Something went wrong. Try again.",
        };
        return updated;
      });
    } finally {
      setStreaming(false);
      setActiveTools([]);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] max-w-lg mx-auto">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-background)]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
            <Dumbbell className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold">Coach</p>
            <p className="text-xs text-[var(--color-muted)]">AI Personal Trainer</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {!hydrated ? (
          <div className="flex justify-center py-8">
            <div className="flex gap-1">
              {[0, 150, 300].map((delay) => (
                <span key={delay} className="w-2 h-2 rounded-full bg-[var(--color-muted)] animate-bounce" style={{ animationDelay: `${delay}ms` }} />
              ))}
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="space-y-4 py-4">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--color-primary-muted)] flex items-center justify-center mx-auto mb-3">
                <Dumbbell className="w-8 h-8 text-[var(--color-primary)]" />
              </div>
              <h2 className="font-semibold text-lg">Coach</h2>
              <p className="text-sm text-[var(--color-muted)] mt-1">
                Direct, no-BS. Ask me anything about your training, diet, or progress.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-6">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p.text}
                  onClick={() => sendMessage(p.text)}
                  className="text-left p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-raised)] transition-all active:scale-95"
                >
                  <p className="text-xs font-medium text-[var(--color-muted)] mb-1">{p.label}</p>
                  <p className="text-xs text-[var(--color-foreground)] leading-relaxed">{p.text}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))
        )}

        {/* Active tool indicators */}
        {activeTools.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {activeTools.map((tool) => (
              <div
                key={tool.name}
                className={cn(
                  "flex items-center gap-2 py-1.5 px-3 rounded-full text-xs w-fit",
                  tool.status === "executing"
                    ? "bg-[var(--color-primary-muted)] text-[var(--color-primary)]"
                    : "bg-[var(--color-success-muted)] text-[var(--color-success)]"
                )}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full", tool.status === "executing" ? "bg-[var(--color-primary)] animate-pulse" : "bg-[var(--color-success)]")} />
                {TOOL_LABELS[tool.name] || tool.name}
              </div>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-[var(--color-border)] bg-[var(--color-background)] pb-safe">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message your coach..."
            rows={1}
            className="flex-1 min-h-[40px] max-h-32 px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] outline-none focus:border-[var(--color-primary)] resize-none"
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = "auto";
              t.style.height = `${Math.min(t.scrollHeight, 128)}px`;
            }}
          />
          <Button
            onClick={() => sendMessage()}
            disabled={!input.trim() || streaming}
            className="w-10 h-10 p-0 rounded-xl shrink-0"
            loading={streaming}
          >
            {!streaming && <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const isEmpty = !message.content;

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-[var(--color-primary)] text-white rounded-br-sm"
            : "bg-[var(--color-surface-raised)] text-[var(--color-foreground)] rounded-bl-sm",
          isEmpty && "animate-pulse"
        )}
      >
        {isEmpty ? (
          <span className="text-[var(--color-muted)] italic text-xs">Thinking...</span>
        ) : (
          <MessageContent content={message.content} />
        )}
        {message.created_at && (
          <p className={cn("text-[10px] mt-1", isUser ? "text-white/60" : "text-[var(--color-muted)]")}>
            {relativeTime(message.created_at)}
          </p>
        )}
      </div>
    </div>
  );
}

function MessageContent({ content }: { content: string }) {
  // Simple markdown-lite: bold, bullet points, line breaks
  const lines = content.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (!line.trim()) return <br key={i} />;
        const boldFormatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        const isBullet = line.startsWith("- ") || line.startsWith("• ");
        const text = isBullet ? boldFormatted.slice(2) : boldFormatted;
        return (
          <p key={i} className={cn(isBullet && "pl-3 relative before:content-['•'] before:absolute before:left-0")}>
            <span dangerouslySetInnerHTML={{ __html: text }} />
          </p>
        );
      })}
    </div>
  );
}

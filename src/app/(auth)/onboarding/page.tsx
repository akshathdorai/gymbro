"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Start the conversation on mount
  useEffect(() => {
    startOnboarding();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function startOnboarding() {
    setLoading(true);
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [] }),
    });

    const data = await res.json();
    setMessages([{ role: "assistant", content: data.message }]);
    setLoading(false);
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: newMessages }),
    });

    const data = await res.json();

    if (data.complete) {
      setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
      setSaving(true);
      // Wait 1.5s then redirect to dashboard
      setTimeout(() => router.push("/dashboard"), 2000);
    } else {
      setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
    }
    setLoading(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="min-h-full flex flex-col bg-[var(--color-background)]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--color-background)] border-b border-[var(--color-border)] px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-semibold text-gradient">GymBro</h1>
          <p className="text-xs text-[var(--color-muted)]">First session intake</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto pb-32 pt-safe">
        <div className="max-w-2xl mx-auto px-4 space-y-4 py-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-32">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-[var(--color-primary)] text-white rounded-br-sm"
                    : "bg-[var(--color-surface-raised)] text-[var(--color-foreground)] rounded-bl-sm"
                )}
              >
                {msg.content.split("\n").map((line, j) => (
                  <span key={j}>
                    {line}
                    {j < msg.content.split("\n").length - 1 && <br />}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-[var(--color-surface-raised)] rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-muted)] animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-muted)] animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-muted)] animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          {saving && (
            <div className="text-center py-4">
              <p className="text-sm text-[var(--color-muted)]">Building your program...</p>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      {!saving && (
        <div className="fixed bottom-0 left-0 right-0 bg-[var(--color-background)] border-t border-[var(--color-border)] p-4 pb-safe">
          <div className="max-w-2xl mx-auto flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tell your trainer..."
              rows={1}
              className="flex-1 min-h-[40px] max-h-32 px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] outline-none focus:border-[var(--color-primary)] resize-none overflow-y-auto"
              style={{ lineHeight: "1.5" }}
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = "auto";
                t.style.height = `${Math.min(t.scrollHeight, 128)}px`;
              }}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="w-10 h-10 p-0 rounded-xl shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

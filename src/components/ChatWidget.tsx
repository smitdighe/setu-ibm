/**
 * ChatWidget — floating chat panel for the Teacher Assistant.
 * Calls POST /api/chat and renders reply + actionButton chips.
 */
"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { t } from "@/lib/i18n";

type ActionButton = { label: string; intent: string; payload: Record<string, unknown> };
type Message = { role: "user" | "assistant"; text: string; buttons?: ActionButton[] };

type Props = { classId: string; sessionId: string };

export default function ChatWidget({ classId, sessionId }: Props) {
  const [open, setOpen] = useState(false);
  const [lang] = useLang();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Re-set greeting message when lang changes
  useEffect(() => {
    setMessages([{ role: "assistant", text: t("chatGreeting", lang) }]);
  }, [lang]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, sessionId, classId, lang }),
      });
      const json = await res.json();
      const reply = json?.data?.reply ?? json?.error ?? t("chatError", lang);
      const buttons: ActionButton[] = json?.data?.actionButtons ?? [];
      setMessages((prev) => [...prev, { role: "assistant", text: reply, buttons }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: t("networkError", lang) }]);
    } finally {
      setLoading(false);
    }
  }

  async function fireAction(btn: ActionButton) {
    setMessages((prev) => [...prev, { role: "user", text: `[Action] ${btn.label}` }]);
    setLoading(true);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: btn.intent, payload: btn.payload }),
      });
      const json = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", text: json?.success ? t("done", lang) : json?.error ?? t("failed", lang) }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 transition-colors"
        aria-label={t("chatTitle", lang)}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-80 bg-white border border-gray-200 rounded-xl shadow-xl flex flex-col" style={{ height: 440 }}>
          <div className="px-4 py-3 border-b border-gray-200 bg-blue-600 rounded-t-xl">
            <p className="text-sm font-semibold text-white">{t("chatTitle", lang)}</p>
            <p className="text-xs text-blue-200">{t("chatSubtitle", lang)}</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] ${m.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"} rounded-xl px-3 py-2 text-sm leading-relaxed`}>
                  {m.text}
                  {m.buttons && m.buttons.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {m.buttons.map((btn, j) => (
                        <button
                          key={j}
                          onClick={() => fireAction(btn)}
                          className="text-xs bg-white text-blue-700 border border-blue-300 px-2 py-1 rounded-full hover:bg-blue-50 transition-colors"
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-500 rounded-xl px-3 py-2 text-sm">{t("chatThinking", lang)}</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-2 border-t border-gray-200 flex gap-2">
            <input
              className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder={t("chatPlaceholder", lang)}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              disabled={loading}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="bg-blue-600 text-white rounded-lg px-3 py-1.5 hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  X,
  Send,
  Loader2,
  Sparkles,
  Bot,
  RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { streamChat, getChatHistory } from "@/lib/api";
import type { ChatMessage as ChatMessageType } from "@/types/database";

interface ChatWidgetProps {
  analysisId: string;
  videoTitle?: string;
}

const PROMPT_SUGGESTIONS = [
  "Why did viewers leave at the worst cliff?",
  "How can I raise my retention health score?",
  "Did audio or pacing cause the early drop?",
  "Give me DaVinci/Premiere edit cuts for this video",
];


export function ChatWidget({ analysisId, videoTitle }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [inputMessage, setInputMessage] = React.useState("");
  const [messages, setMessages] = React.useState<ChatMessageType[]>([]);
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Helper to generate the default Studio Advisor greeting
  const getWelcomeGreeting = React.useCallback((): ChatMessageType => {
    return {
      role: "assistant",
      content: `Hello! I'm The Studio Advisor (Agent 8). I've reviewed your retention forensic report${
        videoTitle ? ` for "${videoTitle}"` : ""
      }. Ask me anything about your audience drop-offs, pacing, or specific editing fixes.`,
      created_at: new Date().toISOString(),
    };
  }, [videoTitle]);

  // Load history ONCE when analysisId changes
  React.useEffect(() => {
    if (!analysisId) return;

    let isCancelled = false;
    setIsLoadingHistory(true);

    // Provide the greeting immediately so the user can see and interact right away
    setMessages([getWelcomeGreeting()]);

    getChatHistory(analysisId)
      .then((history) => {
        if (isCancelled) return;
        if (history && history.length > 0) {
          setMessages(history);
        }
      })
      .catch((err) => {
        console.warn("Could not load chat history:", err);
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingHistory(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [analysisId, getWelcomeGreeting]);

  // Auto-scroll to bottom on new messages or stream updates
  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, scrollToBottom]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isStreaming) return;

    setInputMessage("");

    // 1. Append user message
    const userMsg: ChatMessageType = {
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };

    // 2. Append an empty assistant message ready to receive streaming tokens
    const assistantMsg: ChatMessageType = {
      role: "assistant",
      content: "",
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    try {
      await streamChat(
        analysisId,
        text,
        (token) => {
          setMessages((prev) => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (lastIdx >= 0 && updated[lastIdx].role === "assistant") {
              updated[lastIdx] = {
                ...updated[lastIdx],
                content: updated[lastIdx].content + token,
              };
            }
            return updated;
          });
        },
        (error) => {
          console.error("Chat streaming error callback:", error);
        }
      );
    } catch (err) {
      console.error("Failed to stream chat response:", err);
      setMessages((prev) => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (lastIdx >= 0 && updated[lastIdx].role === "assistant" && !updated[lastIdx].content) {
          updated[lastIdx] = {
            ...updated[lastIdx],
            content: "Sorry, I had trouble connecting to the advisory server. Please try asking again.",
          };
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetChat = () => {
    setMessages([getWelcomeGreeting()]);
  };

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  // Show suggested prompts if user hasn't asked a question yet
  const userMessagesCount = messages.filter((m) => m.role === "user").length;
  const showPromptSuggestions = userMessagesCount === 0;

  return createPortal(
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-[100] pointer-events-auto">
        <AnimatePresence>
          {!isOpen && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(true)}
              className="relative flex items-center gap-2.5 px-4 py-3.5 rounded-full bg-gradient-to-r from-accent to-accent-dark text-white shadow-glow hover:shadow-xl transition-all cursor-pointer select-none font-mono text-xs font-semibold"
              aria-label="Open Studio Advisor Chat"
            >
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>Ask Studio Advisor</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Expandable Chat Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-4 sm:right-6 z-[100] w-[92vw] sm:w-[440px] h-[600px] max-h-[85vh] rounded-3xl bg-white border border-stone-800/[0.12] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-black/[0.06] bg-stone-50/80 backdrop-blur-md flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-accent to-accent-dark text-white flex items-center justify-center shadow-sm">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-heading text-sm font-bold text-text-primary">
                      The Studio Advisor
                    </h3>
                    <span className="px-1.5 py-0.2 rounded bg-orange-100 text-accent font-mono text-[9px] font-semibold border border-orange-200">
                      Agent 8
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-text-tertiary">
                    <span>Groq 120B • Context Aware</span>
                    {isLoadingHistory && (
                      <span className="inline-flex items-center gap-1 text-accent font-semibold">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Syncing</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleResetChat}
                  title="Reset conversation"
                  className="p-2 rounded-xl text-stone-400 hover:text-text-primary hover:bg-neutral-100 transition-colors cursor-pointer"
                  aria-label="Reset Conversation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl text-stone-400 hover:text-text-primary hover:bg-neutral-100 transition-colors cursor-pointer"
                  aria-label="Close Chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background-base/40">
              {messages.map((msg, idx) => (
                <ChatMessage
                  key={idx}
                  message={msg}
                  isStreaming={
                    isStreaming &&
                    idx === messages.length - 1 &&
                    msg.role === "assistant"
                  }
                />
              ))}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Prompts (visible before user asks their first question) */}
            {showPromptSuggestions && (
              <div className="px-4 py-2 bg-stone-50 border-t border-black/[0.04] overflow-x-auto flex gap-1.5 scrollbar-none">
                {PROMPT_SUGGESTIONS.map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(sug)}
                    className="shrink-0 px-2.5 py-1 rounded-lg bg-white border border-stone-200 hover:border-accent/40 text-[11px] text-text-secondary hover:text-accent font-sans transition-colors cursor-pointer"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            )}

            {/* Input Footer */}
            <div className="p-3 sm:p-4 bg-white border-t border-black/[0.06]">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about retention drops, pacing, fixes..."
                  disabled={isStreaming}
                  className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent bg-stone-50/50"
                />
                <Button
                  variant="accent"
                  size="sm"
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isStreaming}
                  className="shrink-0 h-9 w-9 p-0 rounded-xl"
                  aria-label="Send message"
                >
                  {isStreaming ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Send className="w-4 h-4 text-white" />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body
  );
}


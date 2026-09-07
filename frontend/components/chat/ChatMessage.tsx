"use client";

import { User, Sparkles } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/types/database";

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
}

export function ChatMessage({ message, isStreaming = false }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex items-start gap-3 text-xs ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* Avatar Icon */}
      <div
        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
          isUser
            ? "bg-stone-800 text-white"
            : "bg-gradient-to-tr from-accent to-accent-dark text-white"
        }`}
      >
        {isUser ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
      </div>

      {/* Message Bubble */}
      <div
        className={`max-w-[82%] rounded-2xl px-4 py-3 leading-relaxed ${
          isUser
            ? "bg-stone-900 text-white rounded-tr-xs shadow-cozy"
            : "bg-white border border-stone-800/[0.08] text-text-primary rounded-tl-xs shadow-cozy"
        }`}
      >
        <div className="whitespace-pre-wrap font-sans">
          {message.content ? (
            message.content
          ) : isStreaming ? (
            <span className="text-text-tertiary italic">Advisor is reviewing retention data...</span>
          ) : null}
          {isStreaming && (
            <span className="inline-block w-1.5 h-3 ml-1 bg-accent animate-pulse align-middle" />
          )}
        </div>

        {message.created_at && (
          <div
            className={`text-[9px] font-mono mt-1 ${
              isUser ? "text-stone-400 text-right" : "text-text-tertiary"
            }`}
          >
            {new Date(message.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}
      </div>
    </div>
  );
}

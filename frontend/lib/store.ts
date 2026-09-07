import { create } from "zustand";
import type {
  AnalysisStatusResponse,
  ChatMessage,
} from "@/types/database";

interface CutpointStore {
  // Analysis state
  activeAnalysisId: string | null;
  analysisStatus: AnalysisStatusResponse | null;
  isPolling: boolean;
  setActiveAnalysis: (id: string | null) => void;
  updateStatus: (status: AnalysisStatusResponse | null) => void;
  setIsPolling: (isPolling: boolean) => void;
  clearAnalysis: () => void;

  // Chat state
  chatMessages: ChatMessage[];
  isChatOpen: boolean;
  isChatStreaming: boolean;
  addChatMessage: (msg: ChatMessage) => void;
  updateLastAssistantMessage: (token: string) => void;
  setChatOpen: (open: boolean) => void;
  setChatStreaming: (streaming: boolean) => void;
  setChatMessages: (msgs: ChatMessage[]) => void;
  clearChat: () => void;
}

export const useCutpointStore = create<CutpointStore>((set) => ({
  // Initial Analysis State
  activeAnalysisId: null,
  analysisStatus: null,
  isPolling: false,

  setActiveAnalysis: (id) => set({ activeAnalysisId: id }),
  updateStatus: (status) => set({ analysisStatus: status }),
  setIsPolling: (isPolling) => set({ isPolling }),
  clearAnalysis: () =>
    set({
      activeAnalysisId: null,
      analysisStatus: null,
      isPolling: false,
    }),

  // Initial Chat State
  chatMessages: [],
  isChatOpen: false,
  isChatStreaming: false,

  addChatMessage: (msg) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, msg],
    })),

  updateLastAssistantMessage: (token) =>
    set((state) => {
      const msgs = [...state.chatMessages];
      if (msgs.length === 0) {
        return { chatMessages: [{ role: "assistant", content: token }] };
      }
      const last = msgs[msgs.length - 1];
      if (last.role === "assistant") {
        msgs[msgs.length - 1] = {
          ...last,
          content: last.content + token,
        };
        return { chatMessages: msgs };
      } else {
        return {
          chatMessages: [...msgs, { role: "assistant", content: token }],
        };
      }
    }),

  setChatOpen: (open) => set({ isChatOpen: open }),
  setChatStreaming: (streaming) => set({ isChatStreaming: streaming }),
  setChatMessages: (msgs) => set({ chatMessages: msgs }),
  clearChat: () => set({ chatMessages: [], isChatStreaming: false }),
}));

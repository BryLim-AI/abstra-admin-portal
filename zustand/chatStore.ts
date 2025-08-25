// stores/chatStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ChatState {
    preselectedChat: any;
    setPreselectedChat: (chat: any) => void;
}

export const useChatStore = create<ChatState>()(
    persist(
        (set) => ({
            preselectedChat: null,
            setPreselectedChat: (chat) => set({ preselectedChat: chat }),
            clearPreselectedChat: () => set({ preselectedChat: null }),

        }),
        {
            name: "chat-storage",

        }
    )
);

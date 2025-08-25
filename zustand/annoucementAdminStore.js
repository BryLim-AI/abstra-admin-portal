import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAnnouncementStore = create(
    persist(
        (set) => ({
            title: "",
            message: "",
            targetAudience: "all",
            setTitle: (title) => set({ title }),
            setMessage: (message) => set({ message }),
            setTargetAudience: (targetAudience) => set({ targetAudience }),
            resetForm: () => set({ title: "", message: "", targetAudience: "all" }),
        }),
        {
            name: "announcement-form",
        }
    )
);

export default useAnnouncementStore;

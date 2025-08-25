import { create } from "zustand";
import { persist } from "zustand/middleware";

const useRoleStore = create(
  persist(
    (set) => ({
      role: "",
      setRole: (newRole) => set({ role: newRole }),
    }),
    {
      name: "user-role",
    }
  )
);

export default useRoleStore;


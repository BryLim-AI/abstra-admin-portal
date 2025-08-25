import { create } from "zustand";
import { persist } from "zustand/middleware";
import { decryptData } from "../crypto/encrypt";
import { useRouter } from "next/navigation";

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      admin: null,
      loading: true,

      decryptUserData: (data) => {
        try {
          const encryptionKey = process.env.ENCRYPTION_SECRET;
          if (!encryptionKey) {
            console.error(
              "[AuthStore] Missing ENCRYPTION_SECRET in environment variables."
            );
            return data;
          }

          const safeParse = (value) => {
            try {
              return value ? JSON.parse(value) : null;
            } catch (err) {
              console.error("Failed to parse encrypted value:", value, err);
              return null;
            }
          };

          return {
            user_id: data.user_id || null,
            firstName: safeParse(data.firstName)
              ? decryptData(safeParse(data.firstName), encryptionKey)
              : null,
            lastName: safeParse(data.lastName)
              ? decryptData(safeParse(data.lastName), encryptionKey)
              : null,
            email: safeParse(data.email)
              ? decryptData(safeParse(data.email), encryptionKey)
              : null,
            profilePicture: safeParse(data.profilePicture)
              ? decryptData(safeParse(data.profilePicture), encryptionKey)
              : null,
            birthDate: safeParse(data.birthDate)
              ? decryptData(safeParse(data.birthDate), encryptionKey)
              : null,
            phoneNumber: safeParse(data.phoneNumber)
              ? decryptData(safeParse(data.phoneNumber), encryptionKey)
              : null,
            is_2fa_enabled: data.is_2fa_enabled || false,
            tenant_id: data.tenant_id || null,
            points: data.points || 0,
            userType: data.userType || null,
            landlord_id: data.landlord_id || null,
            is_verified: data.landlord_id ? data.is_verified || false : null,
            is_trial_used: data.landlord_id
              ? data.is_trial_used || false
              : null,
            subscription: data.subscription
              ? {
                  subscription_id: data.subscription.subscription_id || null,
                  plan_name: data.subscription.plan_name || "N/A",
                  status: data.subscription.status || "inactive",
                  start_date: data.subscription.start_date || null,
                  end_date: data.subscription.end_date || null,
                  payment_status: data.subscription.payment_status || "unpaid",
                  trial_end_date: data.subscription.trial_end_date || null,
                }
              : null,
          };
        } catch (error) {
          console.error("[AuthStore] Error decrypting user data:", error);
          return data;
        }
      },

      decryptAdminData: (data) => {
        try {
          const encryptionKey = process.env.ENCRYPTION_SECRET;
          if (!encryptionKey) {
            console.error(
              "[AuthStore] Missing ENCRYPTION_SECRET in environment variables."
            );
            return data;
          }

          return {
            admin_id: data.admin_id || null,
            username: data.username || "N/A",
            first_name: data.first_name
              ? decryptData(JSON.parse(data.first_name), encryptionKey)
              : null,
            last_name: data.last_name
              ? decryptData(JSON.parse(data.last_name), encryptionKey)
              : null,
            email: data.email
              ? decryptData(JSON.parse(data.email), encryptionKey)
              : null,
            role: data.role,
            status: data.status || "inactive",
            profile_picture: data.profile_picture || null,
            permissions: data.permissions,
          };
        } catch (error) {
          console.error("[AuthStore] Error decrypting admin data:", error);
          return data;
        }
      },

      setUser: (userData) =>
        set((state) => ({
          user: state.decryptUserData(userData),
          admin: null,
          loading: false,
        })),

      setAdmin: (adminData) =>
        set((state) => ({
          admin: state.decryptAdminData(adminData),
          user: null,
          loading: false,
        })),

      updateUser: (updatedData) =>
        set((state) => {
          if (!state.user) return state;

          return {
            ...state,
            user: {
              ...state.user,
              ...updatedData,
            },
          };
        }),

      logout: () => set({ user: null, admin: null, loading: false }),

      fetchSession: async () => {
        try {
          set({ loading: true });
          const response = await fetch("/api/auth/me", {
            method: "GET",
            credentials: "include",
          });

          if (!response.ok) {
            set({ user: null, admin: null, loading: false });
            return;
          }

          const data = await response.json();

          if (data.admin_id) {
            set((state) => ({
              admin: state.decryptAdminData(data),
              user: null,
              loading: false,
            }));
          } else if (data.user_id) {
            set((state) => ({
              user: state.decryptUserData(data),
              admin: null,
              loading: false,
            }));
          } else {
            set({ user: null, admin: null, loading: false });
          }
        } catch (error) {
          set({ user: null, admin: null, loading: false });
        }
      },

      signOut: async () => {
        try {
          const res = await fetch("/api/auth/logout", {
            method: "POST",
            credentials: "include",
          });

          if (!res.ok) {
            console.warn("[AuthStore] Failed to log out user.");
            window.location.href = "/pages/auth/login";
          }

          set({ user: null, admin: null, loading: false });
        } catch (error) {
          set({ user: null, admin: null, loading: false });
        }
      },

      signOutAdmin: async () => {
        try {
          const res = await fetch("/api/auth/logout", {
            method: "POST",
            credentials: "include",
          });

          if (!res.ok) {
            console.warn("[AuthStore] Failed to log out admin.");
          }

          set({ admin: null, user: null, loading: false });
          window.location.href = "/pages/admin_login";
        } catch (error) {
          console.error("[AuthStore] signOutAdmin error:", error);
          set({ admin: null, user: null, loading: false });
        }
      },
    }),
    {
      name: "auth-storage",
      getStorage: () => localStorage,
    }
  )
);

export default useAuthStore;

'use client';

import { create } from 'zustand';

const useForgotPasswordStore = create((set) => ({
    resetToken: '',
    newPassword: '',
    confirmPassword: '',
    isLoading: false,
    message: '',

    setResetToken: (token) => set({ resetToken: token }),
    setNewPassword: (password) => set({ newPassword: password }),
    setConfirmPassword: (password) => set({ confirmPassword: password }),
    setMessage: (message) => set({ message }),
    setIsLoading: (loading) => set({ isLoading: loading }),

    resetState: () => set({ resetToken: '', newPassword: '', confirmPassword: '', message: '', isLoading: false }),
}));

export default useForgotPasswordStore;

import { useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import useAuthStore from "../../zustand/authStore";
import axios from "axios"; // Import zustand store

export default function DeleteAccountButton({ user_id, userType }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete your account? This action is irreversible."
    );
    if (!confirmDelete) return;

    setDeleting(true);

    try {
      await axios.delete(`/api/auth/deleteAccount`, {
        data: { user_id, userType },
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });

      Swal.fire({
        icon: "success",
        title: "Account Deleted",
        text: "Your account has been deleted successfully.",
      }).then(() => {
        router.push("/pages/auth/login");
        window.location.reload();
      });
    } catch (error) {
      console.error("Account deletion failed:", error);
      await Swal.fire({
        icon: "error",
        title: "Deletion Failed",
        text: "Failed to delete account. You still have active lease in your account.",
      });
    }

    setDeleting(false);
  };

  const confirmDelete = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "This action will start a 30-day grace period before archiving your account.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete my account",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        handleDeleteAccount();
      }
    });
  };

  return (
    <div className="flex flex-col items-center">
      <button
        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
        onClick={confirmDelete}
        disabled={loading}
      >
        {loading ? "Processing..." : "Delete Account"}
      </button>
    </div>
  );
}

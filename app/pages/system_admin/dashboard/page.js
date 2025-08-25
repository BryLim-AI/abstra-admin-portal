"use client";
import useAuth from "../../../../hooks/useSession";
import { useRouter } from "next/navigation";
import { useState } from "react";
import PropertyAnalytics from "../../../../components/analytics/PropertyAnalytics";
import LoadingScreen from "../../../../components/loadingScreen";
import SideNavAdmin from "../../../../components/navigation/sidebar-admin";

export default function AdminDashboard() {
  const { admin, loading } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState(null);

  const router = useRouter();
  if (loading) {
    return <LoadingScreen />;
  }

  if (!admin) {
  }
  const handleDeleteAccount = async () => {
    const confirmDelete = confirm(
      "⚠️ Warning: Deleting your account is irreversible! \n\n" +
        "• You will permanently lose access to your account. \n" +
        "• All associated data (logs, reports, admin settings) may be deleted. \n" +
        "• This action cannot be undone.\n\n" +
        "Are you sure you want to continue?"
    );

    if (!confirmDelete) return;

    setIsDeleting(true);

    try {
      const response = await fetch("/api/systemadmin/delete_account", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_id: admin.admin_id }),
      });

      const data = await response.json();

      if (!response.ok)
        throw new Error(data.message || "Failed to delete account.");

      alert("Your account has been successfully deleted.");
      router.push("./login");
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <SideNavAdmin admin={admin} />

      <div className="flex-1 p-8 overflow-auto">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome, {admin?.username}!
          </h1>
          <p className="text-gray-600 mt-2">
            Your user type: <span className="font-semibold">{admin?.role}</span>
          </p>
          <p className="text-gray-600">Admin ID: {admin?.admin_id}</p>
          <p className="text-gray-600">Email: {admin?.email}</p>
        </div>

        <div className="mt-6 bg-white shadow-lg rounded-lg p-6">
          <h3 className="text-2xl font-semibold text-gray-800">Analytics</h3>
          <PropertyAnalytics />
        </div>

        <div className="mt-6 bg-white shadow-lg rounded-lg p-6">
          <h3 className="text-2xl font-semibold text-gray-800">Reports</h3>
          <iframe
            width="100%"
            height="500"
            src="https://lookerstudio.google.com/embed/reporting/543161d6-3d3e-44ab-b571-ec3446e99257/page/QogyE"
            style={{ border: "none" }}
            allowFullScreen
            sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          ></iframe>
        </div>


      </div>
    </div>
  );
}

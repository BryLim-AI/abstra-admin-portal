"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {FaTrash, FaEdit, FaEye} from "react-icons/fa";
import { MdPersonAddDisabled } from "react-icons/md";
import authStore from "../../../../../zustand/authStore";
import EditModal from "../../../../../components/systemAdmin/editAdmin";
import SideNavAdmin from "../../../../../components/navigation/sidebar-admin";
import { logEvent } from "../../../../../utils/gtag";
import LoadingScreen from "../../../../../components/loadingScreen";
import {decryptData} from "../../../../../crypto/encrypt";
import Swal from "sweetalert2";

export default function CoAdminDashboard() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { admin } = authStore();
  const [editModal, setEditModal] = useState(false);
  const router = useRouter();
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [formData, setFormData] = useState({ username: "", email: "", role: "", status: "", password: "" });

  useEffect(() => {
    if (!admin) return;
    const fetchCoAdmins = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/systemadmin/co_admin/getAllAdmins", { method: "GET", credentials: "include" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch admins");
        setAdmins(data.admins || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCoAdmins();
  }, [admin]);

  const handleEdit = async (admin_id) => {
    try {
      const res = await fetch(`/api/systemadmin/co_admin/getAdminDetail/${admin_id}`);
      const data = await res.json();

      if (!res.ok)  new Error(data.message || "Failed to fetch admin details");

      const encryptionKey = process.env.ENCRYPTION_SECRET;
      const decryptedEmail = data.admin.email.startsWith("{") && data.admin.email.endsWith("}")
          ? decryptData(JSON.parse(data.admin.email), encryptionKey)
          : data.admin.email;

      setSelectedAdmin(admin_id);
      setFormData({
        username: data.admin.username,
        email: decryptedEmail,
        role: data.admin.role,
        status: data.admin.status,
        password: ""
      });

      setEditModal(true);
    } catch (err) {
      alert(err.message);
    }
  };


  const handleDelete = async (admin_id) => {
    if (!confirm("Are you sure you want to delete this co-admin?")) return;
    try {
      const res = await fetch(`/api/systemadmin/co_admin/${admin_id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete co-admin");
      setAdmins((prev) => prev.filter((admin) => admin.admin_id !== admin_id));
      alert("Co-admin deleted successfully!");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleViewDetails = (admin_id) => {
    router.push(`/pages/system_admin/co_admin/details/${admin_id}`);
  };

  const handleStatusChange = async (admin_id, newStatus) => {
    try {
      const res = await fetch(`/api/systemadmin/co_admin/updateAccountStatus/${admin_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
        credentials: "include"
      });

      if (!res.ok) {
         new Error("Failed to update co-admin status");
      }

      setAdmins(prev =>
          prev.map(admin =>
              admin.admin_id === admin_id ? { ...admin, status: newStatus } : admin
          )
      );

      await Swal.fire({
        title: "Success",
        text: `Co-admin status updated to ${newStatus}`,
        icon: "success",
        confirmButtonText: "OK"
      });
    } catch (err) {
      await Swal.fire({
        title: "Error!",
        text: err.message,
        icon: "error",
        confirmButtonText: "OK"
      });
    }
  };

  const handleAddCoAdmin = () => {
    logEvent("page_view", "Navigation", "Add Co-Admin Page", 1);
    router.push("/pages/system_admin/co_admin/create");
  };

  if(loading){ 
    return <LoadingScreen />;
  }

  if(error) {
    return <p className="text-red-500 p-6">Error: {error}</p>;
  }

  return (
    <div className="flex">
      <SideNavAdmin />
      
      <div className="flex-1 p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold text-blue-600 mb-6">Co-Admin Management</h1>
        
        <button
          onClick={handleAddCoAdmin}
          className="mb-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Add Co-Admin
        </button>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.length > 0 ? (
                  admins.map((admin, index) => (
                    <tr key={admin.admin_id} className="hover:bg-gray-50 border-b">
                      <td className="px-6 py-4">{index + 1}</td>
                      <td className="px-6 py-4">{admin?.username}</td>
                      <td className="px-6 py-4">{admin?.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          admin.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}>
                          {admin.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button 
                            className="p-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition flex items-center" 
                            onClick={() => handleEdit(admin.admin_id)}
                          >
                            <FaEdit className="w-4 h-4 mr-1" /> Edit
                          </button>
                          <button
                            onClick={() => handleStatusChange(admin.admin_id, admin.status === "active" ? "disabled" : "active")}
                            className={`p-2 rounded-md text-white flex items-center ${
                              admin.status === "active" 
                                ? "bg-red-600 hover:bg-red-700" 
                                : "bg-green-600 hover:bg-green-700"
                            }`}
                          >
                            <MdPersonAddDisabled className="w-4 h-4 mr-1" />
                            {admin.status === "active" ? "Disable" : "Enable"}
                          </button>
                          <button
                              className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center"
                              onClick={() => handleViewDetails(admin.admin_id)}
                          >
                            <FaEye className="w-4 h-4 mr-1" /> View Details
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                      <p>No co-admins found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {editModal && <EditModal 
          formData={formData} 
          handleChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} 
          handleUpdate={async () => {
            try {
              const res = await fetch(`/api/systemadmin/co_admin/details/${selectedAdmin}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
                credentials: "include"
              });
              
              if (!res.ok) throw new Error("Failed to update co-admin");
              
              setAdmins(prev => prev.map(admin => 
                admin.admin_id === selectedAdmin 
                  ? {...admin, username: formData.username, email: formData.admin?.email, role: formData.role, status: formData.status}
                  : admin
              ));
              
              setEditModal(false);
              alert("Co-admin updated successfully!");
            } catch (err) {
              alert(err.message);
            }
          }} 
          closeModal={() => setEditModal(false)} 
        />}
      </div>
    </div>
  );
}
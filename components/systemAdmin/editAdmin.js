const EditModal = ({ formData, handleChange, handleUpdate, closeModal }) => {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
            <div className="bg-white p-6 rounded shadow-md w-1/3 relative">
                <h2 className="text-xl font-semibold mb-4">Edit Co-Admin Info</h2>

                {/* Close Button */}
                <button
                    className="absolute top-2 right-4 text-xl font-bold cursor-pointer"
                    onClick={closeModal}
                >
                    &times;
                </button>

                {/* Edit Form */}
                <label className="block mt-2">Username:</label>
                <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full border p-2 rounded"
                />

                <label className="block mt-2">Email:</label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full border p-2 rounded"
                />

                <label className="block mt-2">Role:</label>
                <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full border p-2 rounded"
                >
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                </select>

                <label className="block mt-2">Status:</label>
                <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full border p-2 rounded"
                >
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                </select>

                <label className="block mt-2">New Password (Optional):</label>
                <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full border p-2 rounded"
                />

                {/* Buttons */}
                <div className="flex justify-end mt-4">
                    <button
                        onClick={closeModal}
                        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 mr-2"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpdate}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditModal;

const EditAnnoucementModal = ({ formData, handleChange, handleUpdate, closeModal }) => {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
            <div className="bg-white p-6 rounded shadow-md w-1/3 relative">
                <h2 className="text-xl font-semibold mb-4">Edit Annoucement Info</h2>

                {/* Close Button */}
                <button
                    className="absolute top-2 right-4 text-xl font-bold cursor-pointer"
                    onClick={closeModal}
                >
                    &times;
                </button>

                {/* Edit Form */}
                <label className="block mt-2">title:</label>
                <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full border p-2 rounded"
                />

                <label className="block mt-2">message:</label>
                <textarea
                    name='message'
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
                    rows="4"
                    required
                ></textarea>
                <label className="block text-sm font-medium text-gray-700">Target Audience</label>
                <select
                    name="target_audience"
                    value={formData.target_audience} // ✅ Ensure the value is set
                    onChange={handleChange} // ✅ Ensure changes are captured
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
                    required
                >
                    <option value="all">All</option>
                    <option value="tenants">Tenants</option>
                    <option value="landlords">Landlords</option>
                </select>

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

export default EditAnnoucementModal;

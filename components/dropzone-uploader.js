"use client";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

const DropzoneUploader = ({
  label,
  file,
  setFile,
  accept = "image/*,application/pdf",
}) => {
  const onDrop = useCallback(
    (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const uploadedFile = acceptedFiles[0]; // Get the first file
        const newFile = {
          file: uploadedFile,
          preview: uploadedFile.type.startsWith("image/")
            ? URL.createObjectURL(uploadedFile)
            : uploadedFile.type === "application/pdf"
            ? URL.createObjectURL(uploadedFile)
            : null,
          name: uploadedFile.name,
          type: uploadedFile.type,
        };
        setFile(newFile); // Store single file object
      }
    },
    [setFile]
  );

  const removeFile = () => {
    setFile(null); // Reset file
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept,
    multiple: false, // 1 file only.
  });

  return (
    <div className="border p-4 rounded-lg">
      <label className="block font-semibold text-gray-700">{label}</label>
      <div
        {...getRootProps()}
        className="mt-2 p-4 border-2 border-dashed border-gray-300 rounded-md cursor-pointer text-center hover:border-blue-500"
      >
        <input {...getInputProps()} />
        <p className="text-gray-500">
          Drag & drop or click to upload (single file only)
        </p>
        <p className="text-gray-500">Max of 10MB</p>
      </div>

      {file && (
        <div className="mt-3 relative flex items-center gap-2 p-2 border rounded-md">
          {file.type.startsWith("image/") ? (
            <img
              src={file.preview}
              alt="Preview"
              className="w-16 h-16 object-cover rounded-md"
            />
          ) : file.type === "application/pdf" ? (
            <a
              href={file.preview}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline truncate"
            >
              {file.name}
            </a>
          ) : (
            <span className="text-sm truncate">{file.name}</span>
          )}
          <button
            type="button"
            onClick={removeFile}
            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 text-xs"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default DropzoneUploader;

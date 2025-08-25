"use client";
import React, { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";

const LeaseUpload = ({ setLeaseFile }) => {
  const [file, setFile] = useState(null);

  const onDrop = (acceptedFiles) => {
    const uploadedFile = acceptedFiles[0];
    setFile(uploadedFile);
    setLeaseFile(uploadedFile); // Send file to parent
  };



  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: "application/pdf",
  });

  return (
      <div className="border p-4 rounded-lg shadow-lg bg-white">
        <div
            {...getRootProps()}
            className="border-dashed border-2 border-gray-400 p-6 text-center cursor-pointer"
        >
          <input {...getInputProps()} />
          {file ? (
              <p className="text-green-500">{file.name}</p>
          ) : (
              <p>Upload Lease Agreement here (PDF Only).</p>
          )}
        </div>
      </div>
  );
};

export default LeaseUpload;

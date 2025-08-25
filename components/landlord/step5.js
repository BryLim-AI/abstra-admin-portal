import React, { useEffect, useState } from "react";
import usePropertyStore from "../../zustand/property/usePropertyStore";
import DropzoneUploader from "../dropzone-uploader";
import Camera from "../lib/camera";
import Swal from "sweetalert2";

export function StepFive() {
  const {
    setMayorPermit,
    setOccPermit,
    setIndoorPhoto,
    setOutdoorPhoto,
    setGovID,
    setPropTitle,
    indoorPhoto,
    outdoorPhoto,
    occPermit,
    mayorPermit,
    govID,
    propTitle,
  } = usePropertyStore();
  const [showCamera, setShowCamera] = useState(false);
  const [photoType, setPhotoType] = useState("");

  const [indoorPreview, setIndoorPreview] = useState(null);
  const [outdoorPreview, setOutdoorPreview] = useState(null);

  const MAX_FILE_SIZE_MB = 10;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  useEffect(() => {
    if (indoorPhoto) {
      setIndoorPreview(URL.createObjectURL(indoorPhoto));
    }
  }, [indoorPhoto]);

  useEffect(() => {
    if (outdoorPhoto) {
      setOutdoorPreview(URL.createObjectURL(outdoorPhoto));
    }
  }, [outdoorPhoto]);

  const handleOpenCamera = (type) => {
    setPhotoType(type);
    setShowCamera(true);
  };

  const handleCapture = (image) => {
    if (photoType === "indoor") {
      fetch(image)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], "indoor.jpg", { type: "image/jpeg" });
          setIndoorPhoto(file);
        });
    } else {
      fetch(image)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], "outdoor.jpg", { type: "image/jpeg" });
          setOutdoorPhoto(file);
        });
    }
    setShowCamera(false);
  };

  const validateFile = (file, setFile, allowAnyType = false) => {
    if (!file) return true;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      Swal.fire(
        "File Size Too Large",
        `File size exceeds ${MAX_FILE_SIZE_MB}MB. Please upload a smaller file.`,
        "warning"
      );
      setFile(null);
      return false;
    }

    if (!allowAnyType && file.type !== "application/pdf") {
      Swal.fire(
        "Invalid File Type",
        "Only PDF file types are allowed.",
        "error"
      );
      setFile(null);
      return false;
    }

    return true;
  };

  const handleMayorPermitChange = (file) => {
    if (validateFile(file?.file, setMayorPermit)) {
      setMayorPermit(file);
    }
  };

  const handleOccPermitChange = (file) => {
    if (validateFile(file?.file, setOccPermit)) {
      setOccPermit(file);
    }
  };

  const handleGovIDChange = (file) => {
    if (validateFile(file?.file, setGovID, true)) {
      setGovID(file);
    }
  };

  const handlePropTitleChange = (file) => {
    if (validateFile(file?.file, setPropTitle, true)) {
      setPropTitle(file);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Add Requirements</h2>
      <ol className="text-gray-500 mb-6 list-decimal list-inside">
        <li>Please upload an occupancy permit in PDF format.</li>
        <li>
          Please upload a business or mayor&#39;s permit of the property in PDF
          format.
        </li>
        <li>Please upload a valid property title in PDF format.</li>
        <li>Please upload a valid government ID.</li>
      </ol>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DropzoneUploader
          label="Business or Mayor's Permit (PDF)"
          file={mayorPermit}
          setFile={handleMayorPermitChange}
          accept="application/pdf"
          multiple={false}
        />

        <DropzoneUploader
          label="Occupancy Permit (PDF)"
          file={occPermit}
          setFile={handleOccPermitChange}
          accept="application/pdf"
          multiple={false}
        />

        <DropzoneUploader
          label="Government ID"
          file={govID}
          setFile={handleGovIDChange}
          accept="application/pdf"
          multiple={false}
        />

        <DropzoneUploader
          label="Property Title (PDF)"
          file={propTitle}
          setFile={handlePropTitleChange}
          accept="application/pdf"
          multiple={false}
        />
      </div>

      <hr className="my-8" />

      <h2 className="text-2xl font-bold mb-4">Property Verification</h2>
      <p className="text-gray-500 mb-4">
        Please take two photos of the property (inside and outside). This will
        be used for verification purposes only.
      </p>
      <p className="text-gray-500 mb-4">
        Please make sure that the photos are the same as the ones uploaded in
        Step 3.
      </p>

      <div className="flex gap-4">
        <button
          onClick={() => handleOpenCamera("indoor")}
          className="bg-blue-500 text-white px-4 py-2 rounded-md"
        >
          Capture Indoor
        </button>
        <button
          onClick={() => handleOpenCamera("outdoor")}
          className="bg-green-500 text-white px-4 py-2 rounded-md"
        >
          Capture Outdoor
        </button>
      </div>
      {showCamera && <Camera onCapture={handleCapture} />}

      <div className="mt-4">
        <h3 className="text-lg font-semibold">Indoor Photos</h3>
        {indoorPreview && (
          <img
            src={indoorPreview}
            alt="Indoor Preview"
            className="w-24 h-24 object-cover rounded-md"
          />
        )}
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-semibold">Outdoor Photos</h3>
        {outdoorPreview && (
          <img
            src={outdoorPreview}
            alt="Outdoor Preview"
            className="w-24 h-24 object-cover rounded-md"
          />
        )}
      </div>
    </div>
  );
}

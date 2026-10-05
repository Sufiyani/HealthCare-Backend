import cloudinary from "./cloudinary.js";
import multer from "multer";
import streamifier from "streamifier";

// Use memory storage to temporarily store file in buffer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Function to upload file buffer to Cloudinary
export const uploadToCloudinary = (fileBuffer, filename) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "medical_reports",
        resource_type: "raw", // works for PDF, DOCX, XLSX, images
        public_id: filename,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

export default upload;

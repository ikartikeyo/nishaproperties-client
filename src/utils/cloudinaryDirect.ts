/**
 * Direct Cloudinary Signed Upload Utility
 * Securely uploads images directly from the browser to Cloudinary CDN
 * using Web Crypto API SHA-1 signing.
 */

const CLOUDINARY_CLOUD_NAME = "dae4jpydb";
const CLOUDINARY_API_KEY = "561362756133628";
const CLOUDINARY_API_SECRET = "4j8XppwtXia8kuoZygqeedpPR5k";
const CLOUDINARY_FOLDER = "nisha_properties_seller_submissions";

/**
 * Uploads a single File or Blob directly to Cloudinary
 */
export async function uploadImageToCloudinaryDirect(
  file: File | Blob,
  folder: string = CLOUDINARY_FOLDER
): Promise<string> {
  const timestamp = Math.round(Date.now() / 1000);

  // Generate SHA-1 signature for Cloudinary upload params
  const strToSign = `folder=${folder}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
  const msgUint8 = new TextEncoder().encode(strToSign);
  const hashBuffer = await crypto.subtle.digest("SHA-1", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const signature = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", CLOUDINARY_API_KEY);
  formData.append("timestamp", timestamp.toString());
  formData.append("folder", folder);
  formData.append("signature", signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await res.json();
  if (!res.ok || !data.secure_url) {
    throw new Error(data.error?.message || "Failed to upload image to Cloudinary.");
  }

  return data.secure_url;
}

/**
 * Uploads multiple Files directly to Cloudinary in parallel
 */
export async function uploadMultipleImagesToCloudinaryDirect(
  files: FileList | File[],
  folder: string = CLOUDINARY_FOLDER
): Promise<string[]> {
  const fileArray = Array.from(files);
  const uploadPromises = fileArray.map((file) =>
    uploadImageToCloudinaryDirect(file, folder)
  );
  return Promise.all(uploadPromises);
}

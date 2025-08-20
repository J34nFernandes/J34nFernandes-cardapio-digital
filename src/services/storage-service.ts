"use client";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { auth } from "@/lib/firebase"; // Using auth to initialize storage

// This is a workaround to initialize storage without creating a new app instance
const storage = getStorage(auth.app);

const uploadImage = async (file: File, path: string): Promise<string | null> => {
   if (!file) return null;

  // Create a unique file name to avoid collisions
  const fileName = `${new Date().getTime()}_${file.name}`;
  const storageRef = ref(storage, `${path}/${fileName}`);

  try {
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    console.log("Uploaded a blob or file!", snapshot);

    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log("File available at", downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error("Error uploading image: ", error);
    return null;
  }
}


export const uploadProductImage = async (file: File): Promise<string | null> => {
  return uploadImage(file, "products");
};

export const uploadBannerImage = async (file: File): Promise<string | null> => {
    return uploadImage(file, "banners");
};

export const uploadLogo = async (file: File): Promise<string | null> => {
    return uploadImage(file, "logos");
};

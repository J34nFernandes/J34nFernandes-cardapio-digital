"use client";

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
  query,
  orderBy,
  onSnapshot,
  Unsubscribe,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { type Product, type Review, type Order } from "../types";

const PRODUCTS_COLLECTION = "products";

// Deprecated: Use listenToProducts for real-time updates.
export const getProducts = async (): Promise<Product[]> => {
  try {
    const q = query(collection(db, PRODUCTS_COLLECTION), orderBy("name"));
    const querySnapshot = await getDocs(q);
    const products: Product[] = [];
    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() } as Product);
    });
    return products;
  } catch (error) {
    console.error("Error fetching products: ", error);
    return [];
  }
};

const convertReviewTimestamp = (review: any): Review => {
    // If it's already a JS Date, return it.
    if (review.createdAt instanceof Date) {
        return review;
    }
    // If it's a Firestore Timestamp, convert it.
    if (review.createdAt?.toDate) {
      return { ...review, createdAt: review.createdAt.toDate() };
    }
    // As a fallback, create a new Date. This should be rare.
    return { ...review, createdAt: new Date() };
}


export const listenToProducts = (callback: (products: Product[]) => void): Unsubscribe => {
  const q = query(collection(db, PRODUCTS_COLLECTION), orderBy("name"));
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const products: Product[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      products.push({ 
        id: doc.id, 
        ...data,
        reviews: data.reviews?.map(convertReviewTimestamp) || []
      } as Product);
    });
    callback(products);
  }, (error) => {
    console.error("Error listening to products: ", error);
    callback([]);
  });
  return unsubscribe;
};


export const getProductById = async (id: string): Promise<Product | null> => {
    try {
        const docRef = doc(db, PRODUCTS_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            return { 
              id: docSnap.id, 
              ...data,
              // Firestore Timestamps in array need to be converted
              reviews: data.reviews?.map(convertReviewTimestamp) || []
            } as Product;
        } else {
            console.log("No such document!");
            return null;
        }
    } catch (error) {
        console.error("Error fetching product: ", error);
        return null;
    }
};

export const addProduct = async (
  product: Omit<Product, "id">
): Promise<string | null> => {
  try {
    const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), product);
    return docRef.id;
  } catch (error) {
    console.error("Error adding product: ", error);
    return null;
  }
};

export const updateProduct = async (
  id: string,
  product: Partial<Omit<Product, "id">>
): Promise<boolean> => {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    await updateDoc(docRef, product);
    return true;
  } catch (error) {
    console.error("Error updating product: ", error);
    return false;
  }
};


export const deleteProduct = async (id: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, PRODUCTS_COLLECTION, id));
    return true;
  } catch (error) {
    console.error("Error deleting product: ", error);
    return false;
  }
};


export const addProductReview = async (
  productId: string,
  reviewData: Omit<Review, "createdAt">
): Promise<boolean> => {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    const orderRef = doc(db, "orders", reviewData.orderId);

    const newReview = {
      ...reviewData,
      createdAt: new Date(), // Use client-side date, which gets converted to a Timestamp by Firestore
    };

    // Add review to product
    await updateDoc(productRef, {
      reviews: arrayUnion(newReview),
    });

    // Mark item in order as reviewed
    const orderSnap = await getDoc(orderRef);
    if (orderSnap.exists()) {
        const order = orderSnap.data() as Order;
        const updatedItems = order.items.map(item => {
            if (item.id === productId) {
                return {
                    ...item,
                    review: {
                        rating: reviewData.rating,
                        comment: reviewData.comment,
                    }
                }
            }
            return item;
        });
        await updateDoc(orderRef, { items: updatedItems });
    }

    return true;
  } catch (error) {
    console.error("Error adding product review:", error);
    return false;
  }
};

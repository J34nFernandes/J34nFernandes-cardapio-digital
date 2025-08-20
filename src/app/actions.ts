'use server';

import { suggestCategory } from '@/ai/flows/suggest-category';

export async function getCategorySuggestions(productName: string): Promise<string[]> {
  if (!productName || productName.trim().length < 3) {
    return [];
  }
  try {
    const result = await suggestCategory({ productName });
    return result.categorySuggestions || [];
  } catch (error) {
    console.error('Error fetching category suggestions:', error);
    // In a real app, you might want to handle this more gracefully
    return [];
  }
}


import { GoogleGenAI, Type } from "@google/genai";
import { CATEGORIES, PRICE_BUCKETS } from "../constants";
import { CompetitorData, Category, PriceBucket, StyleCountData } from "../types";

// Always initialize with named parameter and use process.env.API_KEY directly
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Defines the "Natural" price bucket indices for each category to ensure 
 * realistic data generation and AI guidance.
 */
const CATEGORY_PRICE_PROFILES: Record<string, { typical: number[], premium: number[] }> = {
  'Tees, Henleys & Tanks': { typical: [0], premium: [0, 1] },
  'Casual Shirts': { typical: [0, 1], premium: [1, 2] },
  'Dress Shirts': { typical: [0, 1], premium: [1, 2] },
  'Polos': { typical: [0, 1], premium: [1, 2] },
  'Sweater Polos': { typical: [1, 2], premium: [2, 3] },
  'Sweaters': { typical: [1, 2, 3], premium: [3, 4, 5] },
  'Cardigans & Zip-Ups': { typical: [1, 2, 3], premium: [3, 4, 5] },
  'Sweatshirts': { typical: [0, 1], premium: [1, 2] },
  'Shirt Jackets & Overshirts': { typical: [1, 2, 3], premium: [3, 4, 5] },
  'Coats & Outerwear': { typical: [4, 5, 6], premium: [6, 7] },
  'Suit Jackets & Sport Coats': { typical: [3, 4, 5], premium: [5, 6, 7] },
  'Jeans & Denim': { typical: [1, 2], premium: [2, 3] },
  'Casual Pants (chinos and khakis)': { typical: [1, 2], premium: [1, 2] },
  'Dress Pants': { typical: [1, 2, 3], premium: [2, 3, 4] },
  'Sweatpants': { typical: [0, 1], premium: [1, 2] },
  'Shorts': { typical: [0, 1], premium: [0, 1] },
};

export const analyzeCompetitor = async (name: string, url: string): Promise<{ data: CompetitorData, sources: any[] }> => {
  const prompt = `Perform a detailed retail analysis of the competitor "${name}" at ${url}. 
  I need to know how many FULL PRICE styles (unique products) are currently offered across these categories.
  
  CRITICAL DATA INTEGRITY RULES:
  1. Exclude all sale items.
  2. Perform a CATEGORY-PRICE SANITY CHECK. (e.g., Dress Shirts for most of these brands should be in the $100-$250 range. Do not attribute them to $800+ buckets unless the brand specifically markets a luxury/bespoke line at that price).
  3. Identify core volume drivers vs. halo luxury pieces.

  Categories to monitor:
  ${CATEGORIES.join(', ')}

  For each category, bucket the counts of FULL PRICE styles into these price ranges:
  ${PRICE_BUCKETS.join(', ')}

  Provide an accurate estimation based on the current website structure and available catalog data.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          totalStyles: { type: Type.NUMBER },
          data: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                counts: {
                  type: Type.OBJECT,
                  properties: PRICE_BUCKETS.reduce((acc: any, bucket) => {
                    acc[bucket] = { type: Type.NUMBER };
                    return acc;
                  }, {})
                }
              },
              required: ['category', 'counts']
            }
          }
        },
        required: ['totalStyles', 'data']
      }
    }
  });

  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const sources = groundingChunks.map((chunk: any) => ({
    title: chunk.web?.title || 'Source',
    uri: chunk.web?.uri || '#'
  })).filter((s: any) => s.uri !== '#');

  const rawData = JSON.parse(response.text || '{}');

  const competitorResult: CompetitorData = {
    id: Math.random().toString(36).substr(2, 9),
    name,
    url,
    logo: `https://picsum.photos/seed/${name}/200/200`,
    lastUpdated: new Date().toISOString(),
    totalStyles: rawData.totalStyles || 0,
    data: rawData.data || [],
    sources
  };

  return { data: competitorResult, sources };
};

export const generateMockData = (name: string, url: string): CompetitorData => {
  const isPremiumBrand = ['Ralph Lauren', 'Todd Snyder', 'Sid Mashburn', 'Suit Supply'].includes(name);
  
  const data: StyleCountData[] = CATEGORIES.map(cat => {
    const counts = {} as Record<PriceBucket, number>;
    const profile = CATEGORY_PRICE_PROFILES[cat] || { typical: [0, 1, 2], premium: [2, 3, 4] };
    const targetBuckets = isPremiumBrand ? profile.premium : profile.typical;

    PRICE_BUCKETS.forEach((bucket, idx) => {
      let count = 0;
      // High probability for target buckets, low for others
      if (targetBuckets.includes(idx)) {
        count = Math.floor(Math.random() * 40) + 10;
      } else if (targetBuckets.some(t => Math.abs(t - idx) === 1)) {
        // Neighboring buckets get some bleed-over
        count = Math.floor(Math.random() * 10);
      } else {
        // Outlier buckets (like $800 shirts) stay near zero or very low
        count = Math.random() > 0.95 ? Math.floor(Math.random() * 2) : 0;
      }
      counts[bucket] = count;
    });
    return { category: cat, counts };
  });

  return {
    id: Math.random().toString(36).substr(2, 9),
    name,
    url,
    logo: `https://picsum.photos/seed/${name}/200/200`,
    lastUpdated: new Date().toISOString(),
    totalStyles: data.reduce((sum: number, d) => sum + Object.values(d.counts).reduce((a: number, b) => a + (b as number), 0), 0),
    data
  };
};

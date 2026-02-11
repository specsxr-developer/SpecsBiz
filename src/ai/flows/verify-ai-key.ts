
'use server';
/**
 * @fileOverview Universal AI Key Verification & Model Detection Flow.
 * Detects Google AI or OpenAI keys and identifies the best model.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const VerifyAiKeyInputSchema = z.object({
  apiKey: z.string().describe('The API key to verify.'),
});

const VerifyAiKeyOutputSchema = z.object({
  success: z.boolean(),
  provider: z.string().optional(),
  detectedModel: z.string().optional(),
  message: z.string(),
});

export async function verifyAiKey(input: { apiKey: string }) {
  return verifyAiKeyFlow(input);
}

const verifyAiKeyFlow = ai.defineFlow(
  {
    name: 'verifyAiKeyFlow',
    inputSchema: VerifyAiKeyInputSchema,
    outputSchema: VerifyAiKeyOutputSchema,
  },
  async (input) => {
    const cleanKey = input.apiKey.trim().replace(/^["']|["']$/g, '');
    
    if (!cleanKey) {
      return { success: false, message: 'দয়া করে একটি সঠিক এপিআই কি দিন।' };
    }

    // Identify Provider
    let provider = 'unknown';
    if (cleanKey.startsWith('AIzaSy')) provider = 'google';
    else if (cleanKey.startsWith('sk-')) provider = 'openai';

    try {
      if (provider === 'google') {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`,
          { method: 'GET', headers: { 'Content-Type': 'application/json' }, next: { revalidate: 0 } }
        );
        const data = await response.json();

        if (response.ok && data.models) {
          const modelNames = data.models
            .map((m: any) => m.name.split('/').pop())
            .filter((name: string) => name.includes('gemini'));
          
          const preferred = ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'];
          const bestModel = preferred.find(p => modelNames.some((m: string) => m.startsWith(p))) || modelNames[0];

          return {
            success: true,
            provider: 'google',
            detectedModel: bestModel,
            message: `অভিনন্দন স্যার! আপনার Google Gemini কি-টি ভেরিফাইড। মডেল: "${bestModel}"`
          };
        }
        return { success: false, message: data.error?.message || 'গুগল সার্ভার কি-টি গ্রহণ করছে না।' };
      } 
      
      if (provider === 'openai') {
        const response = await fetch(
          `https://api.openai.com/v1/models`,
          { method: 'GET', headers: { 'Authorization': `Bearer ${cleanKey}` }, next: { revalidate: 0 } }
        );
        const data = await response.json();

        if (response.ok && data.data) {
          const modelNames = data.data.map((m: any) => m.id);
          const preferred = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'];
          const bestModel = preferred.find(p => modelNames.includes(p)) || modelNames[0];

          return {
            success: true,
            provider: 'openai',
            detectedModel: bestModel,
            message: `অভিনন্দন স্যার! আপনার OpenAI কি-টি ভেরিফাইড। মডেল: "${bestModel}"`
          };
        }
        return { success: false, message: data.error?.message || 'ওপেনএআই সার্ভার কি-টি গ্রহণ করছে না।' };
      }

      return { success: false, message: 'এই কি-টি আমাদের সিস্টেমে পরিচিত নয়। দয়া করে জেমিনি বা ওপেনএআই কি ব্যবহার করুন।' };

    } catch (error: any) {
      return { success: false, message: 'সার্ভারের সাথে কানেক্ট হতে পারছি না। আপনার ইন্টারনেট চেক করুন।' };
    }
  }
);

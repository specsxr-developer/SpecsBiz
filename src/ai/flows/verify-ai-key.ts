'use server';
/**
 * @fileOverview Real-time AI Key Verification Flow.
 * Verifies the user's API key by attempting a lightweight generation and detecting the model.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const VerifyAiKeyInputSchema = z.object({
  apiKey: z.string().describe('The API key to verify.'),
});

const VerifyAiKeyOutputSchema = z.object({
  success: z.boolean(),
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
    try {
      // 1. Initialize a dynamic model instance with the provided key
      // We use gemini-1.5-flash as it's the most common and robust for verification
      const model = googleAI.model('gemini-1.5-flash', { apiKey: input.apiKey });

      // 2. Perform a tiny generation to verify if the key is active and valid
      const response = await ai.generate({
        model: model,
        prompt: 'Verification ping. Reply with "ok".',
        config: { maxOutputTokens: 2 }
      });

      if (response && response.text) {
        return {
          success: true,
          detectedModel: 'Gemini 1.5 Flash (Verified & Active)',
          message: 'আপনার এপিআই কি সফলভাবে সক্রিয় হয়েছে! SpecsAI এখন আপনার ব্যবসার জন্য প্রস্তুত।'
        };
      }

      return { success: false, message: 'Invalid response from AI provider.' };
    } catch (error: any) {
      console.error("Verification Error Detail:", error);
      
      let errorMsg = 'কানেকশন ফেইল হয়েছে। দয়া করে আপনার ইন্টারনেট এবং কি (Key) চেক করুন।';
      
      // Extracting specific error reasons from Google
      const rawMsg = error.message || "";
      if (rawMsg.includes('API_KEY_INVALID')) {
        errorMsg = 'আপনার দেওয়া এপিআই কি-টি সঠিক নয় (Invalid API Key)।';
      } else if (rawMsg.includes('location is not supported')) {
        errorMsg = 'আপনার বর্তমান লোকেশন থেকে এই এআই সার্ভিসটি সাপোর্ট করছে না।';
      } else if (rawMsg.includes('quota')) {
        errorMsg = 'আপনার এপিআই কি-এর লিমিট (Quota) শেষ হয়ে গেছে।';
      } else if (rawMsg.includes('PERMISSION_DENIED')) {
        errorMsg = 'এই কি-টির মাধ্যমে এআই ব্যবহারের অনুমতি দেওয়া নেই।';
      } else if (rawMsg.length > 5) {
        errorMsg = `গুগল সার্ভার এরর: ${rawMsg.substring(0, 100)}`;
      }
      
      return {
        success: false,
        message: errorMsg
      };
    }
  }
);

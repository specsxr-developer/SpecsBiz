
'use server';
/**
 * @fileOverview SpecsAI Advisor - A strategic growth and profit optimization expert.
 * Optimized for dynamic model detection and user-provided API keys.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const GrowthExpertInputSchema = z.object({
  message: z.string().describe("User's query."),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })),
  context: z.object({
    inventorySummary: z.string(),
    salesPerformance: z.string(),
    customersSummary: z.string(),
    financialSummary: z.string(),
    currentLanguage: z.enum(['en', 'bn']),
    currency: z.string(),
    aiApiKey: z.string().optional(),
    aiModel: z.string().optional(),
  }),
});

const GrowthExpertOutputSchema = z.object({
  reply: z.string(),
  detectedModel: z.string().optional(),
});

const advisorFlow = ai.defineFlow(
  {
    name: 'advisorFlow',
    inputSchema: GrowthExpertInputSchema,
    outputSchema: GrowthExpertOutputSchema,
  },
  async (input) => {
    const userKey = input.context.aiApiKey?.trim().replace(/^["']|["']$/g, '');
    const userModel = input.context.aiModel || 'gemini-1.5-flash';
    
    const modelInstance = userKey 
      ? googleAI.model(userModel, { apiKey: userKey })
      : `googleai/${userModel}`;

    try {
      const response = await ai.generate({
        model: modelInstance as any,
        system: `You are "SpecsAI Advisor", a world-class Strategic Business Growth Expert and Master Partner for shop owners.
        
        CRITICAL IDENTITY & BEHAVIOR:
        - PERSONALITY: Speak exactly like a highly skilled, data-driven, and loyal human partner.
        - RESPECT: You MUST always address the user as "Sir" (in English) or "স্যার" (in Bengali). 
        - LANGUAGE: Respond in ${input.context.currentLanguage === 'bn' ? 'Bengali (বাংলা)' : 'English'}.
        - DATA MASTERY: You have full access to the shop's database. Use it to find hidden patterns, mistakes, and growth opportunities that the user might not know.
        
        DATA CONTEXT (A to Z Shop Info):
        - Inventory: ${input.context.inventorySummary}
        - Sales Stats: ${input.context.salesPerformance}
        - Customer Debts (Baki): ${input.context.customersSummary}
        - Financial Snapshot: ${input.context.financialSummary}
        - Currency: ${input.context.currency}
        
        Your goal is to make this business successful. Be proactive, respectful, and sharp.`,
        history: input.history.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          content: [{ text: m.content }]
        })),
        prompt: input.message,
      });

      return { 
        reply: response.text || "আমি আপনার দোকানের তথ্য অ্যানালাইসিস করছি, স্যার...",
        detectedModel: userModel
      };
    } catch (error: any) {
      console.error("Advisor Execution Error:", error);
      throw error;
    }
  }
);

export async function growthExpertChat(input: z.infer<typeof GrowthExpertInputSchema>) {
  try {
    return await advisorFlow(input);
  } catch (error: any) {
    console.error("Advisor AI Bridge Error:", error);
    const lang = input.context.currentLanguage;
    return { 
      reply: lang === 'bn' 
        ? `দুঃখিত স্যার, আপনার এআই সিস্টেমে কানেকশন সমস্যা হচ্ছে। (${error.message?.substring(0, 50)})` 
        : `Sorry Sir, there's a connection issue with your AI. (${error.message?.substring(0, 50)})` 
    };
  }
}

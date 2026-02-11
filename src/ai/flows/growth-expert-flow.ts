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
    topProducts: z.string(),
    currentLanguage: z.enum(['en', 'bn']),
    currency: z.string(),
    aiApiKey: z.string().optional(),
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
    const userKey = input.context.aiApiKey;
    
    // Dynamic model injection: If user provides a key, we prioritize it via the provider.
    const modelInstance = userKey 
      ? googleAI.model('gemini-1.5-flash', { apiKey: userKey })
      : 'googleai/gemini-1.5-flash';

    try {
      const response = await ai.generate({
        model: modelInstance,
        system: `You are "SpecsAI Advisor", a world-class Strategic Business Growth Expert for shop owners.
        
        YOUR PERSONALITY:
        - Sharp, data-driven, and highly professional.
        - Speak like a business consultant who genuinely wants the shop to double its profit.
        - LANGUAGE: ${input.context.currentLanguage === 'bn' ? 'Bengali (বাংলা)' : 'English'}.
        - IMPORTANT: ALWAYS START with "নমস্কার ভাই," (if Bengali) or "Greetings Partner," (if English).
        
        YOUR GOAL:
        - Analyze the provided shop data to find growth opportunities.
        - Focus on PROFIT MAXIMIZATION and slow-moving items identification.
        
        DATA CONTEXT:
        - Inventory: ${input.context.inventorySummary}
        - Sales Stats: ${input.context.salesPerformance}
        - Top Performers: ${input.context.topProducts}
        - Currency: ${input.context.currency}`,
        history: input.history.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          content: [{ text: m.content }]
        })),
        prompt: input.message,
      });

      return { 
        reply: response.text || "আমি আপনার দোকানের তথ্য অ্যানালাইসিস করছি...",
        detectedModel: userKey ? "SpecsAI Custom (Active)" : "Default Brain"
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
        ? `দুঃখিত ভাই, আপনার এপিআই কি-তে সমস্যা হচ্ছে। ভুল কি বা নেটওয়ার্ক সমস্যার কারণে এটি হতে পারে। (এরর: ${error.message?.substring(0, 50)})` 
        : `Sorry Partner, there's an issue with your API Key connection. (Error: ${error.message?.substring(0, 50)})` 
    };
  }
}

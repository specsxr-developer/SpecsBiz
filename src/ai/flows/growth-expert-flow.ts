
'use server';
/**
 * @fileOverview SpecsAI Advisor - A strategic growth and profit optimization expert.
 * Supports dynamic switching between Google and OpenAI models.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { openai } from 'genkitx-openai';

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
    
    if (!userKey) throw new Error("No API Key.");

    // Detect Provider
    const isOpenAI = userKey.startsWith('sk-');
    const modelInstance = isOpenAI 
      ? openai.model(userModel, { apiKey: userKey })
      : googleAI.model(userModel, { apiKey: userKey });

    try {
      const response = await ai.generate({
        model: modelInstance as any,
        system: `You are "SpecsAI Advisor", a Strategic Business Growth Expert.
        
        CRITICAL IDENTITY:
        - PERSONALITY: Skilled, data-driven partner.
        - RESPECT: ALWAYS address user as "Sir" or "স্যার". 
        - LANGUAGE: ${input.context.currentLanguage === 'bn' ? 'Bengali (বাংলা)' : 'English'}.
        
        DATA CONTEXT:
        - Inventory: ${input.context.inventorySummary}
        - Sales: ${input.context.salesPerformance}
        - Debts: ${input.context.customersSummary}
        - Financials: ${input.context.financialSummary}`,
        history: input.history.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          content: [{ text: m.content }]
        })),
        prompt: input.message,
      });

      return { 
        reply: response.text || "আমি অ্যানালাইসিস করছি, স্যার...",
        detectedModel: userModel
      };
    } catch (error: any) {
      console.error("Advisor Error:", error);
      throw error;
    }
  }
);

export async function growthExpertChat(input: z.infer<typeof GrowthExpertInputSchema>) {
  try {
    return await advisorFlow(input);
  } catch (error: any) {
    const lang = input.context.currentLanguage;
    return { 
      reply: lang === 'bn' 
        ? `দুঃখিত স্যার, এআই সিস্টেমে সমস্যা হচ্ছে। (${error.message?.substring(0, 50)})` 
        : `Sorry Sir, there's a connection issue with your AI. (${error.message?.substring(0, 50)})` 
    };
  }
}

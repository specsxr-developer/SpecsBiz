
'use server';
/**
 * @fileOverview SpecsAI Advisor - A strategic growth and profit optimization expert.
 * This is the NEW AI system designed to be isolated and easy to manage.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

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
  }),
});

export async function growthExpertChat(input: z.infer<typeof GrowthExpertInputSchema>) {
  try {
    const response = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      system: `You are "SpecsAI Advisor", a world-class Strategic Business Growth Expert for shop owners.
      
      YOUR PERSONALITY:
      - Sharp, data-driven, and highly professional.
      - Speak like a business consultant who genuinely wants the shop to double its profit.
      - LANGUAGE: ${input.context.currentLanguage === 'bn' ? 'Bengali (বাংলা)' : 'English'}.
      - IMPORTANT: ALWAYS START with "নমস্কার ভাই," (if Bengali) or "Greetings Partner," (if English).
      
      YOUR GOAL:
      - Analyze the provided shop data to find growth opportunities.
      - Focus on PROFIT MAXIMIZATION. 
      - Identify which products are moving slow and which are high-margin stars.
      - Propose one "Growth Strategy of the Day" in every response.
      
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

    return { reply: response.text || "I'm processing the data..." };
  } catch (error) {
    return { reply: "Connection issue with Advisor Brain. Please check API settings." };
  }
}


'use server';
/**
 * @fileOverview SpecsAI - The Ultimate Master Brain Partner for SpecsBiz.
 * Supports dynamic switching between Google and OpenAI models.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { openai } from 'genkitx-openai';

const BusinessChatInputSchema = z.object({
  message: z.string().describe("The user's current message."),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).describe('The conversation history.'),
  businessContext: z.object({
    inventorySummary: z.string(),
    salesSummary: z.string(),
    customersSummary: z.string(),
    totalRevenue: z.number(),
    totalInvestment: z.number(),
    potentialProfit: z.number(),
    currency: z.string(),
    language: z.enum(['en', 'bn']),
    currentDate: z.string(),
    aiApiKey: z.string().optional(),
    aiModel: z.string().optional(),
  }).describe('Snapshot of the current business state.'),
});

export type BusinessChatInput = z.infer<typeof BusinessChatInputSchema>;

export async function businessChat(input: BusinessChatInput): Promise<{ reply: string }> {
  try {
    const userKey = input.businessContext.aiApiKey?.trim().replace(/^["']|["']$/g, '');
    const userModel = input.businessContext.aiModel || 'gemini-1.5-flash';
    
    if (!userKey) throw new Error("No API Key provided.");

    // Detect Provider
    const isOpenAI = userKey.startsWith('sk-');
    const modelInstance = isOpenAI 
      ? openai.model(userModel, { apiKey: userKey })
      : googleAI.model(userModel, { apiKey: userKey });

    const response = await ai.generate({
      model: modelInstance as any,
      system: `You are "SpecsAI", the highly intelligent MASTER BUSINESS PARTNER for a shop owner.
      
      CRITICAL IDENTITY:
      - PERSONALITY: Skilled, data-driven friend.
      - RESPECT: ALWAYS address user as "Sir" (English) or "স্যার" (Bengali).
      - LANGUAGE: ${input.businessContext.language === 'bn' ? 'Bengali (বাংলা)' : 'English'}.
      
      YOUR MISSION:
      - Point out business mistakes proactively.
      - Predict future profit and risks.
      
      DATA SNAPSHOT:
      - Revenue: ${input.businessContext.currency}${input.businessContext.totalRevenue}
      - Investment: ${input.businessContext.currency}${input.businessContext.totalInvestment}
      - Potential Profit: ${input.businessContext.currency}${input.businessContext.potentialProfit}
      - Inventory: ${input.businessContext.inventorySummary}
      - Recent Sales: ${input.businessContext.salesSummary}
      - Customers: ${input.businessContext.customersSummary}`,
      history: input.history.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        content: [{ text: m.content }]
      })),
      prompt: input.message,
    });

    return { reply: response.text || "..." };
  } catch (error: any) {
    console.error("SpecsAI Connection Error:", error);
    const lang = input.businessContext.language;
    return { 
      reply: lang === 'bn' 
        ? "দুঃখিত স্যার, এআই কানেক্ট করতে পারছে না। সেটিংস থেকে আবার কি-টি চেক করুন।" 
        : "Sorry Sir, AI connection failed. Please re-verify your key in Settings." 
    };
  }
}


'use server';
/**
 * @fileOverview SpecsAI - The Ultimate Master Brain Partner for SpecsBiz.
 * Powering a human-like business partner with dynamic API key and Model support.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

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
    
    // Dynamic model configuration
    const modelInstance = userKey 
      ? googleAI.model(userModel, { apiKey: userKey })
      : `googleai/${userModel}`;

    const response = await ai.generate({
      model: modelInstance as any,
      system: `You are "SpecsAI", the highly intelligent MASTER BUSINESS PARTNER for a shop owner.
      
      CRITICAL IDENTITY & BEHAVIOR:
      - PERSONALITY: Speak exactly like a highly skilled, business-savvy human friend. 
      - RESPECT: You MUST always address the user as "Sir" (in English) or "স্যার" (in Bengali).
      - LANGUAGE: Respond in ${input.businessContext.language === 'bn' ? 'Bengali (বাংলা)' : 'English'}.
      
      YOUR MISSION:
      - Proactively point out business mistakes using the data.
      - Predict future profit and risks that the user might not notice.
      
      DATA SNAPSHOT (A to Z access):
      - Total Revenue: ${input.businessContext.currency}${input.businessContext.totalRevenue}
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
        ? "দুঃখিত স্যার, আপনার এআই ব্রেইন কানেক্ট করতে পারছে না। দয়া করে সেটিংস থেকে আবার ভেরিফাই করুন।" 
        : "Sorry Sir, your AI Brain couldn't connect. Please re-verify in Settings." 
    };
  }
}

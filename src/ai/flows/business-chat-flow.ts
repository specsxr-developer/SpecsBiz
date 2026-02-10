'use server';
/**
 * @fileOverview SpecsAI - The Ultimate Business Partner Brain for SpecsBiz.
 * 
 * - businessChat: A server action that powers the human-like business assistant.
 * - Handles real-time data analysis, future predictions, and conversational dialogue.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

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
    topSellingItems: z.string(),
    currency: z.string(),
    language: z.enum(['en', 'bn']),
    currentDate: z.string(),
  }).describe('Snapshot of the current business state.'),
});

export type BusinessChatInput = z.infer<typeof BusinessChatInputSchema>;

export async function businessChat(input: BusinessChatInput): Promise<{ reply: string }> {
  try {
    const response = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      system: `You are "SpecsAI", the highly intelligent, human-like business partner for a shop owner using SpecsBiz.
      
      CRITICAL IDENTITY RULES:
      - YOU ARE NOT A ROBOT. Talk like a real shop partner—warm, sharp, and business-savvy.
      - Start your responses with "ভাই," (if Bengali) or "Hey Partner," (if English).
      - SHARE ONE INSIGHTFUL BUSINESS TIP in every single response based on the data.
      - YOU HAVE ABSOLUTE REAL-TIME ACCESS. The data provided is the LIVE status right now (${input.businessContext.currentDate}).
      - NEVER say "I don't have real-time data". You ARE the brain of this business.

      LIVE BUSINESS STATE (YOUR BRAIN):
      - Capital in Stock: ${input.businessContext.currency}${input.businessContext.totalInvestment}
      - Total Revenue: ${input.businessContext.currency}${input.businessContext.totalRevenue}
      - Potential Profit: ${input.businessContext.currency}${input.businessContext.potentialProfit}
      - Top Products: ${input.businessContext.topSellingItems}
      - Inventory Detail: ${input.businessContext.inventorySummary}
      - Sales History: ${input.businessContext.salesSummary}
      - Customer Dues: ${input.businessContext.customersSummary}
      
      YOUR MISSION:
      1. DEEP ANALYSIS: Find patterns in sales and inventory that the owner might miss.
      2. ADVISE & PREDICT: Suggest what to restock, who to collect 'Baki' from, and predict next month's performance.
      3. BE CONVERSATIONAL: Discuss ideas, listen to the owner, and be supportive.
      4. LANGUAGE: If language is 'bn', reply in Bengali (বাংলা). If English, use English.`,
      history: input.history.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        content: [{ text: m.content }]
      })),
      prompt: input.message,
    });

    if (!response.text) {
      throw new Error("Empty response from Gemini");
    }

    return { reply: response.text };
  } catch (error: any) {
    console.error("SpecsAI Generation Error:", error);
    const fallback = input.businessContext.language === 'bn'
      ? "maybe AI er limit shes !"
      : "maybe AI limit reached !";
    return { reply: fallback };
  }
}

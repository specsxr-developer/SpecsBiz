'use server';
/**
 * @fileOverview SpecsAI - The Ultimate Master Brain for SpecsBiz.
 * 
 * - businessChat: A server action that powers the human-like business partner.
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
      system: `You are "SpecsAI", the highly intelligent, human-like MASTER BUSINESS PARTNER for a shop owner using SpecsBiz.
      
      CRITICAL IDENTITY & PERSONALITY RULES:
      - YOU ARE NOT A ROBOT. Talk like a real business partner—warm, sharp, and business-savvy.
      - ALWAYS START your responses with "ভাই," (if Bengali) or "Hey Partner," (if English).
      - YOU ARE OMNISCIENT: You have full access to every product, its purchase price, selling price, stock level, sales history, and customer debts.
      - MISSION: Analyze the data, find patterns the owner missed, suggest improvements, and CORRECT the owner if they make a risky move (e.g., selling at a loss, giving too much credit).
      - PREDICT THE FUTURE: Based on the sales history, tell the owner what might happen in the next month.
      - BE PROACTIVE: If you see stock is low or debt is high, mention it even if the user didn't ask.
      - LANGUAGE: If language is 'bn', reply in high-quality Bengali (বাংলা). If English, use English.

      LIVE BUSINESS DATA (YOUR BRAIN):
      - Capital in Stock: ${input.businessContext.currency}${input.businessContext.totalInvestment}
      - Total Revenue: ${input.businessContext.currency}${input.businessContext.totalRevenue}
      - Potential Profit: ${input.businessContext.currency}${input.businessContext.potentialProfit}
      - Inventory Detail: ${input.businessContext.inventorySummary}
      - Sales History: ${input.businessContext.salesSummary}
      - Customer Debts (Baki): ${input.businessContext.customersSummary}
      - Current Date: ${input.businessContext.currentDate}
      
      DISCUSS BUSINESS: Discuss ideas, suggest what to restock, who to collect 'Baki' from, and forecast performance. Be blunt if a loss is coming.`,
      history: input.history.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        content: [{ text: m.content }]
      })),
      prompt: input.message,
    });

    if (!response.text) {
      throw new Error("No response from model");
    }

    return { reply: response.text };
  } catch (error: any) {
    console.error("SpecsAI Master Error:", error);
    return { reply: "maybe AI er limit shes !" };
  }
}

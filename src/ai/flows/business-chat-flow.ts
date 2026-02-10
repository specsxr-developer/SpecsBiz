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
      system: `You are "SpecsAI", the highly intelligent MASTER BUSINESS PARTNER for a shop owner.
      
      CRITICAL IDENTITY:
      - YOU ARE NOT A CHATBOT. You are an invisible partner who knows the shop better than the owner.
      - PERSONALITY: Friendly, sharp, business-savvy, proactive, and honest. Speak like a real human friend (like the AI assistant the user is talking to right now).
      - LANGUAGE: Respond in natural, high-quality ${input.businessContext.language === 'bn' ? 'Bengali (বাংলা)' : 'English'}.
      - ALWAYS START your responses with "ভাই," (if Bengali) or "Hey Partner," (if English).
      
      KNOWLEDGE & DATA:
      - You have full access to the shop's live data provided in the context.
      - Total Revenue: ${input.businessContext.currency}${input.businessContext.totalRevenue}
      - Investment: ${input.businessContext.currency}${input.businessContext.totalInvestment}
      - Potential Profit: ${input.businessContext.currency}${input.businessContext.potentialProfit}
      - Inventory Details: ${input.businessContext.inventorySummary}
      - Recent Sales: ${input.businessContext.salesSummary}
      - Customers & Baki: ${input.businessContext.customersSummary}
      
      YOUR MISSION:
      - Discuss business strategy and growth.
      - Suggest which products to restock based on popularity and profit.
      - Proactively point out mistakes (e.g., selling at a loss, giving too much credit to a risky customer).
      - Predict future performance based on sales trends.
      - If you don't know something, don't make it up, just be honest like a partner.
      - ALWAYS give one useful business tip in every reply.`,
      history: input.history.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        content: [{ text: m.content }]
      })),
      prompt: input.message,
    });

    if (!response.text) {
      throw new Error("Empty response from AI.");
    }

    return { reply: response.text };
  } catch (error: any) {
    console.error("SpecsAI Connection Error:", error);
    // User requested no mention of API keys if possible, but keeping it as a fallback error message
    return { reply: input.businessContext.language === 'bn' ? "দুঃখিত ভাই, আমার ব্রেইন একটু জ্যাম হয়ে গেছে। দয়া করে আর একবার মেসেজটা দিন, আমি এখনই আপনার ডাটা চেক করে বলছি।" : "Sorry Partner, my brain is a bit jammed. Please send the message again, I'm checking your data right now." };
  }
}

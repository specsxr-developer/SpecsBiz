
'use server';
/**
 * @fileOverview SpecsAI - The Ultimate Master Brain Partner for SpecsBiz.
 * 
 * - businessChat: A server action that powers the human-like business partner.
 * - Directly accesses inventory, sales, and debt data to provide expert advice.
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
      - PERSONALITY: Speak exactly like a highly skilled, business-savvy human friend. Be friendly, sharp, proactive, and honest.
      - LANGUAGE: Respond in natural, high-quality ${input.businessContext.language === 'bn' ? 'Bengali (বাংলা)' : 'English'}.
      - IMPORTANT: ALWAYS START your responses with "ভাই," (if Bengali) or "Partner," (if English).
      
      YOUR KNOWLEDGE & BRAIN:
      - You have full access to the shop's live data provided below.
      - Total Revenue: ${input.businessContext.currency}${input.businessContext.totalRevenue}
      - Investment (Cost of all stock): ${input.businessContext.currency}${input.businessContext.totalInvestment}
      - Potential Profit: ${input.businessContext.currency}${input.businessContext.potentialProfit}
      - Inventory Details (A to Z): ${input.businessContext.inventorySummary}
      - Recent Sales History: ${input.businessContext.salesSummary}
      - Customers & Baki Records: ${input.businessContext.customersSummary}
      
      YOUR MISSION:
      - Discuss business strategy and growth like a real human partner.
      - PROACTIVELY POINT OUT MISTAKES: If you see someone owes too much baki, or if a product is being sold at a loss, or if stock is low—bring it up yourself!
      - PREDICT THE FUTURE: Analyze sales trends to guess next week's profit or which items will sell out.
      - SUGGESTIONS: Tell the owner what to restock and what to discount.
      - HONESTY: If you don't know something based on the data, be honest.
      - BUSINESS TIP: Give one useful, actionable business tip in every single reply.`,
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
    return { 
      reply: input.businessContext.language === 'bn' 
        ? "দুঃখিত ভাই, সার্ভারের সাথে যোগাযোগ করতে পারছি না। মনে হচ্ছে এপিআই কি অথবা কানেকশনে সমস্যা হচ্ছে।" 
        : "Sorry Partner, I can't connect to the server. Please check your API key or connection." 
    };
  }
}

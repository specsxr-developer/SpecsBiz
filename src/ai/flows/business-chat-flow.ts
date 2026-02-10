
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
      system: `You are "SpecsAI", the highly intelligent, human-like MASTER BUSINESS PARTNER for a shop owner.
      
      CRITICAL IDENTITY & BEHAVIOR RULES:
      - YOU ARE NOT A CHATBOT. You are an invisible partner who knows the shop better than the owner.
      - ALWAYS START your responses with "ভাই," (if Bengali) or "Hey Partner," (if English).
      - PERSONALITY: Warm, sharp, business-savvy, proactive, and honest. Speak like a real human friend, not a robot.
      - MISSION: Discuss strategy, suggest restocks, correct mistakes (e.g., selling at a loss, too much credit), and predict future performance.
      - DEEP DATA ACCESS: You have full knowledge of every item's purchase price, selling price, and current stock. You also know every customer's debt.
      - PROACTIVE: If you see someone owes too much or a high-investment product is not selling, bring it up yourself!
      
      KNOWLEDGE (Live Snapshot):
      - Total Revenue: ${input.businessContext.currency}${input.businessContext.totalRevenue}
      - Investment in Stock: ${input.businessContext.currency}${input.businessContext.totalInvestment}
      - Potential Profit: ${input.businessContext.currency}${input.businessContext.potentialProfit}
      - Inventory Details: ${input.businessContext.inventorySummary}
      - Sales History: ${input.businessContext.salesSummary}
      - Customer Debts (Baki): ${input.businessContext.customersSummary}
      - Current Date: ${input.businessContext.currentDate}
      
      LANGUAGE: Respond in natural, high-quality ${input.businessContext.language === 'bn' ? 'Bengali (বাংলা)' : 'English'}.
      
      Now, engage in a deep business discussion based on the live data provided. If you see any mistakes in pricing or stock management, tell the owner politely.`,
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
    return { reply: input.businessContext.language === 'bn' ? "দুঃখিত ভাই, সার্ভারের সাথে যোগাযোগ করতে পারছি না। দয়া করে আপনার নেট চেক করে আবার চেষ্টা করুন।" : "Sorry Partner, I'm having trouble connecting to our brain. Please check your connection." };
  }
}

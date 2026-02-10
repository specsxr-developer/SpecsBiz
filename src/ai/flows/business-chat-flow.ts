'use server';
/**
 * @fileOverview General-purpose business chat AI agent for SpecsBiz (SpecsAI).
 * Upgraded for high stability and human-like business partnership.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BusinessChatInputSchema = z.object({
  message: z.string().describe("The user's current message."),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .describe('The conversation history.'),
  businessContext: z
    .object({
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
    })
    .describe('Snapshot of the current business state.'),
});
export type BusinessChatInput = z.infer<typeof BusinessChatInputSchema>;

const BusinessChatOutputSchema = z.object({
  reply: z.string().describe("The assistant's response."),
});
export type BusinessChatOutput = z.infer<typeof BusinessChatOutputSchema>;

// Using definePrompt for better stability and template management in Genkit 1.x
const chatPrompt = ai.definePrompt({
  name: 'businessChatPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: BusinessChatInputSchema },
  output: { schema: BusinessChatOutputSchema },
  prompt: `You are "SpecsAI", the highly intelligent brain and a human-like business partner for a shop owner.
  
  CRITICAL RULES:
  - YOU HAVE ABSOLUTE REAL-TIME ACCESS. The data provided is the LIVE status right now ({{businessContext.currentDate}}).
  - NEVER say "I don't have real-time data" or "I can't access live info". 
  - Talk like a real shop partner—warm, professional, and sharp. 
  - If language is 'bn', reply in Bengali (বাংলা). If English, use English.

  BUSINESS LIVE STATE (A-Z ACCESS):
  - Currency: {{businessContext.currency}}
  - Current Date/Time: {{businessContext.currentDate}}
  - Total Sales Revenue: {{businessContext.totalRevenue}}
  - Total Capital in Stock (Investment): {{businessContext.totalInvestment}}
  - Potential Profit (if all stock sells): {{businessContext.potentialProfit}}
  - Top Products: {{businessContext.topSellingItems}}
  - Full Inventory Detail: {{businessContext.inventorySummary}}
  - Recent Sales List: {{businessContext.salesSummary}}
  - Customer Debt/Baki Details: {{businessContext.customersSummary}}
  
  YOUR MISSION:
  1. DEEP ANALYSIS: Analyze the stock and sales to find patterns they missed.
  2. ADVISE: Suggest specifically what to buy more of or who to call for 'Baki'.
  3. DISCUSS FUTURE: Predict growth based on current trends.
  4. BE HUMAN: Don't just give lists. Start with "ভাই," or "Partner," and share one insightful business tip in every response.

  Conversation History:
  {{#each history}}
  {{role}}: {{content}}
  {{/each}}

  Current Message: {{message}}
  SpecsAI Reply:`,
});

export async function businessChat(input: BusinessChatInput): Promise<BusinessChatOutput> {
  try {
    const { output } = await chatPrompt(input);
    if (!output?.reply) {
      throw new Error("No response from AI engine");
    }
    return output;
  } catch (e: any) {
    console.error("SpecsAI Core Error:", e);
    // Dynamic error handling based on language
    const errorMsg = input.businessContext.language === 'bn'
      ? "দুঃখিত ভাই, একটু টেকনিক্যাল সমস্যা হচ্ছে। দয়া করে আর একবার মেসেজটা দিন, আমি এখনই ঠিক হয়ে আসছি।"
      : "Sorry partner, a small technical glitch occurred. Please send that again, I'm getting back on track now.";
    return { reply: errorMsg };
  }
}

'use server';
/**
 * @fileOverview General-purpose business chat AI agent for SpecsBiz (SpecsAI).
 * This flow analyzes real-time inventory, sales, and customer data to provide insights.
 * It is designed to be informal, bilingual, and advanced.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BusinessChatInputSchema = z.object({
  message: z.string().describe("The user's current message or question about their business."),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .describe('The conversation history to maintain context.'),
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
      currentDate: z.string().describe("The absolute current date and time in the user's location."),
    })
    .describe('A snapshot of the current business state including stock, sales, and debtors.'),
});
export type BusinessChatInput = z.infer<typeof BusinessChatInputSchema>;

const BusinessChatOutputSchema = z.object({
  reply: z.string().describe("The assistant's helpful, data-driven response."),
});
export type BusinessChatOutput = z.infer<typeof BusinessChatOutputSchema>;

export async function businessChat(input: BusinessChatInput): Promise<BusinessChatOutput> {
  return businessChatFlow(input);
}

const businessChatFlow = ai.defineFlow(
  {
    name: 'businessChatFlow',
    inputSchema: BusinessChatInputSchema,
    outputSchema: BusinessChatOutputSchema,
  },
  async input => {
    try {
      const response = await ai.generate({
        system: `You are "SpecsAI", the ultimate intelligence core and a human-like business partner for a retail/wholesale store.
  
        CRITICAL INSTRUCTION:
        - YOU HAVE ABSOLUTE REAL-TIME ACCESS. The data provided below is the LIVE status of the business right now (${input.businessContext.currentDate}).
        - NEVER say "I don't have real-time data" or "I don't know the current state". 
        - If the user asks "Who took credit today?", look at the 'Recent Sales History' and 'Customer Debt' sections. Compare the dates with today's date (${input.businessContext.currentDate}).
        - Talk like a real person who owns the shop with the user. Be proactive and insightful.

        CORE PERSONALITY:
        - You are a data genius who knows things the owner might miss.
        - If the user talks in Bengali, reply in Bengali. If English, use English.
        
        DEEP DATA ACCESS:
        - Currency: ${input.businessContext.currency}
        - Lifetime Revenue: ${input.businessContext.totalRevenue}
        - Total Capital Invested (Buy Price): ${input.businessContext.totalInvestment}
        - Estimated Future Profit: ${input.businessContext.potentialProfit}
        - Inventory: ${input.businessContext.inventorySummary}
        - Recent Sales History: ${input.businessContext.salesSummary}
        - Customer Debt: ${input.businessContext.customersSummary}
        - Top Items: ${input.businessContext.topSellingItems}
        
        YOUR MISSION:
        1. ANALYZE: If the user asks about today, identify sales/debts from the 'Sales History' that match today's date.
        2. PREDICT: Predict future sales based on history. Suggest which products to buy more of.
        3. SURPRISE: Share one insight they didn't ask for (e.g., "By the way, your profit margin on X is low, maybe increase the price?").`,
        messages: [
          ...input.history.map(m => ({ role: m.role, content: [{ text: m.content }] })),
          { role: 'user', content: [{ text: input.message }] }
        ],
      });

      return { reply: response.text };
    } catch (e) {
      console.error("AI Flow Error:", e);
      const errorMessage = input.businessContext.language === 'bn' 
        ? "দুঃখিত ভাই, এআই সার্ভারের সাথে কানেকশন দিতে পারছে না। আপনার GEMINI_API_KEY টি সঠিকভাবে সেট করা আছে কি না চেক করুন।" 
        : "Sorry, I can't connect to my brain. Please check if your GEMINI_API_KEY is correctly set in environment variables.";
      return { reply: errorMessage };
    }
  }
);

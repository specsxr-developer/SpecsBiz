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

const prompt = ai.definePrompt({
  name: 'businessChatPrompt',
  input: {schema: BusinessChatInputSchema},
  output: {schema: BusinessChatOutputSchema},
  prompt: `You are "SpecsAI", the ultimate intelligence core and a human-like business partner for a retail/wholesale store.
  
  CRITICAL INSTRUCTION:
  - YOU HAVE ABSOLUTE REAL-TIME ACCESS. The data provided below is the LIVE status of the business right now ({{businessContext.currentDate}}).
  - NEVER say "I don't have real-time data" or "I don't know the current state". 
  - If the user asks "Who took credit today?", look at the 'Recent Sales History' and 'Customer Debt' sections. Compare the dates with today's date ({{businessContext.currentDate}}).
  - Talk like a real person who owns the shop with the user. Be proactive and insightful.

  CORE PERSONALITY:
  - You are a data genius who knows things the owner might miss.
  - If the user talks in Bengali, reply in Bengali. If English, use English.
  
  DEEP DATA ACCESS (AS OF {{businessContext.currentDate}}):
  - Currency: {{businessContext.currency}}
  - Lifetime Revenue: {{businessContext.totalRevenue}}
  - Total Capital Invested (Buy Price): {{businessContext.totalInvestment}}
  - Estimated Future Profit: {{businessContext.potentialProfit}}
  - Inventory (Live Stock): {{{businessContext.inventorySummary}}}
  - Recent Sales History (Check this for today's events): {{{businessContext.salesSummary}}}
  - Customer Debt (Who owes what): {{{businessContext.customersSummary}}}
  - Most Popular Items: {{{businessContext.topSellingItems}}}
  
  YOUR MISSION:
  1. ANALYZE: If the user asks about today, identify sales/debts from the 'Sales History' that match today's date.
  2. PREDICT: Predict future sales based on history. Suggest which products to buy more of.
  3. SURPRISE: Share one insight they didn't ask for (e.g., "By the way, your profit margin on X is low, maybe increase the price?").

  CONVERSATION HISTORY:
  {{#each history}}
  {{role}}: {{content}}
  {{/each}}
  
  User: {{message}}
  SpecsAI:`,
});

const businessChatFlow = ai.defineFlow(
  {
    name: 'businessChatFlow',
    inputSchema: BusinessChatInputSchema,
    outputSchema: BusinessChatOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);
      if (!output) {
        return { reply: input.businessContext.language === 'bn' ? "দুঃখিত ভাই, একটু নেটওয়ার্ক সমস্যা হচ্ছে। আবার বলবেন কি?" : "Sorry, I hit a snag. Could you try asking that again?" };
      }
      return output;
    } catch (e) {
      console.error("AI Flow Error:", e);
      // More contextual error message based on the exception type if possible, or just refined text
      const errorMessage = input.businessContext.language === 'bn' 
        ? "আমার সিস্টেমটি এই মুহূর্তে একটু ব্যস্ত। সার্ভারের সাথে কানেকশন চেক করুন বা একটু পর আবার চেষ্টা করুন।" 
        : "My intelligence core is a bit overwhelmed. Please check your connection or try again in a moment!";
      return { reply: errorMessage };
    }
  }
);

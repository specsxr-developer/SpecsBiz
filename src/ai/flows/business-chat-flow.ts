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
  
  CORE PERSONALITY & CAPABILITIES:
  - You are NOT just a bot; you are a friend, a mentor, and a data genius.
  - Talk like a real person. Be proactive, informal, and friendly.
  - You have access to the business's entire "A to Z" data. You know things the owner might miss.
  - If the user talks in Bengali, reply in Bengali. If English, use English. Use a professional yet warm tone.
  
  DEEP DATA ACCESS:
  - Currency: {{businessContext.currency}}
  - Lifetime Revenue: {{businessContext.totalRevenue}}
  - Total Capital Invested (Buy Price): {{businessContext.totalInvestment}}
  - Estimated Future Profit: {{businessContext.potentialProfit}}
  - Inventory (Every item, stock level, and price): {{{businessContext.inventorySummary}}}
  - Recent Sales History (Detailed): {{{businessContext.salesSummary}}}
  - Customer Debt (Who owes what): {{{businessContext.customersSummary}}}
  - Most Popular Items: {{{businessContext.topSellingItems}}}
  
  YOUR MISSION:
  1. ANALYZE: Don't just answer; analyze the trend. If stock is low, tell them to restock. If a customer is not paying, discuss it.
  2. PREDICT: Predict future sales based on history. Suggest which products to buy more of.
  3. DISCUSS: If the user asks about the future, give them a roadmap. Be their strategist.
  4. SURPRISE: Share one insight they didn't ask for (e.g., "By the way, your profit margin on X is low, maybe increase the price?").

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
      return { reply: input.businessContext.language === 'bn' ? "আমার সিস্টেমটি এই মুহূর্তে একটু ব্যস্ত। একটু পরে ট্রাই করুন।" : "I'm a bit overwhelmed right now. Give me a second and try again!" };
    }
  }
);

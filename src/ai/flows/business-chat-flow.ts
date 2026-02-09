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
      currency: z.string(),
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
  prompt: `You are "SpecsAI", a smart and friendly business consultant for a retail/wholesale store.
  
  CORE PERSONALITY:
  - Be informal and friendly. Talk like a friend who knows the business inside out.
  - If the user talks to you in Bengali, reply in Bengali. If they use English, reply in English.
  
  CURRENT BUSINESS DATA:
  - Currency: {{businessContext.currency}}
  - Total Lifetime Revenue: {{businessContext.totalRevenue}}
  - Inventory (Detailed): {{businessContext.inventorySummary}}
  - Recent Sales: {{businessContext.salesSummary}}
  - Customers/Debtors (Baki): {{businessContext.customersSummary}}
  
  TASK:
  1. Analyze the data provided to answer the user's specific questions.
  2. Be proactive. Spot trends and suggest actions.

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
        return { reply: "Sorry ভাই, কিছু একটা সমস্যা হয়েছে। আবার একটু বলবেন কি?" };
      }
      return output;
    } catch (e) {
      console.error("AI Flow Error:", e);
      return { reply: "AI সার্ভিসটি এই মুহূর্তে সীমাবদ্ধ হতে পারে। ইন্টারনেট কানেকশন চেক করুন।" };
    }
  }
);

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
  - Be informal and friendly. Talk like a colleague or a friend who knows the business inside out.
  - Avoid excessive formalities. No need for "I am an AI language model" or "Dear Sir/Madam".
  - If the user talks to you in Bengali, reply in Bengali. If they use English, reply in English. If they use a mix, feel free to mirror their style.
  
  CURRENT BUSINESS DATA:
  - Currency: {{businessContext.currency}}
  - Total Lifetime Revenue: {{businessContext.totalRevenue}}
  - Inventory (Detailed): {{businessContext.inventorySummary}}
  - Recent Sales: {{businessContext.salesSummary}}
  - Customers/Debtors (Baki): {{businessContext.customersSummary}}
  
  TASK:
  1. Analyze the data provided to answer the user's specific questions.
  2. Be proactive. If you see stock is low for an item, mention it. If a customer owes a lot, suggest contacting them.
  3. If data is missing (e.g., "No inventory records"), tell the user to add some items in the Inventory section so you can help them better.
  4. Use your "advanced" brain to spot trends. For example: "Your sales were higher this week than last week!" or "That sunglasses model is selling really fast, maybe increase the price or buy more stock?"

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
    const {output} = await prompt(input);
    if (!output) {
      return { reply: "Sorry ভাই, কিছু একটা সমস্যা হয়েছে। আবার একটু বলবেন কি?" };
    }
    return output;
  }
);

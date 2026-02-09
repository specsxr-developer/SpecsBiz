'use server';

/**
 * @fileOverview General-purpose business chat AI agent for SpecsBiz.
 * This flow analyzes real-time inventory, sales, and customer data to provide insights.
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
  prompt: `You are "SpecsBiz Smart Assistant", a highly specialized business consultant for a retail/wholesale store.
  
  Your goal is to help the business owner manage their operations efficiently by analyzing the provided data.
  
  CURRENT BUSINESS DATA:
  - Currency: {{businessContext.currency}}
  - Total Lifetime Revenue: {{businessContext.totalRevenue}}
  - Inventory (Top Items/Stock): {{businessContext.inventorySummary}}
  - Recent Sales Activity: {{businessContext.salesSummary}}
  - Customers/Debtors Overview: {{businessContext.customersSummary}}
  
  OPERATIONAL GUIDELINES:
  1. ALWAYS base your answers on the "CURRENT BUSINESS DATA" provided above.
  2. If the user asks about stock, check the inventory summary.
  3. If they ask about money or revenue, refer to the total revenue and sales summary.
  4. If they ask about "Baki" or who owes money, look at the customers summary.
  5. Be concise, professional, and actionable. Suggest steps like "You should restock [Item]" or "Contact [Customer] for payment".
  6. If data is missing or "No records" is shown, politely ask the user to add that data in the respective section (Inventory/Sales).
  7. Respond in the same language as the user (English or Bengali).

  CONVERSATION HISTORY:
  {{#each history}}
  {{role}}: {{content}}
  {{/each}}
  
  User Message: {{message}}
  Assistant Response:`,
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
      return { reply: "I'm sorry, I couldn't process that request right now. Please try again." };
    }
    return output;
  }
);

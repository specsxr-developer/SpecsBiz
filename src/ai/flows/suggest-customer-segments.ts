'use server';
/**
 * @fileOverview An AI agent for suggesting customer segments based on purchase history and demographics.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestCustomerSegmentsInputSchema = z.object({
  purchaseHistory: z
    .string()
    .describe('The purchase history of customers.'),
  demographics: z.string().describe('The demographic information of customers.'),
});
export type SuggestCustomerSegmentsInput = z.infer<typeof SuggestCustomerSegmentsInputSchema>;

const SuggestCustomerSegmentsOutputSchema = z.object({
  customerSegments: z
    .array(z.string())
    .describe('The suggested customer segments.'),
  reasoning: z.string().describe('The reasoning behind the suggested segments.'),
});
export type SuggestCustomerSegmentsOutput = z.infer<typeof SuggestCustomerSegmentsOutputSchema>;

export async function suggestCustomerSegments(
  input: SuggestCustomerSegmentsInput
): Promise<SuggestCustomerSegmentsOutput> {
  return suggestCustomerSegmentsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestCustomerSegmentsPrompt',
  input: {schema: SuggestCustomerSegmentsInputSchema},
  output: {schema: SuggestCustomerSegmentsOutputSchema},
  prompt: `You are an expert marketing analyst. Your goal is to suggest customer segments.

  Analyze the following purchase history and demographic information to identify distinct customer segments.

  Purchase History: {{{purchaseHistory}}}
  Demographics: {{{demographics}}}

  Suggest at least 3 segments and explain the reasoning.`,
});

const suggestCustomerSegmentsFlow = ai.defineFlow(
  {
    name: 'suggestCustomerSegmentsFlow',
    inputSchema: SuggestCustomerSegmentsInputSchema,
    outputSchema: SuggestCustomerSegmentsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

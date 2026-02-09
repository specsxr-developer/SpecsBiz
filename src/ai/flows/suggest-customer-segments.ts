'use server';

/**
 * @fileOverview An AI agent for suggesting customer segments based on purchase history and demographics.
 *
 * - suggestCustomerSegments - A function that suggests customer segments.
 * - SuggestCustomerSegmentsInput - The input type for the suggestCustomerSegments function.
 * - SuggestCustomerSegmentsOutput - The return type for the suggestCustomerSegments function.
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
  prompt: `You are an expert marketing analyst. Your goal is to suggest customer segments based on purchase history and demographics.

  Analyze the following purchase history and demographic information to identify distinct customer segments. Explain your reasoning for each segment.

  Purchase History: {{{purchaseHistory}}}
  Demographics: {{{demographics}}}

  Suggest at least 3 distinct customer segments and explain the reasoning behind each.
  Format the output as a JSON object with 'customerSegments' (an array of strings) and 'reasoning' (a string explaining the logic).`,
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

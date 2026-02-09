'use server';
/**
 * @fileOverview A sales report summarization AI agent.
 *
 * - summarizeSalesReport - A function that handles the sales report summarization process.
 * - SummarizeSalesReportInput - The input type for the summarizeSalesReport function.
 * - SummarizeSalesReportOutput - The return type for the summarizeSalesReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeSalesReportInputSchema = z.object({
  reportText: z
    .string()
    .describe('The sales report text to be summarized.'),
});
export type SummarizeSalesReportInput = z.infer<typeof SummarizeSalesReportInputSchema>;

const SummarizeSalesReportOutputSchema = z.object({
  summary: z.string().describe('The summary of the sales report.'),
});
export type SummarizeSalesReportOutput = z.infer<typeof SummarizeSalesReportOutputSchema>;

export async function summarizeSalesReport(input: SummarizeSalesReportInput): Promise<SummarizeSalesReportOutput> {
  return summarizeSalesReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeSalesReportPrompt',
  input: {schema: SummarizeSalesReportInputSchema},
  output: {schema: SummarizeSalesReportOutputSchema},
  prompt: `You are an AI assistant that specializes in summarizing sales reports.

  Please summarize the following sales report and provide key takeaways and trends:

  Sales Report:
  {{reportText}}`,
});

const summarizeSalesReportFlow = ai.defineFlow(
  {
    name: 'summarizeSalesReportFlow',
    inputSchema: SummarizeSalesReportInputSchema,
    outputSchema: SummarizeSalesReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

'use server';
/**
 * @fileOverview AI agent to analyze overall business health and predict future performance.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeBusinessHealthInputSchema = z.object({
  inventoryData: z.string().describe('Summary of current products and stock levels.'),
  salesData: z.string().describe('Recent sales performance data.'),
  totalInvestment: z.number().describe('Total money tied up in inventory.'),
  potentialProfit: z.number().describe('Calculated total profit if all stock is sold.'),
});
export type AnalyzeBusinessHealthInput = z.infer<typeof AnalyzeBusinessHealthInputSchema>;

const AnalyzeBusinessHealthOutputSchema = z.object({
  healthScore: z.number().describe('A score from 1-100 for overall business health.'),
  summary: z.string().describe('A high-level overview of business health.'),
  predictions: z.array(z.string()).describe('List of predictions for the near future.'),
  recommendations: z.array(z.string()).describe('Actionable advice to improve profit.'),
});
export type AnalyzeBusinessHealthOutput = z.infer<typeof AnalyzeBusinessHealthOutputSchema>;

export async function analyzeBusinessHealth(input: AnalyzeBusinessHealthInput): Promise<AnalyzeBusinessHealthOutput> {
  return analyzeBusinessHealthFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeBusinessHealthPrompt',
  input: {schema: AnalyzeBusinessHealthInputSchema},
  output: {schema: AnalyzeBusinessHealthOutputSchema},
  prompt: `You are a professional business consultant and financial analyst.
  
  Analyze the following data for "SpecsBiz" and provide a deep business health audit.
  
  Total Investment (Cost of Stock): {{{totalInvestment}}}
  Calculated Potential Profit: {{{potentialProfit}}}
  Inventory Details: {{{inventoryData}}}
  Recent Sales Performance: {{{salesData}}}
  
  Based on this, evaluate the business health. Identify risks like slow-moving high-cost items or low-margin categories. Provide realistic predictions for future growth and actionable recommendations.`,
});

const analyzeBusinessHealthFlow = ai.defineFlow(
  {
    name: 'analyzeBusinessHealthFlow',
    inputSchema: AnalyzeBusinessHealthInputSchema,
    outputSchema: AnalyzeBusinessHealthOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

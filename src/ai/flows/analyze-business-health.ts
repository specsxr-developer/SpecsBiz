
'use server';
/**
 * @fileOverview AI agent to analyze overall business health and predict performance.
 * Supports dynamic switching between Google and OpenAI models.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { openai } from 'genkitx-openai';

const AnalyzeBusinessHealthInputSchema = z.object({
  inventoryData: z.string().describe('Summary of products.'),
  salesData: z.string().describe('Recent sales.'),
  totalInvestment: z.number().describe('Total investment.'),
  potentialProfit: z.number().describe('Potential profit.'),
  language: z.enum(['en', 'bn']).describe('Output language.'),
  aiApiKey: z.string().optional().describe('API Key.'),
  aiModel: z.string().optional().describe('Model Name.'),
});
export type AnalyzeBusinessHealthInput = z.infer<typeof AnalyzeBusinessHealthInputSchema>;

const AnalyzeBusinessHealthOutputSchema = z.object({
  healthScore: z.number().describe('1-100 score.'),
  summary: z.string().describe('Overview.'),
  predictions: z.array(z.string()).describe('Predictions.'),
  recommendations: z.array(z.string()).describe('Advice.'),
});
export type AnalyzeBusinessHealthOutput = z.infer<typeof AnalyzeBusinessHealthOutputSchema>;

export async function analyzeBusinessHealth(input: AnalyzeBusinessHealthInput): Promise<AnalyzeBusinessHealthOutput> {
  return analyzeBusinessHealthFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeBusinessHealthPrompt',
  input: {schema: AnalyzeBusinessHealthInputSchema},
  output: {schema: AnalyzeBusinessHealthOutputSchema},
  prompt: `Analyze the following data for "SpecsBiz" shop.
  Language: {{language}}.
  If language is 'bn', output in Bengali. ALWAYS address user as "Sir" or "স্যার".
  
  DATA:
  Investment: {{{totalInvestment}}}
  Potential Profit: {{{potentialProfit}}}
  Inventory: {{{inventoryData}}}
  Sales: {{{salesData}}}`,
});

const analyzeBusinessHealthFlow = ai.defineFlow(
  {
    name: 'analyzeBusinessHealthFlow',
    inputSchema: AnalyzeBusinessHealthInputSchema,
    outputSchema: AnalyzeBusinessHealthOutputSchema,
  },
  async input => {
    const userKey = input.aiApiKey?.trim().replace(/^["']|["']$/g, '');
    const userModel = input.aiModel || 'gemini-1.5-flash';
    
    if (!userKey) throw new Error("Missing Key.");

    // Detect Provider and initialize model
    const isOpenAI = userKey.startsWith('sk-');
    const modelInstance = isOpenAI 
      ? openai.model(userModel, { apiKey: userKey })
      : googleAI.model(userModel, { apiKey: userKey });

    const {output} = await prompt(input, { model: modelInstance as any });
    return output!;
  }
);

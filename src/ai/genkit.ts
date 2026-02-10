import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * @fileOverview Genkit initialization optimized for SpecsBiz Master Brain.
 */

export const ai = genkit({
  plugins: [googleAI()],
});

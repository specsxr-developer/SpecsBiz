import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * @fileOverview Genkit initialization optimized for both build-time and client-side execution.
 * Prevents loading of Node-only telemetry when running in the browser/WebView.
 */

export const ai = genkit({
  plugins: [googleAI()],
  model: 'gemini-1.5-flash', // Corrected model name for @genkit-ai/google-genai
});

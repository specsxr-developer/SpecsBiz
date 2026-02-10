import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * @fileOverview Genkit initialization optimized for both build-time and client-side execution.
 * Prevents loading of Node-only telemetry when running in the browser/WebView.
 */

// We use a factory pattern or a simple variable to ensure Genkit doesn't crash during static export
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-1.5-flash', // Corrected model name from 2.5 to 1.5
});

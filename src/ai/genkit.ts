import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});

/**
 * Calls Gemini with a prompt and returns an explanation and suggestions.
 * The prompt should ask for both explanation and next steps.
 */
export async function getGeminiExplanation(prompt: string): Promise<{ explanation: string, suggestions: string }> {
  // This assumes ai.generate returns a string or an object with .text
  const response = await ai.generate({ prompt });
  let text = '';
  if (typeof response === 'string') text = response;
  else if (response && typeof response.text === 'string') text = response.text;
  else text = JSON.stringify(response);

  // Try to split explanation and suggestions if possible
  let explanation = text;
  let suggestions = '';
  const match = text.match(/(Explanation:|Explanation\n)([\s\S]*?)(Suggestions:|Next steps:|Next Actions:|\n- )([\s\S]*)/i);
  if (match) {
    explanation = match[2].trim();
    suggestions = match[4].trim();
  }
  return { explanation, suggestions };
}

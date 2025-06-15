// The aiDrivenCollaborativeRefactoringSuggestions story in the file collaborative-refactoring.ts.
'use server';

/**
 * @fileOverview Provides AI-driven suggestions for collaborative code refactoring, considering
 * collaboration dynamics such as original author and code complexity.
 *
 * - collaborativeRefactor - A function that handles the collaborative refactoring process.
 * - CollaborativeRefactorInput - The input type for the collaborativeRefactor function.
 * - CollaborativeRefactorOutput - The return type for the collaborativeRefactor function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CollaborativeRefactorInputSchema = z.object({
  codeSnippet: z.string().describe('The code snippet to be refactored.'),
  originalAuthor: z.string().describe('The original author of the code snippet.'),
  codeComplexity: z.string().describe('A measure of the code complexity (e.g., low, medium, high).'),
  currentCollaborators: z.array(z.string()).describe('List of current collaborators on the project.'),
  refactoringGoal: z.string().describe('The goal of the refactoring (e.g., improve readability, enhance performance).'),
});
export type CollaborativeRefactorInput = z.infer<typeof CollaborativeRefactorInputSchema>;

export const CollaborativeRefactorOutputSchema = z.object({
  suggestion: z.string(),
  rationale: z.string(),
  priorityDeveloper: z.string(),
  aiProviderName: z.string(), // Add aiProviderName here
});

export type CollaborativeRefactorOutput = z.infer<typeof CollaborativeRefactorOutputSchema>;

export async function collaborativeRefactor(input: CollaborativeRefactorInput): Promise<CollaborativeRefactorOutput> {
  return collaborativeRefactorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'collaborativeRefactorPrompt',
  input: {schema: CollaborativeRefactorInputSchema},
  output: {schema: CollaborativeRefactorOutputSchema},
  prompt: `You are an AI assistant that suggests code refactoring options.

You will receive a code snippet, the original author, a measure of its complexity,
current collaborators, and a refactoring goal. Consider these factors to generate
a refactoring suggestion, provide a rationale, and determine the priority developer
who should be consulted first.

Code Snippet: {{{codeSnippet}}}
Original Author: {{{originalAuthor}}}
Code Complexity: {{{codeComplexity}}}
Current Collaborators: {{#each currentCollaborators}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
Refactoring Goal: {{{refactoringGoal}}}

Suggestion:`, // The suggestion will be populated by the model.
});


const collaborativeRefactorFlow = ai.defineFlow(
  {
    name: 'collaborativeRefactorFlow',
    inputSchema: CollaborativeRefactorInputSchema,
    outputSchema: CollaborativeRefactorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

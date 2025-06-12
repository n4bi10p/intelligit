// filepath: c:\Users\snabi\Downloads\Compressed\gitagent-pr\src\ai\flows\types.ts
import { z } from 'genkit';

// Define an enum for the different AI task types
export const AiTaskTypeSchema = z.enum([
  "SUGGEST_REFACTOR",
  "GENERATE_DOCS",
  "FIND_BUGS",
  "FIX_SYNTAX"
]);
export type AiTaskType = z.infer<typeof AiTaskTypeSchema>;

export const AiTaskInputSchema = z.object({
  codeSnippet: z.string().describe('The code snippet to be processed.'),
  taskType: AiTaskTypeSchema.describe('The type of AI task to perform.'),
});
export type AiTaskInput = z.infer<typeof AiTaskInputSchema>;

export const AiTaskOutputSchema = z.object({
  resultText: z.string().describe('The result of the AI task (e.g., refactored code, documentation, bug report).'),
});
export type AiTaskOutput = z.infer<typeof AiTaskOutputSchema>;

"use client";

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

// Types
import { type CollaborativeRefactorOutput } from '@/ai/flows/collaborative-refactoring';

// Form schema
const refactorSchema = z.object({
  codeSnippet: z.string().min(10, "Code snippet must be at least 10 characters."),
  originalAuthor: z.string().min(1, "Original author is required."),
  codeComplexity: z.enum(["low", "medium", "high"]),
  currentCollaborators: z.string().min(1, "At least one collaborator is required."),
  refactoringGoal: z.string().min(5, "Refactoring goal must be at least 5 characters."),
});

type RefactorFormData = z.infer<typeof refactorSchema>;

export function AiRefactor() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CollaborativeRefactorOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const { control, handleSubmit, formState: { errors } } = useForm<RefactorFormData>({
    resolver: zodResolver(refactorSchema),
    defaultValues: {
      codeSnippet: '',
      originalAuthor: '',
      codeComplexity: 'medium',
      currentCollaborators: '',
      refactoringGoal: '',
    },
  });

const onSubmit = async (data: RefactorFormData) => {
  setIsLoading(true);
  setResult(null);
  setError(null);

  try {
    const response = await fetch("/api/refactor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        provider: "gemini",
        author: data.originalAuthor,
        complexity: data.codeComplexity,
        collaborators: data.currentCollaborators,
        goal: data.refactoringGoal,
        code: data.codeSnippet,
      }),
    });

    if (!response.ok) throw new Error("Failed to fetch suggestion");

    const resultData: CollaborativeRefactorOutput = await response.json();

    setResult({ ...resultData, aiProviderName: "gemini" });

    toast({
      title: `Suggestion Generated`,
      description: "AI refactoring suggestion successfully generated.",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error occurred.";
    setError(message);
    toast({
      title: "Error Generating Suggestion",
      description: message,
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
  }
};

  return (
    <ScrollArea className="h-full p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">AI Collaborative Refactoring</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

              <div>
                <Label htmlFor="codeSnippet" className="text-sm font-medium text-foreground">Code Snippet</Label>
                <Controller
                  name="codeSnippet"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      id="codeSnippet"
                      {...field}
                      placeholder="Paste your code snippet here..."
                      className="mt-1 min-h-[150px] bg-[hsl(var(--input))] text-foreground focus:ring-primary font-code"
                    />
                  )}
                />
                {errors.codeSnippet && <p className="text-xs text-destructive mt-1">{errors.codeSnippet.message}</p>}
              </div>

              <div>
                <Label htmlFor="originalAuthor" className="text-sm font-medium text-foreground">Original Author</Label>
                <Controller
                  name="originalAuthor"
                  control={control}
                  render={({ field }) => (
                    <Input id="originalAuthor" {...field} placeholder="e.g., John Doe" className="mt-1 bg-[hsl(var(--input))] text-foreground focus:ring-primary" />
                  )}
                />
                {errors.originalAuthor && <p className="text-xs text-destructive mt-1">{errors.originalAuthor.message}</p>}
              </div>

              <div>
                <Label htmlFor="codeComplexity" className="text-sm font-medium text-foreground">Code Complexity</Label>
                <Controller
                  name="codeComplexity"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger id="codeComplexity" className="mt-1 w-full bg-[hsl(var(--input))] text-foreground focus:ring-primary">
                        <SelectValue placeholder="Select complexity" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover text-popover-foreground">
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.codeComplexity && <p className="text-xs text-destructive mt-1">{errors.codeComplexity.message}</p>}
              </div>

              <div>
                <Label htmlFor="currentCollaborators" className="text-sm font-medium text-foreground">Current Collaborators (comma-separated)</Label>
                <Controller
                  name="currentCollaborators"
                  control={control}
                  render={({ field }) => (
                    <Input id="currentCollaborators" {...field} placeholder="e.g., Alice, Bob, Charlie" className="mt-1 bg-[hsl(var(--input))] text-foreground focus:ring-primary" />
                  )}
                />
                {errors.currentCollaborators && <p className="text-xs text-destructive mt-1">{errors.currentCollaborators.message}</p>}
              </div>

              <div>
                <Label htmlFor="refactoringGoal" className="text-sm font-medium text-foreground">Refactoring Goal</Label>
                <Controller
                  name="refactoringGoal"
                  control={control}
                  render={({ field }) => (
                    <Input id="refactoringGoal" {...field} placeholder="e.g., Improve readability" className="mt-1 bg-[hsl(var(--input))] text-foreground focus:ring-primary" />
                  )}
                />
                {errors.refactoringGoal && <p className="text-xs text-destructive mt-1">{errors.refactoringGoal.message}</p>}
              </div>

              <Button type="submit" disabled={isLoading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Get Suggestion"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {error && (
          <Card className="bg-destructive border-destructive text-destructive-foreground">
            <CardHeader><CardTitle className="text-base">Error</CardTitle></CardHeader>
            <CardContent><p className="text-sm">{error}</p></CardContent>
          </Card>
        )}

        {result && (
          <div className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-primary">Suggestion from Gemini</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-[hsl(var(--background))] p-3 rounded-md text-sm text-foreground overflow-x-auto font-code">
                  <code>{result.suggestion}</code>
                </pre>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-primary">Rationale</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground">{result.rationale}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-primary">Priority Developer to Consult</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground">{result.priorityDeveloper}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}


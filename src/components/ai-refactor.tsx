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
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';

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
  const [mode, setMode] = useState<'refactor' | 'commit-summary'>('refactor');
  const [commitDiff, setCommitDiff] = useState('');
  const [commitSummary, setCommitSummary] = useState('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [isCommitting, setIsCommitting] = useState(false);
  const [autoPush, setAutoPush] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingCommit, setPendingCommit] = useState<null | string>(null);
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

  // --- AI Modes ---
  const MODES = [
    { value: 'refactor', label: 'Refactor Code' },
    { value: 'commit-summary', label: 'Commit Summary' },
  ];

  const onSubmit = async (data: RefactorFormData) => {
    console.log('[AI] onSubmit called', data);
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
      console.log('[AI] Refactor suggestion response', resultData);
      setResult({ ...resultData, aiProviderName: "gemini" });
      toast({
        title: `Suggestion Generated`,
        description: "AI refactoring suggestion successfully generated.",
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error occurred.";
      setError(message);
      console.error('[AI] Error generating refactor suggestion', e);
      toast({
        title: "Error Generating Suggestion",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Commit Summary Handler ---
  const handleGenerateSummary = async () => {
    console.log('[AI] handleGenerateSummary called', { commitDiff });
    setIsSummaryLoading(true);
    setSummaryError(null);
    setCommitSummary('');
    try {
      // SECURITY: Prevent sensitive diffs
      const blockedKeywords = [
        '.env',
        'serviceAccount',
        'firebaseServiceAccount',
        'credentials.json',
        'authConfig',
        'privateKey',
        'apiKey',
        'clientSecret',
        'password',
      ];
      // Only match whole words or file names, not substrings inside other words
      const pattern = new RegExp(
        blockedKeywords.map(k => `(^|[\\s"'/])${k.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}(?=$|[\\s"'/])`).join('|'),
        'i'
      );
      if (pattern.test(commitDiff)) {
        console.warn('[AI] Blocked diff due to sensitive keywords', { commitDiff });
        setSummaryError('Diff contains sensitive file changes (blocked keywords: ' + blockedKeywords.join(', ') + '). Commit summary is not allowed.');
        setIsSummaryLoading(false);
        return;
      }
      // Call backend API
      const response = await fetch('/api/commit-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diff: commitDiff }),
      });
      if (!response.ok) throw new Error('Failed to generate summary');
      const data = await response.json();
      console.log('[AI] Commit summary response', data);
      // Escape HTML/JS for safety
      const safeSummary = (data.summary || '').replace(/[<>]/g, (c: string) => c === '<' ? '&lt;' : '&gt;');
      setCommitSummary(safeSummary);
    } catch (e) {
      console.error('[AI] Error generating summary', e);
      setSummaryError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setIsSummaryLoading(false);
    }
  };

  return (
    <ScrollArea className="h-full p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* --- Mode Selector --- */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-foreground">AI Assistant</h2>
          <Select value={mode} onValueChange={v => setMode(v as 'refactor' | 'commit-summary')}>
            <SelectTrigger className="w-48 bg-[hsl(var(--input))] text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODES.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* --- Refactor Code Mode --- */}
        {mode === 'refactor' && (
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
        )}
        {/* --- Commit Summary Mode --- */}
        {mode === 'commit-summary' && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">Commit Summarization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Label className="text-sm font-medium text-foreground">Git Diff</Label>
                <Textarea
                  value={commitDiff}
                  onChange={e => setCommitDiff(e.target.value)}
                  placeholder="Paste or load your git diff here..."
                  className="mt-1 min-h-[120px] bg-[hsl(var(--input))] text-foreground font-mono"
                  maxLength={10000}
                />
              </div>
              <Button type="button" onClick={handleGenerateSummary} disabled={isSummaryLoading || !commitDiff.trim()} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mb-2">
                {isSummaryLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Generate Summary"}
              </Button>
              {summaryError && <p className="text-xs text-destructive mt-1">{summaryError}</p>}
              {commitSummary && (
                <div className="mt-4">
                  <Label className="text-sm font-medium text-foreground">AI Commit Message</Label>
                  <Textarea 
                    value={commitSummary} 
                    readOnly 
                    className="mt-1 min-h-[120px] max-h-[300px] bg-[hsl(var(--input))] text-foreground font-mono text-base leading-relaxed resize-y"
                  />
                  <div className="flex items-center mt-2 mb-2">
                    <input
                      type="checkbox"
                      id="autoPush"
                      checked={autoPush}
                      onChange={e => setAutoPush(e.target.checked)}
                      className="mr-2"
                    />
                    <Label htmlFor="autoPush" className="text-sm">Auto-push after commit</Label>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      type="button"
                      className="w-1/2"
                      disabled={isCommitting}
                      onClick={async () => {
                        try {
                          const res = await fetch('/api/stage', { method: 'POST' });
                          const data = await res.json();
                          if (data.success) {
                            toast({ title: '✅ Changes staged', description: data.message });
                          } else {
                            toast({ title: 'Nothing to stage', description: data.message, variant: 'destructive' });
                          }
                        } catch (e: any) {
                          toast({ title: '❌ Failed to stage changes', description: e.message || 'Unknown error', variant: 'destructive' });
                        }
                      }}
                    >
                      Stage All Changes
                    </Button>
                    <Button
                      type="button"
                      className="w-1/2"
                      disabled={isCommitting || !commitSummary.trim()}
                      onClick={() => {
                        if (!commitSummary.trim()) return;
                        setPendingCommit(commitSummary);
                        setShowConfirmDialog(true);
                      }}
                    >
                      {isCommitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Use as Git Commit'}
                    </Button>
                  </div>
                  <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Confirm Commit</DialogTitle>
                      </DialogHeader>
                      <div className="py-2">Are you sure you want to commit with this message?</div>
                      <Textarea value={pendingCommit || ''} readOnly className="mb-2" />
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setShowConfirmDialog(false)}
                          disabled={isCommitting}
                        >Cancel</Button>
                        <Button
                          onClick={async () => {
                            if (!pendingCommit) return;
                            console.log('[AI] Commit dialog confirmed', { pendingCommit, autoPush });
                            setIsCommitting(true);
                            try {
                              const plainMsg = pendingCommit.replace(/[`*_~#>\[\]]/g, '').split('\n')[0].slice(0, 72);
                              const res = await fetch('/api/commit', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ message: plainMsg, autoPush }),
                              });
                              const data = await res.json();
                              console.log('[AI] Commit response', data);
                              if (res.ok && data.success) {
                                let pushMsg = '';
                                if (autoPush) {
                                  if (data.push === false && data.pushError) {
                                    pushMsg = `\nPush failed: ${data.pushError}`;
                                  } else if (data.push === true) {
                                    pushMsg = '\nPushed to remote.';
                                  }
                                }
                                toast({ title: '✅ Commit successful', description: plainMsg + pushMsg });
                                setShowConfirmDialog(false);
                              } else {
                                toast({ title: 'Commit failed', description: data.error || 'Unknown error', variant: 'destructive' });
                              }
                            } catch (e: any) {
                              console.error('[AI] Commit error', e);
                              toast({ title: 'Commit failed', description: e.message || 'Unknown error', variant: 'destructive' });
                            } finally {
                              setIsCommitting(false);
                            }
                          }}
                          disabled={isCommitting}
                        >{isCommitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Confirm & Commit'}</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        {/* --- Error Card --- */}
        {mode === 'refactor' && error && (
          <Card className="bg-destructive border-destructive text-destructive-foreground">
            <CardHeader><CardTitle className="text-base">Error</CardTitle></CardHeader>
            <CardContent><p className="text-sm">{error}</p></CardContent>
          </Card>
        )}
        {/* --- Result Cards --- */}
        {mode === 'refactor' && result && (
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


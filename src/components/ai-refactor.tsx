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
import { SettingsDialog } from './SettingsDialog';
import ReactMarkdown from 'react-markdown';

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
  const [mode, setMode] = useState<'refactor' | 'commit-summary' | 'status-helper' | 'pr' | 'changelog' | 'readme'>('refactor');
  const [commitDiff, setCommitDiff] = useState('');
  const [commitSummary, setCommitSummary] = useState('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [isCommitting, setIsCommitting] = useState(false);
  const [autoPush, setAutoPush] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingCommit, setPendingCommit] = useState<null | string>(null);
  const [showPrPanel, setShowPrPanel] = useState(false);
  const [prTitle, setPrTitle] = useState('');
  const [prBody, setPrBody] = useState('');
  const [isPrBodyLoading, setIsPrBodyLoading] = useState(false);
  const [prError, setPrError] = useState<string | null>(null);
  const [isCreatingPr, setIsCreatingPr] = useState(false);
  const [prSuccess, setPrSuccess] = useState<string | null>(null);
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [githubToken, setGithubToken] = useState<string>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('githubToken') || '' : ''
  );
  const [tokenStatus, setTokenStatus] = useState<string>('');
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
    { value: 'status-helper', label: 'Status Helper' },
    { value: 'pr', label: 'Generate Pull Request' },
    { value: 'changelog', label: 'Changelog Generator' },
    { value: 'readme', label: 'README.md Generator' }, // NEW
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

  // --- Repo Path Selection ---
  const [repoPath, setRepoPath] = useState<string>("");

  // Helper: Suggest default repo path for user
  React.useEffect(() => {
    // Suggest a default path if not set
    if (!repoPath) {
      setRepoPath("C:\\Users\\snabi\\Downloads\\Compressed\\telegram-chatbot"); // Example path, replace with your own
    }
  }, []);

  // Hardcoded repo path for local testing. Replace with dynamic value in production/extension.
  // const [repoPath, setRepoPath] = useState<string>("C:\\Users\\snabi\\Downloads\\Compressed\\aichatbot");

  // --- PR Body Generation ---
  const handleGeneratePrBody = async () => {
    setIsPrBodyLoading(true);
    setPrError(null);
    try {
      const response = await fetch('/api/commit-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diff: commitDiff }),
      });
      if (!response.ok) throw new Error('Failed to generate PR body');
      const data = await response.json();
      setPrBody(data.summary || '');
    } catch (e) {
      setPrError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setIsPrBodyLoading(false);
    }
  };

  // Save token to localStorage
  const handleSaveToken = (token: string) => {
    setGithubToken(token);
    if (typeof window !== 'undefined') {
      localStorage.setItem('githubToken', token);
    }
    setTokenStatus('Token saved!');
    setTimeout(() => setTokenStatus(''), 2000);
  };

  // Always get the latest token from localStorage before PR creation
  const getLatestGithubToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('githubToken') || '';
    }
    return githubToken;
  };

  // --- PR Submission ---
  const handleCreatePr = async () => {
    setIsCreatingPr(true);
    setPrError(null);
    setPrSuccess(null);
    setPrUrl(null);
    const latestToken = getLatestGithubToken();
    try {
      // Debug: Log the token being sent
      console.log('[AI] Creating PR with githubToken:', latestToken);
      const response = await fetch('/api/pull-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoPath,
          title: prTitle,
          body: prBody,
          githubToken: latestToken,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to create PR');
      setPrSuccess('Pull request created successfully!');
      setPrUrl(data.url || null);
      toast({ title: '✅ Pull request created', description: data.url ? `View PR: ${data.url}` : 'Success' });
      // Instantly refresh PRs after PR creation
      await refreshPrs();
    } catch (e) {
      setPrError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setIsCreatingPr(false);
    }
  };

  // --- Status Helper State ---
  const [activeTab, setActiveTab] = useState<'refactor' | 'commit-summary' | 'status-helper'>('refactor');
  const [statusLoading, setStatusLoading] = useState(false);
  const [gitStatusRaw, setGitStatusRaw] = useState('');
  const [gitLogRaw, setGitLogRaw] = useState('');
  const [statusExplanation, setStatusExplanation] = useState('');
  const [statusSuggestions, setStatusSuggestions] = useState('');
  const [statusError, setStatusError] = useState<string | null>(null);

  // --- Status Helper Handler ---
  const handleCheckStatus = async () => {
    setStatusLoading(true);
    setStatusError(null);
    setGitStatusRaw('');
    setGitLogRaw('');
    setStatusExplanation('');
    setStatusSuggestions('');
    try {
      const response = await fetch('/api/git-status-helper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoPath }),
      });
      if (!response.ok) throw new Error('Failed to get git status');
      const data = await response.json();
      setGitStatusRaw(data.gitStatus || '');
      setGitLogRaw(data.gitLog || '');
      setStatusExplanation(data.explanation || '');
      setStatusSuggestions(data.suggestions || '');
    } catch (e) {
      setStatusError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setStatusLoading(false);
    }
  };

  // --- PR Review State ---
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // --- PR Review Handler ---
  const handleReviewPr = async () => {
    setIsReviewing(true);
    setReviewFeedback(null);
    setReviewError(null);
    try {
      const response = await fetch('/api/pr-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoPath }),
      });
      if (!response.ok) throw new Error('Failed to get PR review');
      const data = await response.json();
      setReviewFeedback(data.feedback || 'No feedback returned.');
    } catch (e) {
      setReviewError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setIsReviewing(false);
    }
  };

  // --- Open PRs State ---
  const [openPrs, setOpenPrs] = useState<any[]>([]);
  const [isLoadingPrs, setIsLoadingPrs] = useState(false);
  const [prActionLoading, setPrActionLoading] = useState<{ [pr: number]: string }>({});
  const [prActionResult, setPrActionResult] = useState<{ [pr: number]: string }>({});

  // --- PR Comments State ---
  const [prComments, setPrComments] = useState<{ [prNumber: number]: any[] }>({});
  const [isLoadingComments, setIsLoadingComments] = useState<{ [prNumber: number]: boolean }>({});

  // --- PR Comment State ---
  const [prComment, setPrComment] = useState<{ [prNumber: number]: string }>({});
  const [isPostingComment, setIsPostingComment] = useState<{ [prNumber: number]: boolean }>({});
  const [prCommentResult, setPrCommentResult] = useState<{ [prNumber: number]: string | null }>({});

  // Helper to refresh PRs
  const refreshPrs = async () => {
    setIsLoadingPrs(true);
    try {
      const response = await fetch('/api/pr-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list', repoPath, githubToken }),
      });
      const data = await response.json();
      setOpenPrs(Array.isArray(data.prs) ? data.prs : []);
    } catch {
      setOpenPrs([]);
    } finally {
      setIsLoadingPrs(false);
    }
  };

  // --- Fetch PR Comments ---
  const fetchPrComments = async (pr: any) => {
    setIsLoadingComments(l => ({ ...l, [pr.number]: true }));
    try {
      // Add a cache-busting query param to avoid browser caching
      const response = await fetch(`https://api.github.com/repos/${pr.base.repo.owner.login}/${pr.base.repo.name}/issues/${pr.number}/comments?cb=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github+json',
        },
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setPrComments(c => ({ ...c, [pr.number]: data }));
      } else {
        setPrComments(c => ({ ...c, [pr.number]: [] }));
      }
    } catch {
      setPrComments(c => ({ ...c, [pr.number]: [] }));
    } finally {
      setIsLoadingComments(l => ({ ...l, [pr.number]: false }));
    }
  };

  // Fetch open PRs when PR panel is shown
  React.useEffect(() => {
    if (mode === 'pr') {
      refreshPrs();
    }
  }, [mode, repoPath, githubToken]);

  // Fetch comments when PRs are loaded or when a comment is posted
  React.useEffect(() => {
    if (mode === 'pr' && openPrs.length > 0) {
      openPrs.forEach(pr => fetchPrComments(pr));
    }
    // eslint-disable-next-line
  }, [mode, openPrs, githubToken]);

  // Merge PR handler
  const handleMergePr = async (pr: any) => {
    setPrActionLoading(l => ({ ...l, [pr.number]: 'merge' }));
    setPrActionResult(r => ({ ...r, [pr.number]: '' }));
    try {
      const response = await fetch('/api/pr-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'merge',
          owner: pr.base.repo.owner.login,
          repo: pr.base.repo.name,
          pull_number: pr.number,
          githubToken,
          commit_title: `Merge PR #${pr.number}: ${pr.title}`,
        }),
      });
      const data = await response.json();
      setPrActionResult(r => ({ ...r, [pr.number]: data.merged ? '✅ Merged!' : `❌ ${data.message || 'Failed to merge'}` }));
      if (data.merged) {
        setTimeout(() => refreshPrs(), 1000);
      }
    } catch (e: any) {
      setPrActionResult(r => ({ ...r, [pr.number]: '❌ Merge failed' }));
    } finally {
      setPrActionLoading(l => ({ ...l, [pr.number]: '' }));
    }
  };

  // Close PR handler
  const handleClosePr = async (pr: any) => {
    setPrActionLoading(l => ({ ...l, [pr.number]: 'close' }));
    setPrActionResult(r => ({ ...r, [pr.number]: '' }));
    try {
      const response = await fetch('/api/pr-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'close',
          owner: pr.base.repo.owner.login,
          repo: pr.base.repo.name,
          pull_number: pr.number,
          githubToken,
        }),
      });
      const data = await response.json();
      setPrActionResult(r => ({ ...r, [pr.number]: data.closed ? '✅ Closed!' : `❌ ${data.message || 'Failed to close'}` }));
      if (data.closed) {
        setTimeout(() => refreshPrs(), 1000);
      }
    } catch (e: any) {
      setPrActionResult(r => ({ ...r, [pr.number]: '❌ Close failed' }));
    } finally {
      setPrActionLoading(l => ({ ...l, [pr.number]: '' }));
    }
  };

  // --- PR Comment Handler ---
  const handlePostPrComment = async (pr: any) => {
    setIsPostingComment(s => ({ ...s, [pr.number]: true }));
    setPrCommentResult(r => ({ ...r, [pr.number]: null }));
    try {
      const response = await fetch('/api/pr-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: pr.base.repo.owner.login,
          repo: pr.base.repo.name,
          pull_number: pr.number,
          githubToken,
          comment: prComment[pr.number],
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setPrComment(c => ({ ...c, [pr.number]: '' }));
        setPrCommentResult(r => ({ ...r, [pr.number]: '✅ Comment posted' }));
        toast({ title: '✅ Comment posted', description: 'Your comment was added to the PR.' });
        await fetchPrComments(pr); // Refresh comments after posting
      } else {
        setPrCommentResult(r => ({ ...r, [pr.number]: '❌ Failed to post comment' }));
        toast({ title: '❌ Failed to post comment', description: data.error || 'Unknown error', variant: 'destructive' });
      }
    } catch (e: any) {
      setPrCommentResult(r => ({ ...r, [pr.number]: '❌ Failed to post comment' }));
      toast({ title: '❌ Failed to post comment', description: e.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setIsPostingComment(s => ({ ...s, [pr.number]: false }));
    }
  };

  // --- Changelog Generator Component ---
  function ChangelogGenerator() {
    const [markdown, setMarkdown] = useState('');
    const [aiSummary, setAiSummary] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState('');

    const generateChangelog = async () => {
      setLoading(true);
      setError(null);
      setMarkdown('');
      setAiSummary('');
      try {
        // Pass repoPath as query param
        const res = await fetch(`/api/changelog?repoPath=${encodeURIComponent(repoPath)}`);
        const data = await res.json();
        if (!res.ok || !data.markdown) throw new Error(data.error || 'Failed to generate changelog');
        setMarkdown(data.markdown);
        setEditValue(data.markdown);
        setAiSummary(data.aiSummary || '');
      } catch (e: any) {
        setError(e.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div>
        <Button onClick={generateChangelog} disabled={loading} className="mb-4">
          {loading ? 'Generating...' : 'Generate Changelog'}
        </Button>
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        {aiSummary && (
          <div className="mb-4 p-3 bg-muted rounded">
            <Label className="text-sm font-medium text-primary">AI Summary</Label>
            <div className="mt-1 text-foreground whitespace-pre-line">{aiSummary}</div>
          </div>
        )}
        {markdown && !isEditing && (
          <div className="mt-4">
            <Label className="text-sm font-medium text-foreground">Changelog Preview (Markdown)</Label>
            <Textarea value={markdown} readOnly className="mt-1 min-h-[200px] bg-[hsl(var(--input))] text-foreground font-mono" />
            <div className="flex gap-2 mt-2">
              <Button type="button" onClick={() => navigator.clipboard.writeText(markdown)}>📋 Copy</Button>
              <Button
                type="button"
                onClick={async () => {
                  try {
                    const res = await fetch('/api/changelog', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ markdown, repoPath }),
                    });
                    const data = await res.json();
                    if (res.ok && data.success) {
                      toast({ title: '✅ Saved as CHANGELOG.md', description: `Saved to: ${data.path}` });
                    } else {
                      toast({ title: '❌ Failed to save', description: data.error || 'Unknown error', variant: 'destructive' });
                    }
                  } catch (e: any) {
                    toast({ title: '❌ Failed to save', description: e.message || 'Unknown error', variant: 'destructive' });
                  }
                }}
              >💾 Save as CHANGELOG.md</Button>
              <Button type="button" onClick={() => setIsEditing(true)}>✏️ Edit</Button>
            </div>
          </div>
        )}
        {isEditing && (
          <div className="mt-4">
            <Label className="text-sm font-medium text-foreground">Edit Changelog</Label>
            <Textarea value={editValue} onChange={e => setEditValue(e.target.value)} className="mt-1 min-h-[200px] bg-[hsl(var(--input))] text-foreground font-mono" />
            <div className="flex gap-2 mt-2">
              <Button type="button" onClick={() => { setMarkdown(editValue); setIsEditing(false); }}>💾 Save</Button>
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- README Generator Component ---
  function ReadmeGenerator() {
    const [markdown, setMarkdown] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState('');
    const [showPrompt, setShowPrompt] = useState(false);
    const [userDescription, setUserDescription] = useState('');

    const generateReadme = async () => {
      setLoading(true);
      setError(null);
      setMarkdown('');
      try {
        const res = await fetch('/api/generate-readme', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userDescription, repoPath }),
        });
        const data = await res.json();
        if (!res.ok || !data.markdown) throw new Error(data.error || 'Failed to generate README');
        setMarkdown(data.markdown);
        setEditValue(data.markdown);
      } catch (e: any) {
        setError(e.message || 'Unknown error');
      } finally {
        setLoading(false);
        setShowPrompt(false);
      }
    };

    return (
      <div>
        <Button onClick={() => setShowPrompt(true)} disabled={loading} className="mb-4">
          {loading ? 'Generating...' : '📝 Generate README'}
        </Button>
        {showPrompt && (
          <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Describe your project (optional)</DialogTitle>
              </DialogHeader>
              <Input
                value={userDescription}
                onChange={e => setUserDescription(e.target.value)}
                placeholder="Describe your project in 1 sentence (optional)"
                className="mb-2"
              />
              <DialogFooter>
                <Button onClick={generateReadme} disabled={loading}>
                  {loading ? 'Generating...' : 'Generate'}
                </Button>
                <Button variant="outline" onClick={() => setShowPrompt(false)}>Cancel</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        {markdown && !isEditing && (
          <div className="mt-4">
            <Label className="text-sm font-medium text-foreground">README Preview (Markdown)</Label>
            <Textarea value={markdown} readOnly className="mt-1 min-h-[200px] bg-[hsl(var(--input))] text-foreground font-mono" />
            <div className="flex gap-2 mt-2">
              <Button type="button" onClick={() => navigator.clipboard.writeText(markdown)}>📋 Copy</Button>
              <Button
                type="button"
                onClick={async () => {
                  try {
                    const res = await fetch('/api/generate-readme', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ markdown, repoPath }),
                    });
                    const data = await res.json();
                    if (res.ok && data.success) {
                      toast({ title: '✅ Saved as README.md', description: `Saved to: ${data.path}` });
                    } else {
                      toast({ title: '❌ Failed to save', description: data.error || 'Unknown error', variant: 'destructive' });
                    }
                  } catch (e: any) {
                    toast({ title: '❌ Failed to save', description: e.message || 'Unknown error', variant: 'destructive' });
                  }
                }}
              >💾 Save as README.md</Button>
              <Button type="button" onClick={() => setIsEditing(true)}>✏️ Edit</Button>
            </div>
          </div>
        )}
        {isEditing && (
          <div className="mt-4">
            <Label className="text-sm font-medium text-foreground">Edit README</Label>
            <Textarea value={editValue} onChange={e => setEditValue(e.target.value)} className="mt-1 min-h-[200px] bg-[hsl(var(--input))] text-foreground font-mono" />
            <div className="flex gap-2 mt-2">
              <Button type="button" onClick={() => { setMarkdown(editValue); setIsEditing(false); }}>💾 Save</Button>
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <ScrollArea className="h-full p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* --- Header with Settings and Dropdown --- */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-2">
          <h2 className="text-xl font-bold text-foreground">AI Assistant</h2>
          <div className="flex gap-2 items-center mt-4 sm:mt-0">
            <div className="bg-card border border-border rounded-md shadow-md px-2 py-1">
              <Select value={mode} onValueChange={v => setMode(v as 'refactor' | 'commit-summary' | 'status-helper' | 'pr' | 'changelog' | 'readme')}>
                <SelectTrigger className="w-48 bg-[hsl(var(--input))] text-foreground border-none shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODES.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        {/* --- Status Helper --- */}
        {mode === 'status-helper' && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">Git Status Helper</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Label className="text-sm font-medium text-foreground">Repository Path</Label>
                <Input
                  value={repoPath}
                  onChange={e => setRepoPath(e.target.value)}
                  placeholder="Path to your local git repo"
                  className="mt-1 bg-[hsl(var(--input))] text-foreground"
                />
              </div>
              <Button type="button" onClick={handleCheckStatus} disabled={statusLoading || !repoPath.trim()} className="mb-4">
                {statusLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Check Status'}
              </Button>
              {statusError && <p className="text-xs text-destructive mt-1">{statusError}</p>}
              {gitStatusRaw && (
                <div className="mb-2">
                  <Label className="text-sm font-medium text-foreground">Raw Git Status</Label>
                  <Textarea value={gitStatusRaw} readOnly className="mt-1 min-h-[80px] bg-[hsl(var(--input))] text-foreground font-mono" />
                </div>
              )}
              {gitLogRaw && (
                <div className="mb-2">
                  <Label className="text-sm font-medium text-foreground">Latest Commit (git log -1)</Label>
                  <Textarea value={gitLogRaw} readOnly className="mt-1 min-h-[60px] bg-[hsl(var(--input))] text-foreground font-mono" />
                </div>
              )}
              {statusExplanation && (
                <div className="mb-2">
                  <Label className="text-sm font-medium text-primary">AI Explanation</Label>
                  <div className="mt-1 p-3 rounded-md bg-muted text-foreground whitespace-pre-line">{statusExplanation}</div>
                </div>
              )}
              {statusSuggestions && (
                <div className="mb-2">
                  <Label className="text-sm font-medium text-primary">Suggested Next Actions</Label>
                  <div className="mt-1 p-3 rounded-md bg-muted text-foreground whitespace-pre-line">{statusSuggestions}</div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
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
                          const res = await fetch('/api/stage', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ repoPath }),
                          });
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
                            console.log('[AI] Commit dialog confirmed', { pendingCommit, autoPush, repoPath });
                            setIsCommitting(true);
                            try {
                              // Use the full AI commit message (subject + body)
                              const plainMsg = pendingCommit.replace(/[`*_~#>\[\]]/g, '').trim();
                              const res = await fetch('/api/commit', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ message: plainMsg, autoPush, repoPath }),
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
                                setPrTitle(plainMsg.split('\n')[0] || '');
                                setPrBody('');
                                setShowPrPanel(true);
                                setPrError(null);
                                setPrSuccess(null);
                                setPrUrl(null);
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
        {/* --- PR Panel (now in dropdown) --- */}
        {mode === 'pr' && (
          <Card className="bg-card border-border mt-6">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-primary">Generate Pull Request</CardTitle>
            </CardHeader>
            <CardContent>
              {/* --- Open PRs List --- */}
              <div className="mb-6">
                <Label className="text-sm font-medium text-foreground">Open Pull Requests</Label>
                {isLoadingPrs ? (
                  <div className="mt-2 text-sm text-muted-foreground flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading PRs...</div>
                ) : openPrs.length === 0 ? (
                  <div className="mt-2 text-sm text-muted-foreground">No open pull requests found.</div>
                ) : (
                  <div className="space-y-2 mt-2">
                    {openPrs.map(pr => (
                      <div key={pr.number} className="border rounded p-2 bg-muted">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <span className="font-semibold">#{pr.number}</span> {pr.title}
                            <span className="ml-2 text-xs text-muted-foreground">by {pr.user.login}</span>
                          </div>
                          <div className="flex gap-2 mt-2 sm:mt-0">
                            <Button size="sm" variant="outline" disabled={!!prActionLoading[pr.number]} onClick={() => handleMergePr(pr)}>
                              {prActionLoading[pr.number] === 'merge' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Merge PR'}
                            </Button>
                            <Button size="sm" variant="destructive" disabled={!!prActionLoading[pr.number]} onClick={() => handleClosePr(pr)}>
                              {prActionLoading[pr.number] === 'close' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Close PR'}
                            </Button>
                          </div>
                        </div>
                        {/* --- PR Comments List --- */}
                        <div className="mt-3">
                          <Label className="text-xs font-medium text-foreground">Comments</Label>
                          {isLoadingComments[pr.number] ? (
                            <div className="text-xs text-muted-foreground flex items-center"><Loader2 className="mr-2 h-3 w-3 animate-spin" />Loading comments...</div>
                          ) : prComments[pr.number] && prComments[pr.number].length > 0 ? (
                            <div className="space-y-2 mt-1 max-h-40 overflow-y-auto">
                              {prComments[pr.number].map((c: any) => (
                                <div key={c.id} className="bg-background border rounded p-2 text-xs">
                                  <div className="font-semibold text-foreground">{c.user.login}</div>
                                  <div className="prose prose-xs text-foreground"><ReactMarkdown>{c.body}</ReactMarkdown></div>
                                  <div className="text-muted-foreground mt-1">{new Date(c.created_at).toLocaleString()}</div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground mt-1">No comments yet.</div>
                          )}
                        </div>
                        {/* --- PR Comment Box --- */}
                        <div className="mt-3">
                          <Label className="text-xs font-medium text-foreground">Add Comment</Label>
                          <Textarea
                            value={prComment[pr.number] || ''}
                            onChange={e => setPrComment(c => ({ ...c, [pr.number]: e.target.value }))}
                            placeholder="Write a comment for this PR (markdown supported)..."
                            className="mt-1 min-h-[60px] bg-[hsl(var(--input))] text-foreground"
                            disabled={isPostingComment[pr.number]}
                          />
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              size="sm"
                              onClick={() => handlePostPrComment(pr)}
                              disabled={isPostingComment[pr.number] || !(prComment[pr.number] && prComment[pr.number].trim())}
                            >{isPostingComment[pr.number] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Post Comment'}</Button>
                            {prCommentResult[pr.number] && <span className="text-xs ml-2">{prCommentResult[pr.number]}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* --- PR Title/Body/AI Review --- */}
              <div className="mb-2">
                <Label className="text-sm font-medium text-foreground">PR Title</Label>
                <Input
                  value={prTitle}
                  onChange={e => setPrTitle(e.target.value)}
                  className="mt-1 bg-[hsl(var(--input))] text-foreground"
                />
              </div>
              <div className="mb-2">
                <Label className="text-sm font-medium text-foreground">PR Body</Label>
                <Textarea
                  value={prBody}
                  onChange={e => setPrBody(e.target.value)}
                  placeholder="Describe your changes..."
                  className="mt-1 min-h-[100px] bg-[hsl(var(--input))] text-foreground"
                />
                <Button
                  type="button"
                  className="mt-2"
                  onClick={handleGeneratePrBody}
                  disabled={isPrBodyLoading}
                >{isPrBodyLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Generate PR Body with Gemini'}</Button>
              </div>
              {/* --- AI Reviewer --- */}
              <div className="mb-2">
                <Button
                  type="button"
                  className="w-full mt-2"
                  onClick={handleReviewPr}
                  disabled={isReviewing}
                >{isReviewing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Review PR with AI'}</Button>
                {reviewError && <p className="text-xs text-destructive mt-1">{reviewError}</p>}
                {reviewFeedback && (
                  <div className="mt-4 p-3 rounded-md bg-muted text-foreground">
                    <Label className="text-sm font-medium text-primary mb-2">AI Review Feedback</Label>
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown>{reviewFeedback}</ReactMarkdown>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-2"
                      onClick={() => setPrBody(prBody ? prBody + '\n\n' + reviewFeedback : reviewFeedback)}
                    >Copy to PR</Button>
                  </div>
                )}
              </div>
              {prError && <p className="text-xs text-destructive mt-1">{prError}</p>}
              {prSuccess && <p className="text-xs text-green-600 mt-1">{prSuccess} {prUrl && (<a href={prUrl} target="_blank" rel="noopener noreferrer" className="underline ml-2">View PR</a>)}</p>}
              <Button
                type="button"
                className="w-full mt-4"
                onClick={handleCreatePr}
                disabled={isCreatingPr || !prTitle.trim() || !prBody.trim()}
              >{isCreatingPr ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Pull Request'}</Button>
            </CardContent>
          </Card>
        )}
        {/* --- Changelog Generator Mode --- */}
        {mode === 'changelog' && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-primary">Changelog Generator</CardTitle>
            </CardHeader>
            <CardContent>
              <ChangelogGenerator />
            </CardContent>
          </Card>
        )}
        {/* --- README Generator Mode --- */}
        {mode === 'readme' && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-primary">README.md Generator</CardTitle>
            </CardHeader>
            <CardContent>
              <ReadmeGenerator />
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


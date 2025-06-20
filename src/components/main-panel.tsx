"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GitFork, UploadCloud, RefreshCw, CheckCircle, Loader2, Settings as SettingsIcon } from 'lucide-react';
import { ActivityFeed } from '@/app/components/activity-feed'; // Corrected import path
import { TasksBoard } from './tasks-board';
import { CodeChat } from './code-chat'; // Or the correct path
import { AiRefactor } from './ai-refactor';
import { Commit } from './WebviewMessenger'; // Assuming Commit type is here or imported appropriately
import { Branch, Contributor } from '../types'; // Import Branch type and Contributor type
import { useToast } from '@/hooks/use-toast';

// Define ChatMessage interface directly in main-panel.tsx or import from a shared types file
interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  timestamp: number | object;
  avatar?: string;
}

interface MainPanelProps {
  vscodeApi: { postMessage: (message: any) => void; }; // Add this line
  gitLog: Commit[];
  gitLogError?: string | null; // Added gitLogError prop
  onOpenSettingsDialog: () => void;
  commitCurrentPage: number;
  totalCommitPages: number;
  onCommitPageChange: (newPage: number) => void;
  onCommitClick: (commit: Commit) => void;
  branches: Branch[]; // Added branches prop
  selectedBranch: string | null; // Added selectedBranch prop
  onBranchChange: (branchName: string) => void; // Added onBranchChange prop
  contributors: Contributor[]; // Added contributors prop
  repositoryName: string; // Added repositoryName prop
  currentBranchForNotification?: string | null; // Added currentBranchForNotification prop
  repositoryConnected: boolean; // Added repositoryConnected prop
  // Chat props
  chatMessages: ChatMessage[];
  chatInput: string;
  onChatInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSendChatMessage: () => void;
  isSendingChatMessage: boolean;
  chatError: string | null;
  currentUserName: string | null;
  repoOwner?: string; // Added
  repoName?: string; // Added
  loadRepositoryData: (owner: string | null, repo: string | null, token: string, branch?: string | null, pageToLoad?: number) => Promise<void>;
  currentRepoOwner: string | null;
  currentRepoName: string | null;
  githubToken: string | null;
}

export function MainPanel({ 
  vscodeApi, // Destructure vscodeApi here
  gitLog, 
  onOpenSettingsDialog,
  commitCurrentPage,
  totalCommitPages,
  onCommitPageChange,
  onCommitClick,
  branches, // Added branches prop
  selectedBranch, // Added selectedBranch prop
  onBranchChange, // Added onBranchChange prop
  contributors, // Added contributors prop
  repositoryName, // Added repositoryName prop
  currentBranchForNotification, // Added currentBranchForNotification prop
  repositoryConnected, // Destructure repositoryConnected prop
  // Chat props
  chatMessages,
  chatInput,
  onChatInputChange,
  onSendChatMessage,
  isSendingChatMessage,
  chatError,
  currentUserName,
  repoOwner,      // Destructure
  repoName,        // Destructure
  loadRepositoryData,
  currentRepoOwner,
  currentRepoName,
  githubToken,
}: MainPanelProps) { 
  // console.log('[MainPanel - src/components/main-panel.tsx] Received gitLog prop with length:', gitLog?.length);
  // console.log('[MainPanel - src/components/main-panel.tsx] Received branches:', branches);
  // console.log('[MainPanel - src/components/main-panel.tsx] Received selectedBranch:', selectedBranch);
  const [syncStatus, setSyncStatus] = React.useState<'idle' | 'syncing' | 'synced'>('idle');
  const [activeTab, setActiveTab] = useState('activity');
  const [isPushing, setIsPushing] = useState(false);
  const { toast } = useToast();

  const handleSync = async () => {
    setSyncStatus('syncing');
    try {
      const repoPath = "C:\\Users\\snabi\\Downloads\\Compressed\\telegram-chatbot";
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoPath }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSyncStatus('synced');
        toast({ title: 'Repository synced!', description: data.pullOut || 'Fetched and pulled latest changes.' });
        // Refresh the activity feed after sync
        if (currentRepoOwner && currentRepoName && githubToken) {
          await loadRepositoryData(currentRepoOwner, currentRepoName, githubToken, selectedBranch, 1);
        }
        setTimeout(() => setSyncStatus('idle'), 2000);
      } else {
        setSyncStatus('idle');
        toast({ title: '❌ Sync failed', description: data.message || 'Unknown error', variant: 'destructive' });
      }
    } catch (e: any) {
      setSyncStatus('idle');
      toast({ title: '❌ Sync failed', description: e.message || 'Unknown error', variant: 'destructive' });
    }
  };

  const handlePushChanges = async () => {
    setIsPushing(true);
    try {
      // Use the correct local repo path for telegram-chatbot
      const repoPath = "C:\\Users\\snabi\\Downloads\\Compressed\\telegram-chatbot";
      const res = await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoPath }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.alreadyUpToDate) {
          toast({ title: 'No changes to push', description: 'Your branch is already up to date with remote.' });
        } else {
          toast({ title: '✅ Changes pushed to remote!', description: data.pushOut || 'Your changes have been pushed.' });
        }
        // Refresh the activity feed after push
        if (currentRepoOwner && currentRepoName && githubToken) {
          await loadRepositoryData(currentRepoOwner, currentRepoName, githubToken, selectedBranch, 1);
        }
      } else {
        toast({ title: '❌ Push failed', description: data.message || 'Unknown error', variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: '❌ Push failed', description: e.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[hsl(var(--background))] h-full overflow-hidden">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-card shadow-sm">
        <div className="flex items-center space-x-3">
          <GitFork className="h-5 w-5 text-primary" />
          <Select 
            value={selectedBranch || ''} 
            onValueChange={(value) => {
              if (value) {
                onBranchChange(value);
              }
            }}
          >
            <SelectTrigger className="w-[180px] h-9 bg-[hsl(var(--input))] text-foreground focus:ring-primary text-sm">
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent className="bg-popover text-popover-foreground">
              {branches && branches.length > 0 ? (
                branches.map((branch) => (
                  <SelectItem key={branch.name} value={branch.name}>
                    {branch.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-branches" disabled>No branches available</SelectItem>
              )}
            </SelectContent>
          </Select>
          {/* Settings Icon Button */}
          <Button variant="ghost" size="icon" aria-label="Settings" onClick={onOpenSettingsDialog}>
            <SettingsIcon className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleSync} className="text-muted-foreground hover:text-primary hover:bg-transparent px-2">
            {syncStatus === 'syncing' && <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />}
            {syncStatus === 'synced' && <CheckCircle className="mr-2 h-4 w-4 text-green-400" />}
            {syncStatus === 'idle' && <RefreshCw className="mr-2 h-4 w-4 text-primary" />}
            {syncStatus === 'syncing' ? 'Syncing...' : syncStatus === 'synced' ? 'Synced' : 'Sync'}
          </Button>
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handlePushChanges} disabled={isPushing}>
            <UploadCloud className="mr-2 h-4 w-4" />
            {isPushing ? 'Pushing...' : 'Push Changes'}
          </Button>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="activity" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-3 mt-3 bg-[hsl(var(--input))]">
          <TabsTrigger value="activity" className="text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">Activity Feed</TabsTrigger>
          <TabsTrigger value="tasks" className="text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">Tasks</TabsTrigger>
          <TabsTrigger value="chat" className="text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">Code Chat</TabsTrigger>
          <TabsTrigger value="ai-refactor" className="text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">AI Refactor</TabsTrigger>
        </TabsList>
        <TabsContent value="activity" className="flex-1 overflow-auto mt-0">
          {activeTab === 'activity' && (
            <ActivityFeed 
              commits={gitLog} 
              commitCurrentPage={commitCurrentPage}
              totalCommitPages={totalCommitPages}
              onCommitPageChange={onCommitPageChange}
              onCommitClick={onCommitClick} // Pass down onCommitClick
            />
          )}
        </TabsContent>
        <TabsContent value="tasks" className="flex-1 overflow-auto mt-0">
          <TasksBoard 
            contributors={contributors} 
            vscodeApi={vscodeApi} 
            repositoryName={repositoryName} // Pass the repositoryName prop
            repoOwner={repoOwner} // Pass repoOwner
            repoName={repoName}   // Pass repoName
            currentBranch={selectedBranch}
            assignerLogin={currentUserName} // Pass currentUserName as assignerLogin
          />
        </TabsContent>
        <TabsContent value="chat" className="flex-1 overflow-auto mt-0">
          <CodeChat 
            messages={chatMessages}
            chatInput={chatInput}
            onChatInputChange={onChatInputChange}
            onSendChatMessage={onSendChatMessage}
            isSendingChatMessage={isSendingChatMessage}
            chatError={chatError}
            currentUserName={currentUserName}
          />
        </TabsContent>
        <TabsContent value="ai-refactor" className="flex-1 overflow-auto mt-0">
          <AiRefactor />
        </TabsContent>
      </Tabs>
    </div>
  );
}

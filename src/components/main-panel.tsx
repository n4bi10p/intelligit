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

interface MainPanelProps {
  gitLog: Commit[];
  onOpenSettingsDialog: () => void;
  commitCurrentPage: number;
  totalCommitPages: number;
  onCommitPageChange: (newPage: number) => void;
  onCommitClick: (commit: Commit) => void;
  branches: Branch[]; // Added branches prop
  selectedBranch: string | null; // Added selectedBranch prop
  onBranchChange: (branchName: string) => void; // Added onBranchChange prop
  contributors: Contributor[]; // Added contributors prop
}

export function MainPanel({ 
  gitLog, 
  onOpenSettingsDialog,
  commitCurrentPage,
  totalCommitPages,
  onCommitPageChange,
  onCommitClick,
  branches, // Added branches prop
  selectedBranch, // Added selectedBranch prop
  onBranchChange, // Added onBranchChange prop
  contributors // Added contributors prop
}: MainPanelProps) { 
  console.log('[MainPanel - src/components/main-panel.tsx] Received gitLog prop with length:', gitLog?.length);
  console.log('[MainPanel - src/components/main-panel.tsx] Received branches:', branches);
  console.log('[MainPanel - src/components/main-panel.tsx] Received selectedBranch:', selectedBranch);
  const [syncStatus, setSyncStatus] = React.useState<'idle' | 'syncing' | 'synced'>('synced');
  const [activeTab, setActiveTab] = useState('activity');

  const handleSync = () => {
    setSyncStatus('syncing');
    setTimeout(() => {
      setSyncStatus('synced');
    }, 2000);
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
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <UploadCloud className="mr-2 h-4 w-4" />
            Push Changes
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
          <TasksBoard contributors={contributors} />
        </TabsContent>
        <TabsContent value="chat" className="flex-1 overflow-auto mt-0">
          <CodeChat />
        </TabsContent>
        <TabsContent value="ai-refactor" className="flex-1 overflow-auto mt-0">
          <AiRefactor />
        </TabsContent>
      </Tabs>
    </div>
  );
}

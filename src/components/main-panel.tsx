
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GitFork, UploadCloud, RefreshCw, CheckCircle, Loader2 } from 'lucide-react';
import { ActivityFeed } from './activity-feed';
import { TasksBoard } from './tasks-board';
import { CodeChat } from './code-chat';
import { AiRefactor } from './ai-refactor';

export function MainPanel() {
  const [syncStatus, setSyncStatus] = React.useState<'idle' | 'syncing' | 'synced'>('synced');
  const [currentBranch, setCurrentBranch] = React.useState('main');

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
          <Select value={currentBranch} onValueChange={setCurrentBranch}>
            <SelectTrigger className="w-[180px] h-9 bg-[hsl(var(--input))] text-foreground focus:ring-primary text-sm">
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent className="bg-popover text-popover-foreground">
              <SelectItem value="main">main</SelectItem>
              <SelectItem value="develop">develop</SelectItem>
              <SelectItem value="feature/new-ui">feature/new-ui</SelectItem>
              <SelectItem value="hotfix/login-bug">hotfix/login-bug</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-3">
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
          <ActivityFeed />
        </TabsContent>
        <TabsContent value="tasks" className="flex-1 overflow-auto mt-0">
          <TasksBoard />
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

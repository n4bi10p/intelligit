import { ActivityFeed } from '@/components/activity-feed';
import { AiRefactor } from '@/components/ai-refactor';
import { CodeChat } from '@/components/code-chat';
import { TasksBoard } from '@/components/tasks-board';
import { Commit } from '@/components/WebviewMessenger';
import { Button } from '@/components/ui/button';
import { SettingsIcon } from 'lucide-react';
import type { Contributor } from '@/types';

interface MainPanelProps {
  gitLog: Commit[];
  onOpenSettingsDialog: () => void;
  contributors: Contributor[];
}

export function MainPanel({ gitLog, onOpenSettingsDialog, contributors }: MainPanelProps) {
  const handleSettingsClick = () => {
    console.log('[MainPanel] Settings icon clicked');
    onOpenSettingsDialog();
  };

  return (
    <div className="flex-1 flex flex-col bg-muted/40">
      <header className="flex items-center justify-between h-16 px-6 border-b border-border">
        <h1 className="text-xl font-semibold">Project Starcoder</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleSettingsClick} aria-label="Open settings">
            <SettingsIcon className="h-5 w-5" />
          </Button>
        </div>
      </header>
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 overflow-auto">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <TasksBoard contributors={contributors} />
          <CodeChat />
        </div>
        <div className="flex flex-col gap-6">
          <ActivityFeed />
          <AiRefactor />
        </div>
      </div>
    </div>
  );
}

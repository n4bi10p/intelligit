
import { ActivityFeed } from '@/components/activity-feed';
import { AiRefactor } from '@/components/ai-refactor';
import { CodeChat } from '@/components/code-chat';
import { TasksBoard } from '@/components/tasks-board';
import { Commit } from '@/components/WebviewMessenger'; // Import the Commit interface

interface MainPanelProps {
  gitLog: Commit[]; // Define the gitLog prop
}

export function MainPanel({ gitLog }: MainPanelProps) { // Destructure gitLog from props
  return (
    <div className="flex-1 flex flex-col bg-muted/40">
      <header className="flex items-center justify-between h-16 px-6 border-b border-border">
        <h1 className="text-xl font-semibold">Project Starcoder</h1>
        {/* Add any header controls if needed */}
      </header>
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 overflow-auto">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <TasksBoard />
          <CodeChat />
        </div>
        <div className="flex flex-col gap-6">
          {/* Pass gitLog to ActivityFeed */}
          <ActivityFeed gitLog={gitLog} />
          <AiRefactor />
        </div>
      </div>
    </div>
  );
}

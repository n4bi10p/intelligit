import { CollabSidebar } from '@/components/collab-sidebar';
import { MainPanel } from '@/components/main-panel';
import WebviewMessenger from '@/components/WebviewMessenger';

export default function CodeCollabAIPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <main className="w-full max-w-7xl h-[calc(100vh-2rem)] flex rounded-lg shadow-2xl overflow-hidden border border-border">
        <CollabSidebar />
        <MainPanel />
      </main>
      <WebviewMessenger />
    </div>
  );
}

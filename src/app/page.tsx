"use client"; // Required for useState and useEffect

import { useState, useCallback } from 'react'; // Import useState and useCallback
import { CollabSidebar } from '@/components/collab-sidebar';
import { MainPanel } from '@/components/main-panel';
import WebviewMessenger, { Commit } from '@/components/WebviewMessenger'; // Import Commit interface

export default function CodeCollabAIPage() {
  const [gitLog, setGitLog] = useState<Commit[]>([]);
  const [gitLogError, setGitLogError] = useState<string | null>(null);

  const handleGitLogDataReceived = useCallback((logData: Commit[], error?: string) => {
    if (error) {
      console.error('[IntelliGit-Page] Error receiving git log:', error);
      setGitLogError(error);
      setGitLog([]); // Clear any existing log data
    } else {
      console.log('[IntelliGit-Page] Git log data received:', logData.length, 'commits');
      setGitLog(logData);
      setGitLogError(null); // Clear any previous error
    }
  }, []); // Empty dependency array means this function is created once

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <main className="w-full max-w-7xl h-[calc(100vh-2rem)] flex rounded-lg shadow-2xl overflow-hidden border border-border">
        <CollabSidebar />
        {/* Pass gitLog to MainPanel */}
        <MainPanel gitLog={gitLog} /> 
      </main>
      {/* Pass the handler to WebviewMessenger */}
      <WebviewMessenger onGitLogDataReceived={handleGitLogDataReceived} />
      {gitLogError && (
        <div style={{ color: 'red', marginTop: '10px', padding: '10px', border: '1px solid red', backgroundColor: '#ffe0e0' }}>
          <strong>Error fetching Git log:</strong> {gitLogError}
        </div>
      )}
    </div>
  );
}

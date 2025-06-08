"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Commit } from '@/components/WebviewMessenger'; // Import the Commit interface
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";

interface ActivityFeedProps {
  gitLog: Commit[]; // Define the gitLog prop
}

export function ActivityFeed({ gitLog }: ActivityFeedProps) {
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);

  console.log('[ActivityFeed] Received gitLog:', JSON.stringify(gitLog, null, 2)); // Log the received gitLog

  const handleCommitClick = (commit: Commit) => {
    setSelectedCommit(commit);
  };

  const handleCloseDialog = () => {
    setSelectedCommit(null);
  };

  // Helper to format date
  const formatDate = (dateString: string) => {
    if (!dateString) {
      return "No date provided";
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // console.warn(`[ActivityFeed] Invalid date string received: "${dateString}"`);
      return "Invalid Date"; // Explicitly return "Invalid Date" for unparsable strings
    }
    return date.toLocaleDateString("en-US", {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
    });
  };

  return (
    <Card className="h-full flex flex-col bg-transparent border-none shadow-none">
      {/* <CardHeader>
        <CardTitle>Activity Feed</CardTitle>
      </CardHeader> */}
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full p-0"> {/* Changed: Removed p-4 from ScrollArea, will add padding to items if needed */}
          {gitLog && gitLog.length > 0 ? (
            <ul className="space-y-2 p-1"> {/* Changed: Reduced space-y, added small padding to ul */}
              {gitLog.map((commit, index) => {
                // Check for missing hash and log it
                if (!commit || typeof commit.hash !== 'string' || commit.hash === '') {
                  console.warn('[ActivityFeed] Commit object missing or has invalid hash at index ' + index + ':', commit);
                }
                // Use commit hash + index for a guaranteed unique key within this list
                const key = `${commit?.hash || 'no-hash'}-${index}`;
                
                return (
                  <li key={key} className="list-none"> {/* Added list-none to li */}
                    <Card 
                      className="hover:shadow-md transition-shadow cursor-pointer bg-card border-border" // Added bg-card and border-border
                      onClick={() => handleCommitClick(commit)}
                    >
                      <CardContent className="p-3"> {/* Added CardContent with padding */}
                        <div className="font-medium text-sm truncate text-foreground" title={commit.subject}>{commit.subject}</div>
                        <div className="text-xs text-muted-foreground mt-1"> {/* Added mt-1 */}
                          {commit.authorName} - {formatDate(commit.date)}
                        </div>
                        {commit.refs && (
                          <div className="text-xs text-blue-500 mt-1 truncate" title={commit.refs}>
                            {commit.refs}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No recent activity or unable to fetch Git log.</p>
          )}
        </ScrollArea>
      </CardContent>
      {/* Optional: Footer for actions like refresh */} 
      {/* <CardFooter className="p-4 border-t border-border">
        <Button variant="outline" size="sm">Refresh</Button>
      </CardFooter> */}

      {selectedCommit && (
        <Dialog open={!!selectedCommit} onOpenChange={(isOpen) => !isOpen && handleCloseDialog()}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-lg truncate" title={selectedCommit.subject}>Commit: {selectedCommit.subject}</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {selectedCommit.hash.substring(0, 12)}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 py-4 text-sm max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                <span className="font-semibold">Author:</span>
                <span>{selectedCommit.authorName} &lt;{selectedCommit.authorEmail}&gt;</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                <span className="font-semibold">Date:</span>
                <span>{formatDate(selectedCommit.date)}</span>
              </div>
              {selectedCommit.parents && selectedCommit.parents.length > 0 && (
                 <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                    <span className="font-semibold">Parents:</span>
                    <span className="truncate">{selectedCommit.parents.join(', ')}</span>
                </div>
              )}
              {selectedCommit.refs && (
                <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                    <span className="font-semibold">Refs:</span>
                    <span className="truncate text-blue-500">{selectedCommit.refs}</span>
                </div>
              )}
              <div className="mt-2">
                <span className="font-semibold">Message:</span>
                <pre className="mt-1 p-2 bg-muted rounded-md whitespace-pre-wrap text-xs font-mono">
                  {selectedCommit.body || selectedCommit.subject} {/* Show body if exists, else subject again */}
                </pre>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
